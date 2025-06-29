export type UserType = 'student' | 'tutor'

export interface Profile {
  id: string
  user_type: UserType
  first_name: string
  last_name: string
  email: string
  created_at: string
}

export interface TutorProfile {
  id: string
  bio: string | null
  hourly_rate: number | null
  is_verified: boolean
}

export interface Subject {
  id: string
  name: string
  category: string
  created_at: string
}

export interface TutorSubject {
  tutor_id: string
  subject_id: string
}

export interface Session {
  id: string
  tutor_id: string
  student_id: string
  subject_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  price: number
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_intent_id?: string
  created_at: string
}

export interface SessionPayment {
  id: string
  session_id: string
  amount: number
  platform_fee: number
  tutor_payout: number
  stripe_payment_intent_id?: string
  stripe_transfer_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
}

export interface Review {
  id: string
  session_id: string
  student_id: string
  tutor_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ChatRoom {
  id: string
  created_at: string
}

export interface ChatMessage {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface MessageNotification {
  id: string
  user_id: string
  message_id: string
  is_read: boolean
  created_at: string
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      tutor_profiles: {
        Row: TutorProfile
        Insert: Omit<TutorProfile, 'is_verified'>
        Update: Partial<Omit<TutorProfile, 'id'>>
      }
      subjects: {
        Row: Subject
        Insert: Omit<Subject, 'id' | 'created_at'>
        Update: Partial<Omit<Subject, 'id' | 'created_at'>>
      }
      tutor_subjects: {
        Row: TutorSubject
        Insert: TutorSubject
        Update: TutorSubject
      }
      sessions: {
        Row: Session
        Insert: Omit<Session, 'id' | 'created_at'>
        Update: Partial<Omit<Session, 'id' | 'created_at'>>
      }
      session_payments: {
        Row: SessionPayment
        Insert: Omit<SessionPayment, 'id' | 'created_at'>
        Update: Partial<Omit<SessionPayment, 'id' | 'created_at'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
      }
      chat_rooms: {
        Row: ChatRoom
        Insert: Omit<ChatRoom, 'id' | 'created_at'>
        Update: Partial<Omit<ChatRoom, 'id' | 'created_at'>>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at' | 'is_read' | 'read_at'>
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>
      }
      message_notifications: {
        Row: MessageNotification
        Insert: Omit<MessageNotification, 'id' | 'created_at' | 'is_read'>
        Update: Partial<Omit<MessageNotification, 'id' | 'created_at'>>
      }
    }
  }
} 