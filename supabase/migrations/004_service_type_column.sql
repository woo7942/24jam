-- service_type ENUM 타입 생성 (이미 존재하면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
    CREATE TYPE service_type AS ENUM ('general', 'half_packing', 'full_packing');
  END IF;
END $$;

-- move_requests 테이블에 service_type 컬럼 추가 (이미 있으면 무시)
ALTER TABLE public.move_requests 
  ADD COLUMN IF NOT EXISTS service_type service_type DEFAULT 'general';

-- estimated_price_min/max를 nullable로 변경
ALTER TABLE public.move_requests 
  ALTER COLUMN estimated_price_min DROP NOT NULL;

ALTER TABLE public.move_requests 
  ALTER COLUMN estimated_price_max DROP NOT NULL;
