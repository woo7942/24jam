-- 입찰 + 기사 정보를 안전하게 조회하는 함수
-- SECURITY DEFINER로 RLS를 우회하되, 함수 내부에서 권한 체크
DROP FUNCTION IF EXISTS public.get_bids_for_my_request(uuid);

CREATE OR REPLACE FUNCTION public.get_bids_for_my_request(p_request_id uuid)
RETURNS TABLE (
  id uuid,
  request_id uuid,
  driver_id uuid,
  price integer,
  message text,
  estimated_duration_min integer,
  status text,
  created_at timestamptz,
  driver_name text,
  driver_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 권한 체크: 본인 요청이거나, 그 요청에 입찰한 기사만 조회 가능
  IF NOT EXISTS (
    SELECT 1 FROM public.move_requests m
    WHERE m.id = p_request_id
      AND (
        m.customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.bids b
          WHERE b.request_id = m.id AND b.driver_id = auth.uid()
        )
      )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.request_id,
    b.driver_id,
    b.price,
    b.message,
    b.estimated_duration_min,
    b.status::text,
    b.created_at,
    u.name::text AS driver_name,
    u.phone::text AS driver_phone
  FROM public.bids b
  LEFT JOIN public.users u ON u.id = b.driver_id
  WHERE b.request_id = p_request_id
  ORDER BY b.price ASC;
END;

$$;

GRANT EXECUTE ON FUNCTION public.get_bids_for_my_request(uuid) TO authenticated;
