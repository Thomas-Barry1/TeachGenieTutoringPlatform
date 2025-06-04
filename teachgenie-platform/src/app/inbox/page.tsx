'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

type ChatMessage = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
};

export default function InboxPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
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
    async function fetchMessages() {
      if (!currentUserId) return;

      try {
        // First get all chat rooms the user is part of
        const { data: chatRooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('session_id', currentUserId);

        if (roomsError) {
          setError('Error fetching chat rooms');
          return;
        }

        if (!chatRooms?.length) {
          setMessages([]);
          return;
        }

        // Then get all messages from these chat rooms
        const { data, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .in('chat_room_id', chatRooms.map(room => room.id))
          .order('created_at', { ascending: false });

        if (messagesError) {
          setError('Error fetching messages');
          return;
        }

        setMessages(data || []);
      } catch (error) {
        setError('An unexpected error occurred');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [supabase, currentUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Inbox</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Inbox</h1>
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Inbox</h1>
        
        {messages.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                  !message.is_read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      {message.sender_id === currentUserId ? 'You' : 'Other User'}
                    </p>
                    <p className="text-gray-600 mt-1">{message.content}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <span className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                    {!message.is_read && (
                      <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 