
DROP POLICY IF EXISTS "Public update employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload employee photos" ON storage.objects;

UPDATE storage.buckets SET public = false WHERE id = 'employee-photos';

-- Allow admins to read photos via standard storage API (needed for createSignedUrl)
DROP POLICY IF EXISTS "Admins read employee photos" ON storage.objects;
CREATE POLICY "Admins read employee photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'employee-photos' AND has_role(auth.uid(), 'admin'::app_role));
