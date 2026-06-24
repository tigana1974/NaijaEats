-- 1) Tighten order_items restrictive policy: remove vendor/rider pass-through
DROP POLICY IF EXISTS "Customers mutate items only on pending orders" ON public.order_items;

CREATE POLICY "Restrict order_items mutations"
ON public.order_items
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id = (SELECT auth.uid())
      AND o.status = 'pending'::order_status
  )
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id = (SELECT auth.uid())
      AND o.status = 'pending'::order_status
  )
);

-- 2) Realtime: restrict 'conversations:*' topic subscriptions to participants only.
-- Existing 'messages:%' policy is retained; this adds participant-only access for
-- any 'conversations:{id}' topic and denies all other conversation topics.
DROP POLICY IF EXISTS "Participants can read conversation topics" ON realtime.messages;

CREATE POLICY "Participants can read conversation topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'conversations:%')
  AND public.is_conversation_participant(
    NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid,
    (SELECT auth.uid())
  )
);