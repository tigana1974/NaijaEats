-- Migration to add reply_to_id to messages
ALTER TABLE public.messages
  ADD COLUMN reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
