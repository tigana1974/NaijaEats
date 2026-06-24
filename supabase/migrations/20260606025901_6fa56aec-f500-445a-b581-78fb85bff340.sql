
-- Tighten rider claim/update policy to require rider role on both branches
DROP POLICY IF EXISTS "Riders claim/update own delivery" ON public.deliveries;
CREATE POLICY "Riders claim/update own delivery"
ON public.deliveries
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'rider'::app_role)
  AND (rider_id = auth.uid() OR status = 'unassigned'::delivery_status)
)
WITH CHECK (rider_id = auth.uid());

-- Restrict menu_categories public read to approved vendors
DROP POLICY IF EXISTS "Anyone can view menu categories" ON public.menu_categories;
CREATE POLICY "Approved vendor categories are viewable"
ON public.menu_categories
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = menu_categories.vendor_id
      AND (
        v.status = 'approved'::vendor_status
        OR v.owner_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

-- Restrict menu_items public read to approved vendors
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Approved vendor items are viewable"
ON public.menu_items
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = menu_items.vendor_id
      AND (
        v.status = 'approved'::vendor_status
        OR v.owner_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
      )
  )
);
