
-- 1) Realtime channel subscription RLS
-- Topic convention used by clients: 'conversation:{conversation_id}'
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can subscribe" ON realtime.messages;
CREATE POLICY "Conversation participants can subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'conversation:%' THEN
      public.is_conversation_participant(
        NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid,
        (SELECT auth.uid())
      )
    ELSE false
  END
);

-- 2) Avatars bucket: restrict reads to owner folder
DROP POLICY IF EXISTS "Avatars are viewable by authenticated users" ON storage.objects;
CREATE POLICY "Users can read their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3) Fix inverted restrictive policy on order_items
DROP POLICY IF EXISTS "Customers mutate items only on pending orders" ON public.order_items;
CREATE POLICY "Customers mutate items only on pending orders"
ON public.order_items
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.customer_id <> (SELECT auth.uid())            -- not the customer's row: not their restriction
        OR (o.customer_id = (SELECT auth.uid()) AND o.status = 'pending'::public.order_status)
      )
  )
)
WITH CHECK (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.customer_id <> (SELECT auth.uid())
        OR (o.customer_id = (SELECT auth.uid()) AND o.status = 'pending'::public.order_status)
      )
  )
);

-- 4) Revoke EXECUTE from anon/public on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_order_delivery() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_vendor_privileged_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
