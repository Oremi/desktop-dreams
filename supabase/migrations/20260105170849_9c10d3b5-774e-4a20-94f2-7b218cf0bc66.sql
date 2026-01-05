-- Remove public read access from documents bucket
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- Update policies to only allow admin users
DROP POLICY IF EXISTS "Admin can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete documents" ON storage.objects;

-- Create admin-only policies using has_role function
CREATE POLICY "Admin can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));