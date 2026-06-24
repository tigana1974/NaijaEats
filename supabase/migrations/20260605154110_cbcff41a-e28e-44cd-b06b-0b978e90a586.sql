-- Enums
CREATE TYPE public.order_status AS ENUM ('pending','accepted','preparing','ready','picked_up','delivered','cancelled');
CREATE TYPE public.delivery_status AS ENUM ('unassigned','assigned','picked_up','delivered','cancelled');

-- Tables (create all before policies to allow cross-references)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  delivery_address TEXT,
  customer_note TEXT,
  accepted_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id UUID,
  status public.delivery_status NOT NULL DEFAULT 'unassigned',
  pickup_address TEXT,
  dropoff_address TEXT,
  fee NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Customers create their own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers view their own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Vendors view their orders" ON public.orders
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid())
  );
CREATE POLICY "Vendors update their orders" ON public.orders
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid())
  );
CREATE POLICY "Riders view orders assigned to them" ON public.orders
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id = orders.id AND d.rider_id = auth.uid())
  );
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Order item policies
CREATE POLICY "Customers manage items for own orders" ON public.order_items
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.customer_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.customer_id = auth.uid())
  );
CREATE POLICY "Vendors view items for their orders" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_items.order_id AND v.owner_id = auth.uid()
    )
  );
CREATE POLICY "Riders view items for assigned orders" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.order_id = order_items.order_id AND d.rider_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage order items" ON public.order_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Delivery policies
CREATE POLICY "Riders can see unassigned or own deliveries" ON public.deliveries
  FOR SELECT TO authenticated USING (
    (status = 'unassigned' AND public.has_role(auth.uid(), 'rider'))
    OR rider_id = auth.uid()
  );
CREATE POLICY "Customer/vendor view delivery for their order" ON public.deliveries
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      LEFT JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = deliveries.order_id
        AND (o.customer_id = auth.uid() OR v.owner_id = auth.uid())
    )
  );
CREATE POLICY "Riders claim/update own delivery" ON public.deliveries
  FOR UPDATE TO authenticated USING (
    (rider_id = auth.uid())
    OR (status = 'unassigned' AND public.has_role(auth.uid(), 'rider'))
  ) WITH CHECK (rider_id = auth.uid());
CREATE POLICY "Vendors create delivery for own order" ON public.deliveries
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = deliveries.order_id AND v.owner_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage deliveries" ON public.deliveries
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers & indexes
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER deliveries_set_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_vendor_status ON public.orders(vendor_id, status);
CREATE INDEX idx_orders_customer ON public.orders(customer_id, created_at DESC);
CREATE INDEX idx_deliveries_rider ON public.deliveries(rider_id, status);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);