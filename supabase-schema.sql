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

-- Create events table before tables that reference it
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  is_multi_day BOOLEAN DEFAULT false,
  checklist JSONB DEFAULT '[]',
  costs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'hub' CHECK (type IN ('hub', 'event')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat members table
CREATE TABLE IF NOT EXISTS chat_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chat_id UUID,
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

-- Create event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Ensure newer columns exist for older installs
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN chat_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_chat_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_chat_id_fkey
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Seed the permanent Hub chat and move existing messages into it
INSERT INTO chats (id, title, type, is_pinned)
VALUES ('00000000-0000-0000-0000-000000000001', 'Hub', 'hub', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  is_pinned = EXCLUDED.is_pinned;

UPDATE messages
SET chat_id = '00000000-0000-0000-0000-000000000001'
WHERE chat_id IS NULL;

ALTER TABLE messages
  ALTER COLUMN chat_id SET DEFAULT '00000000-0000-0000-0000-000000000001',
  ALTER COLUMN chat_id SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
CREATE INDEX IF NOT EXISTS idx_chats_event ON chats(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_event_unique ON chats(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON chat_members(chat_id);
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
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Make newly added tables available through the authenticated Data API.
GRANT SELECT, INSERT, UPDATE, DELETE ON chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON messages TO authenticated;

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
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Members can view chat messages" ON messages;
DROP POLICY IF EXISTS "Members can insert chat messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON messages;

DROP POLICY IF EXISTS "Authenticated users can view chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Chat creators can update chats" ON chats;
DROP POLICY IF EXISTS "Chat creators can delete chats" ON chats;
DROP POLICY IF EXISTS "Users can view available chats" ON chats;
DROP POLICY IF EXISTS "Users can create owned chats" ON chats;
DROP POLICY IF EXISTS "Users can update owned chats" ON chats;
DROP POLICY IF EXISTS "Users can delete owned chats" ON chats;

DROP POLICY IF EXISTS "Authenticated users can view chat members" ON chat_members;
DROP POLICY IF EXISTS "Chat creators can manage members" ON chat_members;
DROP POLICY IF EXISTS "Users can view their chat memberships" ON chat_members;
DROP POLICY IF EXISTS "Chat owners can add members" ON chat_members;
DROP POLICY IF EXISTS "Chat owners can remove members" ON chat_members;

DROP POLICY IF EXISTS "Everyone can view photos" ON photos;
DROP POLICY IF EXISTS "Everyone can insert photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;

DROP POLICY IF EXISTS "Everyone can view events" ON events;
DROP POLICY IF EXISTS "Everyone can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
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

-- Chat policies
CREATE POLICY "Users can view available chats" ON chats
  FOR SELECT TO authenticated USING (
    type = 'hub'
    OR (
      (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM chat_members
          WHERE chat_members.chat_id = chats.id
            AND chat_members.user_id = auth.uid()
        )
      )
      AND EXISTS (
        SELECT 1
        FROM events
        WHERE events.id = chats.event_id
          AND COALESCE(events.end_date, events.event_date) >= CURRENT_DATE
      )
    )
  );

CREATE POLICY "Users can create owned chats" ON chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update owned chats" ON chats
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete owned chats" ON chats
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Chat member policies
CREATE POLICY "Users can view their chat memberships" ON chat_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chat owners can add members" ON chat_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1
      FROM chats
      WHERE chats.id = chat_members.chat_id
        AND chats.created_by = auth.uid()
    )
  );

CREATE POLICY "Chat owners can remove members" ON chat_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM chats
      WHERE chats.id = chat_members.chat_id
        AND chats.created_by = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Members can view chat messages" ON messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM chats
      WHERE chats.id = messages.chat_id
        AND (
          chats.type = 'hub'
          OR (
            EXISTS (
              SELECT 1
              FROM chat_members
              WHERE chat_members.chat_id = messages.chat_id
                AND chat_members.user_id = auth.uid()
            )
            AND EXISTS (
              SELECT 1
              FROM events
              WHERE events.id = chats.event_id
                AND COALESCE(events.end_date, events.event_date) >= CURRENT_DATE
            )
          )
        )
    )
  );

CREATE POLICY "Members can insert chat messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM chats
      WHERE chats.id = messages.chat_id
        AND (
          chats.type = 'hub'
          OR (
            EXISTS (
              SELECT 1
              FROM chat_members
              WHERE chat_members.chat_id = messages.chat_id
                AND chat_members.user_id = auth.uid()
            )
            AND EXISTS (
              SELECT 1
              FROM events
              WHERE events.id = chats.event_id
                AND COALESCE(events.end_date, events.event_date) >= CURRENT_DATE
            )
          )
        )
    )
  );

CREATE POLICY "Users can delete own chat messages" ON messages
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
