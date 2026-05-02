-- bids 테이블 RLS 정책
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own bids" ON public.bids;
DROP POLICY IF EXISTS "Customers can view bids on their requests" ON public.bids;
DROP POLICY IF EXISTS "Drivers can insert bids" ON public.bids;
DROP POLICY IF EXISTS "Drivers can update own pending bids" ON public.bids;
DROP POLICY IF EXISTS "Customers can accept bids on their requests" ON public.bids;

CREATE POLICY "Drivers can view own bids" ON public.bids
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Customers can view bids on their requests" ON public.bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.move_requests
      WHERE move_requests.id = bids.request_id
        AND move_requests.customer_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can insert bids" ON public.bids
  FOR INSERT WITH CHECK (
    auth.uid() = driver_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'driver'
    )
  );

CREATE POLICY "Drivers can update own pending bids" ON public.bids
  FOR UPDATE USING (
    auth.uid() = driver_id 
    AND status = 'pending'
  );

CREATE POLICY "Customers can accept bids on their requests" ON public.bids
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.move_requests
      WHERE move_requests.id = bids.request_id
        AND move_requests.customer_id = auth.uid()
    )
  );
