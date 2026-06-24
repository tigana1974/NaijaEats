
DROP POLICY IF EXISTS "Conversation participants can subscribe" ON realtime.messages;
CREATE POLICY "Conversation participants can subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'messages:%' THEN
      public.is_conversation_participant(
        NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid,
        (SELECT auth.uid())
      )
    ELSE false
  END
);
