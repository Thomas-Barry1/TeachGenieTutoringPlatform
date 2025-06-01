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
  session_id UUID REFERENCES public.sessions,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4(),
  chat_room_id UUID REFERENCES public.chat_rooms,
  sender_id UUID REFERENCES public.profiles,
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tutor profiles policies
CREATE POLICY "Tutor profiles are viewable by everyone"
  ON public.tutor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Tutors can update their own profile"
  ON public.tutor_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = tutor_id OR auth.uid() = student_id);

CREATE POLICY "Users can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Students can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Chat policies
CREATE POLICY "Users can view their own chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = chat_rooms.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.student_id = auth.uid())
    )
  );

CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_messages.chat_room_id
      AND EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = chat_rooms.session_id
        AND (sessions.tutor_id = auth.uid() OR sessions.student_id = auth.uid())
      )
    )
  ); 