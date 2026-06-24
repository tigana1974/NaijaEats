
-- 1. Fix order_items restrictive policy
DROP POLICY IF EXISTS "Customers mutate items only on pending orders" ON public.order_items;
CREATE POLICY "Customers mutate items only on pending orders"
ON public.order_items
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (o.customer_id = auth.uid() AND o.status = 'pending')
        OR o.customer_id <> auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (o.customer_id = auth.uid() AND o.status = 'pending')
        OR o.customer_id <> auth.uid()
      )
  )
);

-- 2. Vendors INSERT must be pending (unless admin)
DROP POLICY IF EXISTS "Vendors can create their own vendor record" ON public.vendors;
CREATE POLICY "Vendors can create their own vendor record"
ON public.vendors
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND (status = 'pending' OR public.has_role(auth.uid(), 'admin'))
);

-- 3. Prevent vendor self-approval / rating tampering via trigger
CREATE OR REPLACE FUNCTION public.prevent_vendor_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
    RAISE EXCEPTION 'Only admins can modify vendor status, featured flag, or ratings';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vendors_prevent_privileged_updates ON public.vendors;
CREATE TRIGGER vendors_prevent_privileged_updates
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.prevent_vendor_privileged_updates();
