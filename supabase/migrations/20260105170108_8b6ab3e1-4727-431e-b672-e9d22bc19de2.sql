-- Create documents bucket (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Allow authenticated users to upload documents
CREATE POLICY "Admin can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update documents
CREATE POLICY "Admin can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Admin can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Allow public read access for sharing document links
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');