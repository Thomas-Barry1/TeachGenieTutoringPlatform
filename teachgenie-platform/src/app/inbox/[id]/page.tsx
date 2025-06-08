'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ChatParticipant {
  user_id: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ChatParticipantResponse {
  user_id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ChatMessageResponse {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function ConversationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<ChatParticipant | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    }
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    async function fetchConversation() {
      if (!currentUserId || !id) return;

      try {
        // Verify user is a participant in this chat room
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select(`
            user_id,
            user:user_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('chat_room_id', id)
          .returns<ChatParticipantResponse[]>();

        console.log('Raw participants response:', participants);
        console.log('Participants error:', participantsError);

        if (participantsError) {
          throw participantsError;
        }

        // Check if current user is a participant
        const isParticipant = participants?.some(p => p.user_id === currentUserId);
        if (!isParticipant) {
          router.push('/inbox');
          return;
        }

        // Get the other participant
        const other = participants?.find(p => p.user_id !== currentUserId);
        console.log('Other participant raw data:', other);

        // Let's also try a direct profile query to verify RLS
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', other?.user_id)
          .single();

        console.log('Direct profile query:', profileData);
        console.log('Profile query error:', profileError);

        if (profileError) {
          throw profileError;
        }

        if (other) {
          console.log('Setting other participant with data:', {
            user_id: other.user_id,
            profiles: other.user
          });
          setOtherParticipant({
            user_id: other.user_id,
            profiles: other.user
          });
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            sender_id,
            is_read,
            created_at,
            sender:sender_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('chat_room_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          throw messagesError;
        }

        const typedMessages = (messages || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          is_read: msg.is_read,
          created_at: msg.created_at,
          profiles: msg.sender
        })) as unknown as ChatMessage[];

        setMessages(typedMessages);

        // Mark unread messages as read
        const unreadMessages = typedMessages.filter(
          m => !m.is_read && m.sender_id !== currentUserId
        );

        if (unreadMessages.length) {
          const { error: updateError } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in(
              'id',
              unreadMessages.map(m => m.id)
            );

          if (updateError) {
            console.error('Error marking messages as read:', updateError);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    }

    fetchConversation();
  }, [supabase, currentUserId, id, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !id || !newMessage.trim()) return;

    try {
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([
          {
            chat_room_id: id,
            sender_id: currentUserId,
            content: newMessage.trim()
          }
        ]);

      if (messageError) {
        throw messageError;
      }

      // Clear input and refresh messages
      setNewMessage('');
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          sender_id,
          is_read,
          created_at,
          sender:sender_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('chat_room_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      const typedMessages = (messages || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        is_read: msg.is_read,
        created_at: msg.created_at,
        profiles: msg.sender
      })) as unknown as ChatMessage[];

      setMessages(typedMessages);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/inbox"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Inbox
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b p-4">
            <h1 className="text-xl font-semibold">
              Conversation with {otherParticipant?.profiles.first_name} {otherParticipant?.profiles.last_name}
            </h1>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage}>
              <div className="flex space-x-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 