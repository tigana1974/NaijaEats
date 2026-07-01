-- Collapse duplicate chef vendor types into one canonical "chef" type.
ALTER TYPE public.vendor_type RENAME TO vendor_type_old;

CREATE TYPE public.vendor_type AS ENUM ('restaurant', 'chef', 'grocery');

ALTER TABLE public.vendors
  ALTER COLUMN type TYPE public.vendor_type
  USING (
    CASE
      WHEN type::text IN ('home_chef', 'personal_chef') THEN 'chef'
      ELSE type::text
    END
  )::public.vendor_type;

DROP TYPE public.vendor_type_old;
