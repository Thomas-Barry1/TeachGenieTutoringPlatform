'use client'

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

interface UserProfile {
  id: string;
  user_type: 'student' | 'tutor';
}

interface TutorSubject {
  subject_id: string;
  subjects: {
    id: string;
    name: string;
  };
}

interface TutorProfile {
  id: string;
  hourly_rate: number;
}

export default function ConversationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<ChatParticipant | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState(60); // Default 60 minutes
  const [bookingRate, setBookingRate] = useState<number>(0);
  const [bookingSubject, setBookingSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string }[]>([]);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [customDuration, setCustomDuration] = useState<string>('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      if (user?.id) {
        // Fetch user profile to check if they're a tutor
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', user.id)
          .single();
        
        setCurrentUserProfile(profile);
      }
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
          const { data: updateData, error: updateError } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in(
              'id',
              unreadMessages.map(m => m.id)
            );

          console.log('Update data: ', updateData);

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

  useEffect(() => {
    async function fetchTutorSubjects() {
      if (currentUserProfile?.user_type === 'tutor') {
        const { data: subjects } = await supabase
          .from('tutor_subjects')
          .select(`
            subject_id,
            subjects (
              id,
              name
            )
          `)
          .eq('tutor_id', currentUserId)
          .returns<TutorSubject[]>();

        if (subjects) {
          setAvailableSubjects(subjects.map(s => ({
            id: s.subjects.id,
            name: s.subjects.name
          })));
        }
      }
    }
    fetchTutorSubjects();
  }, [currentUserProfile, currentUserId, supabase]);

  useEffect(() => {
    async function fetchTutorProfile() {
      if (currentUserProfile?.user_type === 'tutor' && currentUserId) {
        const { data: profile } = await supabase
          .from('tutor_profiles')
          .select('id, hourly_rate')
          .eq('id', currentUserId)
          .single();
        
        if (profile) {
          setTutorProfile(profile);
          setBookingRate(profile.hourly_rate);
        }
      }
    }
    fetchTutorProfile();
  }, [currentUserProfile, currentUserId, supabase]);

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

      // --- EMAIL NOTIFICATION LOGIC ---
      // Only notify if the last message from this user was more than 5 minutes ago
      const now = new Date();
      const lastSent = typedMessages
        .filter(m => m.sender_id === currentUserId)
        .map(m => new Date(m.created_at))
        .sort((a, b) => b.getTime() - a.getTime())[1];
      console.log('[Notify] Now:', now, 'Last sent:', lastSent);
      if (!lastSent || (now.getTime() - lastSent.getTime()) > 5 * 60 * 1000) {
        // Send email notification to the other participant
        if (otherParticipant?.profiles && otherParticipant.profiles.id !== currentUserId) {
          // Fetch recipient email from Supabase
          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('email, first_name')
            .eq('id', otherParticipant.profiles.id)
            .single();
          console.log('[Notify] Recipient profile:', recipientProfile);
          if (recipientProfile?.email) {
            // Get sender's name for the email
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', currentUserId)
              .single();
            
            const senderName = senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}` : 'Someone';
            const senderType = currentUserProfile?.user_type === 'tutor' ? 'tutor' : 'student';
            const recipientType = currentUserProfile?.user_type === 'tutor' ? 'student' : 'tutor';
            
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
                    
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://teachgenie.io'}/inbox/${id}" class="cta-button">
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
                to: recipientProfile.email,
                subject: `New message from ${senderName} on TeachGenie`,
                html: emailHtml
              }),
              credentials: 'include' // Ensure cookies are sent
            });
            const notifyData = await notifyRes.json();
            console.log('[Notify] API response:', notifyData);
          } else {
            console.log('[Notify] No recipient email found.');
          }
        } else {
          console.log('[Notify] No other participant or trying to notify self.');
        }
      } else {
        console.log('[Notify] Last message sent less than 5 minutes ago, skipping email.');
      }
      // --- END EMAIL NOTIFICATION LOGIC ---
      // SECURITY NOTE: The API route /api/notify-message checks Supabase Auth session 
      // on the server, so only authenticated users can trigger emails. The recipient 
      // email is fetched server-side, not exposed to the client. This is a secure pattern 
      // for transactional notifications.
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to send message');
    }
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !otherParticipant || !bookingDate || !bookingTime || !bookingSubject) return;

    try {
      const startTime = new Date(`${bookingDate}T${bookingTime}`);
      const duration = customDuration ? parseInt(customDuration) : bookingDuration;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      // Calculate price based on duration and rate
      const hours = duration / 60;
      const price = hours * bookingRate;

      const { error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            tutor_id: currentUserId,
            student_id: otherParticipant.user_id,
            subject_id: bookingSubject,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'scheduled',
            price: price
          }
        ]);

      if (sessionError) throw sessionError;

      setShowBookingModal(false);
      // Reset form
      setBookingDate('');
      setBookingTime('');
      setBookingDuration(60);
      setBookingSubject('');
      setCustomDuration('');
    } catch (error) {
      console.error('Error booking session:', error);
      setError('Failed to book session');
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
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">
                Conversation with {otherParticipant?.profiles.first_name} {otherParticipant?.profiles.last_name}
              </h1>
              {currentUserProfile?.user_type === 'tutor' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Book Session
                  </button>
                  <a
                    href="http://teachgenie.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Tutor Tools
                  </a>
                </div>
              )}
            </div>
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

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Book a Session</h2>
              <form onSubmit={handleBookSession}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <div className="mt-1 space-y-2">
                      <select
                        value={customDuration ? 'custom' : bookingDuration.toString()}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setCustomDuration('');
                          } else {
                            setBookingDuration(Number(e.target.value));
                            setCustomDuration('');
                          }
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                        {/* <option value="custom">Custom duration</option> */}
                      </select>
                      {customDuration !== '' && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            min="15"
                            step="15"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Enter duration in minutes"
                          />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={bookingRate}
                      onChange={(e) => setBookingRate(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <select
                      value={bookingSubject}
                      onChange={(e) => setBookingSubject(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a subject</option>
                      {availableSubjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">
                      Total Price: ${((customDuration ? parseInt(customDuration) : bookingDuration) / 60 * bookingRate).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Book Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 