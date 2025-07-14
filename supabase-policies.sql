-- Enable RLS on students_list table
ALTER TABLE students_list ENABLE ROW LEVEL SECURITY;

-- Allow all operations (permissions handled in frontend)
CREATE POLICY "Allow all" ON students_list
FOR SELECT
USING (true);

CREATE POLICY "Allow all" ON students_list
FOR INSERT
USING (true);

CREATE POLICY "Allow all" ON students_list
FOR DELETE
USING (true);

CREATE POLICY "Allow all" ON students_list
FOR UPDATE
USING (true);

-- Enable RLS on fees table
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Allow all operations on fees table (permissions handled in frontend)
CREATE POLICY "Allow all" ON fees
FOR SELECT
USING (true);

CREATE POLICY "Allow all" ON fees
FOR INSERT
USING (true);

CREATE POLICY "Allow all" ON fees
FOR DELETE
USING (true);

CREATE POLICY "Allow all" ON fees
FOR UPDATE
USING (true);

-- Enable RLS on results table
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Allow all operations on results table (permissions handled in frontend)
CREATE POLICY "Allow all" ON results
FOR SELECT
USING (true);

CREATE POLICY "Allow all" ON results
FOR INSERT
USING (true);

CREATE POLICY "Allow all" ON results
FOR DELETE
USING (true);

CREATE POLICY "Allow all" ON results
FOR UPDATE
USING (true);

-- Storage bucket policies for school-files (allow all operations)
-- Allow all uploads
CREATE POLICY "Allow all uploads" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'school-files');

-- Allow all downloads
CREATE POLICY "Allow all downloads" ON storage.objects
FOR SELECT
USING (bucket_id = 'school-files');

-- Allow all updates
CREATE POLICY "Allow all updates" ON storage.objects
FOR UPDATE
USING (bucket_id = 'school-files');

-- Allow all deletes
CREATE POLICY "Allow all deletes" ON storage.objects
FOR DELETE
USING (bucket_id = 'school-files'); 