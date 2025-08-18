'use client'

import { useEffect, useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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

  // Client-side authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  // Set current user ID from auth context
  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
    }
  }, [user]);

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
    async function fetchMessages() {
      if (!currentUserId) return;

      try {
        setLoading(true);
        // Step 1: Get all chat room IDs the current user is part of.
        const { data: participationData, error: participationError } = await supabase
          .from('chat_participants')
          .select('chat_room_id')
          .eq('user_id', currentUserId);

        if (participationError) throw participationError;

        const roomIds = participationData.map(p => p.chat_room_id);
        if (roomIds.length === 0) {
          setMessages([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch the full data for those chat rooms, including all participants and messages.
        const { data: chatRoomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            chat_participants (
              user:profiles (
                id,
                first_name,
                last_name,
                avatar_url
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
          .in('id', roomIds)
          .order('created_at', { foreignTable: 'chat_messages', ascending: false });
        
        if (roomsError) throw roomsError;

        // Step 3: Transform the data to identify the "other participant" correctly.
        const transformedRooms: TransformedChatRoom[] = chatRoomsData
          .map((room: any) => {
            const otherParticipantProfile = room.chat_participants.find(
              (p: any) => p.user && p.user.id !== currentUserId
            )?.user;

            // Messages are now pre-sorted by the database.
            const lastMessage = room.chat_messages[0] || null;

            return {
              id: room.id,
              otherParticipant: {
                id: otherParticipantProfile?.id || '',
                name: otherParticipantProfile
                  ? `${otherParticipantProfile.first_name} ${otherParticipantProfile.last_name}`
                  : 'Unknown User',
                avatar: otherParticipantProfile?.avatar_url || null,
              },
              lastMessage,
              messages: room.chat_messages,
            };
          })
          .filter(room => room.otherParticipant.id); // Ensure there is another participant

        setMessages(transformedRooms);
      } catch (error) {
        console.error('Error fetching messages:', error);
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
      console.log('Attempting to send message');

      // Check if both users are tutors (prevent tutor-to-tutor messaging)
      const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .in('id', [currentUserId, recipientId]);
      
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        setError('Error fetching user information');
        return;
      }
      
      // Prevent tutors from messaging other tutors
      if (userProfiles?.every(profile => profile.user_type === 'tutor')) {
        setError('Tutors cannot message other tutors. Please contact students only.');
        return;
      }
      
      // Check if this is a new chat room creation
      const { data: existingRooms, error: searchError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          chat_participants (
            user_id
          )
        `)
        .eq('type', 'direct')
        // .eq('chat_participants.user_id', currentUserId);

      if (searchError) {
        console.error('Error searching for chat rooms:', searchError);
        setError('Error searching for chat rooms');
        return;
      }

      console.log('Existing rooms found:', existingRooms);

      // Find a room where both users are participants
      const existingRoom = existingRooms?.find(room => 
        room.chat_participants.some(p => p.user_id === recipientId) && 
        room.chat_participants.some(p => p.user_id === currentUserId)
      );

      let chatRoomId;
      if (existingRoom) {
        console.log('Using existing room:', existingRoom.id);
        chatRoomId = existingRoom.id;
      } else {
        console.log('No existing room found, creating new chat room');
        
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

      // --- EMAIL NOTIFICATION LOGIC ---
      // Send email notification to the recipient
      if (recipientProfile?.id && recipientProfile.id !== currentUserId) {
        // Fetch recipient email from Supabase
        const { data: recipientEmailData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', recipientProfile.id)
          .single();
        
        if (recipientEmailData?.email) {
          // Get sender's profile for the email
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, user_type')
            .eq('id', currentUserId)
            .single();
          
          const senderName = senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}` : 'Someone';
          const senderType = senderProfile?.user_type === 'tutor' ? 'tutor' : 'student';
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Message on TeachGenie</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
                .content { padding: 40px 20px; }
                .message-box { background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                .message-text { font-size: 16px; line-height: 1.6; color: #374151; }
                .sender-info { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .sender-name { font-weight: 600; color: #0c4a6e; font-size: 18px; }
                .sender-type { color: #64748b; font-size: 14px; text-transform: capitalize; }
                .cta-button { display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
                .footer a { color: #0ea5e9; text-decoration: none; }
                @media (max-width: 600px) { .content { padding: 20px 15px; } .header { padding: 20px 15px; } }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📚 TeachGenie</h1>
                </div>
                <div class="content">
                  <h2 style="color: #0c4a6e; margin-bottom: 20px;">You have a new message!</h2>
                  
                  <div class="sender-info">
                    <div class="sender-name">${senderName}</div>
                    <div class="sender-type">Your ${senderType}</div>
                  </div>
                  
                  <div class="message-box">
                    <div class="message-text">"${newMessage.trim()}"</div>
                  </div>
                  
                  <p style="color: #64748b; margin: 20px 0;">
                    Reply to continue your conversation and keep your learning journey moving forward.
                  </p>
                  
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://teachgenie.io'}/inbox/${chatRoomId}" class="cta-button">
                    View Message →
                  </a>
                  
                  <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    💡 <strong>Tip:</strong> You can also reply directly from your TeachGenie dashboard.
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 TeachGenie. All rights reserved.</p>
                  <p>
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://teachgenie.io'}/PRIVACY">Privacy Policy</a> • 
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://teachgenie.io'}/TERMS">Terms of Service</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          const notifyRes = await fetch('/api/notify-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipientEmailData.email,
              subject: `New message from ${senderName} on TeachGenie`,
              html: emailHtml
            }),
            credentials: 'include'
          });
          const notifyData = await notifyRes.json();
          console.log('[Notify] API response:', notifyData);
        }
      }
      // --- END EMAIL NOTIFICATION LOGIC ---
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

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
                    className="w-10 h-10 rounded-full object-cover"
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

export default function InboxPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InboxPage />
    </Suspense>
  );
} 