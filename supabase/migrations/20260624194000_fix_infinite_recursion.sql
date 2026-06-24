-- Create SECURITY DEFINER functions to break the infinite recursion between orders and deliveries RLS policies

-- Helper to check if a user is the customer or vendor owner for an order
CREATE OR REPLACE FUNCTION public.is_customer_or_vendor_for_order(_order_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = _order_id AND (o.customer_id = auth.uid() OR v.owner_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Helper to check if a user is the rider for an order
CREATE OR REPLACE FUNCTION public.is_rider_for_order(_order_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.order_id = _order_id AND d.rider_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- Now redefine the policies to use these functions so they bypass RLS during the check, breaking the cycle

-- 1. Fix deliveries policy
DROP POLICY IF EXISTS "Customer/vendor view delivery for their order" ON public.deliveries;
CREATE POLICY "Customer/vendor view delivery for their order" ON public.deliveries
  FOR SELECT TO authenticated USING (
    public.is_customer_or_vendor_for_order(order_id)
  );

-- 2. Fix orders policy
DROP POLICY IF EXISTS "Riders view orders assigned to them" ON public.orders;
CREATE POLICY "Riders view orders assigned to them" ON public.orders
  FOR SELECT TO authenticated USING (
    public.is_rider_for_order(id)
  );
