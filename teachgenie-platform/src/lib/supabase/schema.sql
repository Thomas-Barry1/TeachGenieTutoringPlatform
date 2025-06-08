-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  user_type TEXT CHECK (user_type IN ('student', 'tutor')),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Tutor profiles
CREATE TABLE public.tutor_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE,
  bio TEXT,
  hourly_rate DECIMAL,
  is_verified BOOLEAN DEFAULT false,
  PRIMARY KEY (id)
);

-- Subject categories
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4(),
  name TEXT,
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
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  price DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Session payments
CREATE TABLE public.session_payments (
  id UUID DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions,
  amount DECIMAL,
  platform_fee DECIMAL,
  tutor_payout DECIMAL,
  stripe_payment_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions,
  student_id UUID REFERENCES public.profiles,
  tutor_id UUID REFERENCES public.tutor_profiles,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Chat rooms
CREATE TABLE public.chat_rooms (
  id UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
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
  content TEXT,
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
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'student'
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

CREATE POLICY "Create session payments"
  ON public.session_payments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

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