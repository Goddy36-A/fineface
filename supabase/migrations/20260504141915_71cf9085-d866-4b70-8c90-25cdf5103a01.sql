-- Add a jsonb array to hold multiple descriptors per employee
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS face_descriptors jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: wrap each existing single descriptor into an array of one
UPDATE public.employees
SET face_descriptors = jsonb_build_array(face_descriptor)
WHERE (face_descriptors IS NULL OR face_descriptors = '[]'::jsonb)
  AND face_descriptor IS NOT NULL;