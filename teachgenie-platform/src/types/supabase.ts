export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_id: string
          content: string
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_id: string
          content: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_type: 'student' | 'tutor'
          first_name: string
          last_name: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          user_type: 'student' | 'tutor'
          first_name: string
          last_name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          user_type?: 'student' | 'tutor'
          first_name?: string
          last_name?: string
          email?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 