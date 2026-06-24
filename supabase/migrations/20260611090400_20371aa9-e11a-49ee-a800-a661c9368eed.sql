
-- Speed up ORDER BY created_at DESC LIMIT N (admin orders listing)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- Optimize RLS: wrap auth.uid() / has_role() in subselects so Postgres
-- evaluates them once per query (initplan) instead of once per row.
DROP POLICY IF EXISTS "Customers view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors view their orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors update their orders" ON public.orders;
DROP POLICY IF EXISTS "Riders view orders assigned to them" ON public.orders;
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "Restrict order updates to vendor or admin" ON public.orders;

CREATE POLICY "Admins manage orders"
ON public.orders FOR ALL
USING ((SELECT public.has_role(auth.uid(), 'admin'::public.app_role)))
WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "Customers view their own orders"
ON public.orders FOR SELECT
USING (customer_id = (SELECT auth.uid()));

CREATE POLICY "Vendors view their orders"
ON public.orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendors v
  WHERE v.id = orders.vendor_id AND v.owner_id = (SELECT auth.uid())
));

CREATE POLICY "Vendors update their orders"
ON public.orders FOR UPDATE
USING (
  (SELECT public.has_role(auth.uid(), 'admin'::public.app_role))
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = orders.vendor_id AND v.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (SELECT public.has_role(auth.uid(), 'admin'::public.app_role))
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = orders.vendor_id AND v.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Riders view orders assigned to them"
ON public.orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.deliveries d
  WHERE d.order_id = orders.id AND d.rider_id = (SELECT auth.uid())
));
