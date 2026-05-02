-- 기사가 자신이 매칭된(선택된) 요청 + 고객 정보 조회
DROP FUNCTION IF EXISTS public.get_my_matched_requests();

CREATE OR REPLACE FUNCTION public.get_my_matched_requests()
RETURNS TABLE (
  bid_id uuid,
  request_id uuid,
  price integer,
  message text,
  estimated_duration_min integer,
  bid_created_at timestamptz,
  from_address text,
  to_address text,
  preferred_date date,
  time_slot text,
  service_type text,
  move_type text,
  box_count integer,
  notes text,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  request_status text,
  matched_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bid_id,
    m.id AS request_id,
    b.price,
    b.message,
    b.estimated_duration_min,
    b.created_at AS bid_created_at,
    m.from_address::text,
    m.to_address::text,
    m.preferred_date,
    m.time_slot::text,
    m.service_type::text,
    m.move_type::text,
    m.box_count,
    m.notes::text,
    u.id AS customer_id,
    u.name::text AS customer_name,
    u.phone::text AS customer_phone,
    m.status::text AS request_status,
    b.updated_at AS matched_at
  FROM public.bids b
  JOIN public.move_requests m ON m.id = b.request_id
  LEFT JOIN public.users u ON u.id = m.customer_id
  WHERE b.driver_id = auth.uid()
    AND b.status = 'selected'
  ORDER BY b.updated_at DESC;
END;

$$;

GRANT EXECUTE ON FUNCTION public.get_my_matched_requests() TO authenticated;
