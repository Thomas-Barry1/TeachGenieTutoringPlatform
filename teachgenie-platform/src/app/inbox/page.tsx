'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { useSearchParams } from 'next/navigation';

interface ChatParticipant {
  user_id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

interface ChatRoomResponse {
  id: string;
  chat_participants: {
    user_id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }[];
  chat_messages: {
    id: string;
    content: string;
    sender_id: string;
    is_read: boolean;
    created_at: string;
  }[];
}

interface TransformedChatRoom {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
    avatar: string | null;
  };
  lastMessage: ChatMessage | null;
  messages: ChatMessage[];
}

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function InboxPage() {
  const [messages, setMessages] = useState<TransformedChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const searchParams = useSearchParams();
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const recipient = searchParams.get('recipient');
    if (recipient) {
      setRecipientId(recipient);
      // Fetch recipient's profile
      supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', recipient)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setRecipientProfile(data);
          }
        });
    }
  }, [searchParams, supabase]);

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
        // Get all chat rooms the user is part of through chat_participants
        const { data: chatRooms, error: roomsError } = await supabase
          .from('chat_participants')
          .select(`
            chat_room_id,
            user_id,
            user:user_id (
              id,
              first_name,
              last_name
            ),
            chat_rooms!inner (
              id,
              chat_messages (
                id,
                content,
                sender_id,
                is_read,
                created_at
              )
            )
          `)
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .returns<{
            chat_room_id: string;
            user_id: string;
            user: {
              id: string;
              first_name: string;
              last_name: string;
            };
            chat_rooms: {
              id: string;
              chat_messages: {
                id: string;
                content: string;
                sender_id: string;
                is_read: boolean;
                created_at: string;
              }[];
            };
          }[]>();

        if (roomsError) {
          console.error('Error fetching chat rooms:', roomsError);
          setError('Error fetching chat rooms');
          return;
        }

        if (!chatRooms?.length) {
          setMessages([]);
          return;
        }

        // Transform the chat rooms into the expected format
        const transformedRooms: TransformedChatRoom[] = chatRooms.map(room => {
          const messages = room.chat_rooms.chat_messages || [];
          const lastMessage = messages.length > 0 ? messages[0] : null;

          return {
            id: room.chat_room_id,
            otherParticipant: {
              id: room.user.id,
              name: `${room.user.first_name} ${room.user.last_name}`,
              avatar: null
            },
            lastMessage,
            messages
          };
        });

        setMessages(transformedRooms);
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [supabase, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !recipientId || !newMessage.trim()) return;

    try {
      // First check if a chat room already exists between these users
      const { data: existingRooms, error: searchError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          chat_participants!inner (
            user_id
          )
        `)
        .eq('type', 'direct')
        .eq('chat_participants.user_id', currentUserId);

      if (searchError) {
        console.error('Error searching for chat rooms:', searchError);
        setError('Error searching for chat rooms');
        return;
      }

      // Find a room where both users are participants
      const existingRoom = existingRooms?.find(room => 
        room.chat_participants.some(p => p.user_id === recipientId)
      );

      let chatRoomId;
      if (existingRoom) {
        chatRoomId = existingRoom.id;
      } else {
        // Create new chat room
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert([{}])
          .select()
          .single();

        if (roomError) {
          console.error('Error creating chat room:', roomError);
          setError('Error creating chat room');
          return;
        }
        chatRoomId = newRoom.id;

        // Add both users as participants
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert([
            { chat_room_id: chatRoomId, user_id: currentUserId },
            { chat_room_id: chatRoomId, user_id: recipientId }
          ]);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          setError('Error adding participants to chat room');
          return;
        }
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([
          {
            chat_room_id: chatRoomId,
            sender_id: currentUserId,
            content: newMessage.trim()
          }
        ]);

      if (messageError) {
        console.error('Error sending message:', messageError);
        setError('Error sending message');
        return;
      }

      // Clear the input and refresh messages
      setNewMessage('');
      // Refresh the messages list
      const { data: updatedRooms, error: refreshError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          chat_participants (
            user_id,
            profiles (
              id,
              first_name,
              last_name
            )
          ),
          chat_messages (
            id,
            content,
            sender_id,
            is_read,
            created_at
          )
        `)
        .eq('id', chatRoomId)
        .single();

      if (refreshError) {
        console.error('Error refreshing messages:', refreshError);
        return;
      }

      // Update the messages list with the new message
      const updatedRoom: TransformedChatRoom = {
        id: updatedRooms.id,
        otherParticipant: {
          id: recipientProfile?.id || '',
          name: recipientProfile ? `${recipientProfile.first_name} ${recipientProfile.last_name}` : 'Unknown User',
          avatar: null
        },
        lastMessage: updatedRooms.chat_messages[0] || null,
        messages: updatedRooms.chat_messages
      };

      setMessages(prev => {
        const otherRooms = prev.filter(room => room.id !== chatRoomId);
        return [updatedRoom, ...otherRooms];
      });
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    }
  };

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {recipientProfile && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Message to {recipientProfile.first_name} {recipientProfile.last_name}
          </h2>
          <form onSubmit={handleSendMessage} className="mt-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 border rounded-lg mb-4"
              rows={4}
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {room.otherParticipant.avatar ? (
                  <img
                    src={room.otherParticipant.avatar}
                    alt={room.otherParticipant.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">
                      {room.otherParticipant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{room.otherParticipant.name}</h3>
                  <p className="text-sm text-gray-500">
                    Direct Message
                  </p>
                </div>
              </div>
              {room.lastMessage && (
                <span className="text-sm text-gray-500">
                  {new Date(room.lastMessage.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {room.lastMessage && (
              <div className="border-t pt-4">
                <p className="text-gray-700">
                  {room.lastMessage.content}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {new Date(room.lastMessage.created_at).toLocaleTimeString()}
                  </span>
                  {!room.lastMessage.is_read && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      New
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4">
              <a
                href={`/inbox/${room.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Conversation
              </a>
            </div>
          </div>
        ))}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 