-- ============================================
-- FRIENDS HUB DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  nickname TEXT,
  birthdate DATE,
  bank_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  checklist JSONB DEFAULT '[]',
  costs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_event ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES
-- ============================================

DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view messages" ON messages;
DROP POLICY IF EXISTS "Everyone can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Everyone can view photos" ON photos;
DROP POLICY IF EXISTS "Everyone can insert photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON photos;
DROP POLICY IF EXISTS "Everyone can view events" ON events;
DROP POLICY IF EXISTS "Everyone can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "Authenticated users can view participants" ON event_participants;
DROP POLICY IF EXISTS "Users can join events as self" ON event_participants;
DROP POLICY IF EXISTS "Users can leave events as self" ON event_participants;

-- Profiles policies
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Messages policies
CREATE POLICY "Authenticated users can view messages" ON messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "Authenticated users can view photos" ON photos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Authenticated users can view events" ON events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own events" ON events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can delete own events" ON events
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Event participant policies
CREATE POLICY "Authenticated users can view participants" ON event_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join events as self" ON event_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events as self" ON event_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO NOTHING;
UPDATE storage.buckets SET public = false WHERE id = 'photos';

DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Allow authenticated users to read photos and write only inside their user-id folder.
CREATE POLICY "Authenticated users can read photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'photos');
CREATE POLICY "Users can upload photos to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);


-- Add end_date column to events table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE events ADD COLUMN end_date DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'is_multi_day'
  ) THEN
    ALTER TABLE events ADD COLUMN is_multi_day BOOLEAN DEFAULT false;
  END IF;
END $$;
