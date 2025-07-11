-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'tutor')),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Tutor profiles
CREATE TABLE public.tutor_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE,
  bio TEXT,
  hourly_rate DECIMAL CHECK (hourly_rate > 0),
  is_verified BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  PRIMARY KEY (id)
);

-- Subject categories
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Tutor subjects (many-to-many)
CREATE TABLE public.tutor_subjects (
  tutor_id UUID REFERENCES public.tutor_profiles ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE CASCADE,
  PRIMARY KEY (tutor_id, subject_id)
);

-- Sessions
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES public.tutor_profiles,
  student_id UUID REFERENCES public.profiles,
  subject_id UUID REFERENCES public.subjects,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  price DECIMAL CHECK (price >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Session payments
CREATE TABLE public.session_payments (
  id UUID DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions,
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  platform_fee DECIMAL CHECK (platform_fee >= 0),
  tutor_payout DECIMAL CHECK (tutor_payout >= 0),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions,
  student_id UUID REFERENCES public.profiles,
  tutor_id UUID REFERENCES public.tutor_profiles,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id),
  UNIQUE(session_id, student_id) -- Prevent multiple reviews per session per student
);

-- Chat rooms
CREATE TABLE public.chat_rooms (
  id UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
  PRIMARY KEY (id)
);

-- Chat participants (many-to-many)
CREATE TABLE public.chat_participants (
  chat_room_id UUID REFERENCES public.chat_rooms ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (chat_room_id, user_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4(),
  chat_room_id UUID REFERENCES public.chat_rooms ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Message notifications
CREATE TABLE public.message_notifications (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles,
  message_id UUID REFERENCES public.chat_messages,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- External reviews (from other platforms like Google, Yelp, Wyzant)
CREATE TABLE public.external_reviews (
  id UUID DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES public.tutor_profiles ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('google', 'yelp', 'wyzant', 'superprof', 'varsity tutors','other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Performance Indexes (Speed up common queries)
CREATE INDEX IF NOT EXISTS idx_sessions_tutor_id ON public.sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON public.sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_status ON public.sessions(payment_status);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_intent_id ON public.sessions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_id ON public.reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON public.reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_verified ON public.tutor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_session_payments_session_id ON public.session_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_status ON public.session_payments(status);
CREATE INDEX IF NOT EXISTS idx_session_payments_stripe_payment_intent_id ON public.session_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_tutor_id ON public.external_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_source_platform ON public.external_reviews(source_platform);
CREATE INDEX IF NOT EXISTS idx_external_reviews_created_at ON public.external_reviews(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies by table
-- Profiles policies
DROP POLICY IF EXISTS "View own profile" ON public.profiles;

-- Create policies by table
-- Profiles policies
CREATE POLICY "View own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "View verified tutors"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tutor_profiles
      WHERE tutor_profiles.id = profiles.id
    )
  );

CREATE POLICY "View chat participant profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp1
      JOIN public.chat_participants cp2 ON cp1.chat_room_id = cp2.chat_room_id
      WHERE cp1.user_id = auth.uid()
      AND cp2.user_id = profiles.id
    )
  );

CREATE POLICY "Update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Create new profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "View reviewer profiles for tutor reviews"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.student_id = profiles.id
    )
    AND auth.role() = 'authenticated'
  );

-- Tutor profiles policies
CREATE POLICY "View all tutor profiles"
  ON public.tutor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Update own tutor profile"
  ON public.tutor_profiles FOR UPDATE
  USING (
    auth.uid() = id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'tutor'
    )
  );

CREATE POLICY "Create new tutor profile"
  ON public.tutor_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'tutor'
    )
  );

CREATE POLICY "Delete own tutor profile"
  ON public.tutor_profiles FOR DELETE
  USING (
    auth.uid() = id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'tutor'
    )
  );

-- Subjects policies
CREATE POLICY "View all subjects"
  ON public.subjects FOR SELECT
  USING (true);

-- Tutor subjects policies
CREATE POLICY "View all tutor subjects"
  ON public.tutor_subjects FOR SELECT
  USING (true);

