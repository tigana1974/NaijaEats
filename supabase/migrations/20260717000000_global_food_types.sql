-- Create global_food_types table
CREATE TABLE IF NOT EXISTS public.global_food_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  emoji TEXT,
  image_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.global_food_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read food types"
  ON public.global_food_types
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert food types"
  ON public.global_food_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert initial types based on Discover categories
INSERT INTO public.global_food_types (name, emoji) VALUES
('Jollof', '🍚'),
('Suya', '🍢'),
('Soups', '🍲'),
('Swallow', '🥘'),
('Rice', '🍛'),
('Grills', '🍗'),
('Snacks', '🍩'),
('Drinks', '🧋')
ON CONFLICT (name) DO NOTHING;

-- Add food_type_id to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS food_type_id UUID REFERENCES public.global_food_types(id) ON DELETE SET NULL;
