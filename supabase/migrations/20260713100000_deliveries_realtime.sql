-- Live rider job board: broadcast deliveries changes so online riders see new
-- jobs (and jobs claimed by others) instantly instead of on the next poll.
-- Realtime respects RLS, so riders only receive rows they can already SELECT.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'deliveries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
  END IF;
END $$;
