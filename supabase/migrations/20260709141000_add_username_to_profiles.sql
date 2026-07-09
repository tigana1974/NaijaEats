-- Add username column to profiles for @-handles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create an index to quickly find users by their username (for mentions or transfers)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
