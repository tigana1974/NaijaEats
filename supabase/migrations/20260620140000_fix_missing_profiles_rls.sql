-- Critical pre-existing bug, found while building admin customer insights:
-- public.profiles has ENABLE ROW LEVEL SECURITY with *no policies at all*
-- anywhere in the migration history. RLS with zero policies denies every
-- operation to non-bypass roles, including the row's own owner. The only
-- reason this hasn't been visibly broken everywhere is that profile rows
-- are created via the handle_new_user() SECURITY DEFINER trigger, which
-- bypasses RLS for that one INSERT — but every direct client SELECT/UPDATE
-- of profiles (account page, personal-info page, any admin lookup) silently
-- returns/affects zero rows. This adds the missing policies.

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Vendors/riders/admins legitimately need to see a counterpart's display
-- name in the course of an order — e.g. a vendor reading a customer's name
-- on an order, or an admin reading a rider's name. Scope this narrowly to
-- "you appear together on at least one order/delivery/conversation" rather
-- than opening profiles to every authenticated user.
CREATE POLICY "Counterparts view profile via shared order"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE (o.customer_id = profiles.id OR v.owner_id = profiles.id)
        AND (o.customer_id = auth.uid() OR v.owner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.deliveries d
      JOIN public.orders o ON o.id = d.order_id
      WHERE (d.rider_id = profiles.id OR o.customer_id = profiles.id)
        AND (d.rider_id = auth.uid() OR o.customer_id = auth.uid())
    )
  );

CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