CREATE POLICY "Manage own tutor subjects"
  ON public.tutor_subjects FOR ALL
  USING (
    auth.uid() = tutor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'tutor'
    )
  );

-- Sessions policies
CREATE POLICY "View own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = tutor_id OR 
    auth.uid() = student_id
  );

CREATE POLICY "Create new session"
  ON public.sessions FOR INSERT
  WITH CHECK (
    auth.uid() = tutor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'tutor'
    )
  );

CREATE POLICY "Update own tutor sessions"
  ON public.sessions FOR UPDATE
  USING (
    auth.uid() = tutor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'tutor'
    )
  );

CREATE POLICY "Delete scheduled sessions"
  ON public.sessions FOR DELETE
  USING (
    (auth.uid() = tutor_id OR auth.uid() = student_id) AND
    status = 'scheduled'
  );

CREATE POLICY "Delete completed or cancelled sessions"
  ON public.sessions FOR DELETE
  USING (
    auth.uid() = tutor_id AND
    status IN ('completed', 'cancelled')
  );

-- Session payments policies
CREATE POLICY "View own session payments"
  ON public.session_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_payments.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.student_id = auth.uid())
    )
  );

CREATE POLICY "Create session payments for own sessions"
  ON public.session_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_payments.session_id
      AND sessions.student_id = auth.uid()
    )
  );

CREATE POLICY "Update session payments"
  ON public.session_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_payments.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.student_id = auth.uid())
    )
  );

-- Add RLS policies for sessions payment fields
CREATE POLICY "Update own sessions payment status"
  ON public.sessions FOR UPDATE
  USING (
    auth.uid() = tutor_id OR 
    auth.uid() = student_id
  );

-- Reviews policies
CREATE POLICY "View all reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Create session review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = reviews.session_id
      AND sessions.student_id = auth.uid()
      AND sessions.status = 'completed'
    )
  );

CREATE POLICY "Update own review"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Delete own review"
  ON public.reviews FOR DELETE
  USING (auth.uid() = student_id);

-- Chat rooms policies
CREATE POLICY "View own chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Create new chat room"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Chat participants policies
CREATE POLICY "View chat room members"
  ON public.chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_participants.chat_room_id
      AND (
        -- For direct messages, check if user is a participant
        EXISTS (
          SELECT 1 FROM public.chat_participants cp2
          WHERE cp2.chat_room_id = chat_rooms.id
          AND cp2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Add chat room members"
  ON public.chat_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_participants.chat_room_id
      AND (
        -- For direct messages, check if user is a participant
        EXISTS (
          SELECT 1 FROM public.chat_participants cp2
          WHERE cp2.chat_room_id = chat_rooms.id
          AND cp2.user_id = auth.uid()
        )
      )
    )
  );

-- Chat messages policies
CREATE POLICY "View chat room messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_room_id = chat_messages.chat_room_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Send chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_room_id = chat_messages.chat_room_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Message notifications policies
CREATE POLICY "View own notifications"
  ON public.message_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Update own notifications"
  ON public.message_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Create notifications"
  ON public.message_notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- External reviews policies
CREATE POLICY "View all external reviews"
  ON public.external_reviews FOR SELECT
  USING (true);

CREATE POLICY "Create external review"
  ON public.external_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = tutor_id AND
    EXISTS (
      SELECT 1 FROM public.tutor_profiles
      WHERE tutor_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Update external review"
  ON public.external_reviews FOR UPDATE
  USING (auth.uid() = tutor_id);

CREATE POLICY "Delete external review"
  ON public.external_reviews FOR DELETE
  USING (auth.uid() = tutor_id);

-- Storage bucket policies for profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to select and update any session
CREATE POLICY "Service role can select any session"
  ON public.sessions FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update any session"
  ON public.sessions FOR UPDATE
  USING (auth.role() = 'service_role');

-- Allow service role to select and update any session payment
CREATE POLICY "Service role can select any session payment"
  ON public.session_payments FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update any session payment"
  ON public.session_payments FOR UPDATE
  USING (auth.role() = 'service_role'); 