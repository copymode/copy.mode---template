-- Create content_types table
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create bucket for content type avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('content.type.avatars', 'content.type.avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for content types
-- Allow all authenticated users to view content types
CREATE POLICY "Content types are viewable by all authenticated users"
  ON content_types FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow only admins to insert/update/delete content types
CREATE POLICY "Only admins can insert content types"
  ON content_types FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Only admins can update content types"
  ON content_types FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Only admins can delete content types"
  ON content_types FOR DELETE
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Policies for content type avatars
CREATE POLICY "Avatar images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content.type.avatars');

CREATE POLICY "Only admins can upload content type avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'content.type.avatars' AND
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );

CREATE POLICY "Only admins can update content type avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'content.type.avatars' AND
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );

CREATE POLICY "Only admins can delete content type avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'content.type.avatars' AND
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  ); 