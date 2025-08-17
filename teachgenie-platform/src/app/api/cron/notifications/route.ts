import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Common email styles and components
const emailStyles = {
  container: `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    border-radius: 16px;
  `,
  content: `
    background: #ffffff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  `,
  header: `
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f1f5f9;
  `,
  logo: `
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
  `,
  subtitle: `
    color: #64748b;
    font-size: 16px;
    margin: 0;
  `,
  greeting: `
    font-size: 24px;
    color: #1e293b;
    margin: 20px 0;
    font-weight: 600;
  `,
  infoBox: `
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 25px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 4px solid #667eea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  `,
  infoRow: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
  `,
  infoRowLast: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
  `,
  label: `
    font-weight: 600;
    color: #475569;
    font-size: 14px;
  `,
  value: `
    color: #1e293b;
    font-weight: 500;
    font-size: 14px;
  `,
  ctaButton: `
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
  `,
  featureBox: `
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    padding: 25px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 4px solid #10b981;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  `,
  featureTitle: `
    color: #059669;
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  `,
  tipsBox: `
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    padding: 25px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 4px solid #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  `,
  tipsTitle: `
    color: #2563eb;
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  `,
  tipsList: `
    margin: 0;
    padding-left: 20px;
  `,
  tipsItem: `
    color: #1e40af;
    margin: 8px 0;
    line-height: 1.5;
  `,
  footer: `
    text-align: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #f1f5f9;
    color: #64748b;
    font-size: 14px;
  `,
  highlight: `
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #f59e0b;
  `,
  highlightText: `
    color: #92400e;
    margin: 0;
    font-weight: 500;
    text-align: center;
  `
}

export async function GET(request: Request) {
  // Verify this is a legitimate cron job request
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // Use service role client to bypass RLS for system-managed notifications
    const supabase = createServiceClient()

    // 1. Send tutor response reminders (tutors who haven't responded in >24 hours)
    await sendTutorResponseReminders(supabase)

    // 2. Send 24-hour session reminders and tool suggestions (24–36 hours before session)
    await send24HourSessionReminders(supabase)

    return NextResponse.json({ 
      success: true, 
      message: 'Session notifications processed successfully' 
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function sendTutorResponseReminders(supabase: any) {
  console.log('Sending tutor response reminders')
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  // Get messages from students that tutors haven't responded to in >24 hours
  const { data: unrespondedMessages, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      chat_rooms!inner(
        chat_participants!inner(
          user_id,
          profiles!inner(
            id,
            user_type,
            first_name,
            last_name,
            email
          )
        )
      )
    `)
    .lt('created_at', oneDayAgo.toISOString())
    .eq('is_read', false)

  console.log('Unresponded messages: ', unrespondedMessages)

  if (error) {
    console.error('Error fetching unresponded messages:', error)
    return
  }

  // Group by chat room and find tutors who need reminders
  const tutorReminders = new Map()
  
  for (const message of unrespondedMessages || []) {
    const participants = message.chat_rooms.chat_participants
    const student = participants.find((p: any) => p.profiles.user_type === 'student')
    const tutor = participants.find((p: any) => p.profiles.user_type === 'tutor')
    
    if (student && tutor && message.sender_id === student.profiles.id) {
      if (!tutorReminders.has(tutor.profiles.id)) {
        tutorReminders.set(tutor.profiles.id, {
          tutor: tutor.profiles,
          students: new Set()
        })
      }
      tutorReminders.get(tutor.profiles.id).students.add(student.profiles.first_name)
    }
  }

  console.log('Tutor reminders: ', tutorReminders)

  // Send reminder emails to tutors (only if we haven't sent one in the last 24 hours)
  for (const [tutorId, data] of tutorReminders) {
    // Check if we've already sent a reminder to this tutor in the last 24 hours
    const { data: existingNotification } = await supabase
      .from('session_notifications')
      .select('*')
      .eq('user_id', tutorId)
      .eq('notification_type', 'tutor_response_reminder')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (existingNotification) {
      console.log(`Skipping reminder for tutor ${tutorId} - already sent within 24 hours`)
      continue
    }

    const studentNames = Array.from(data.students).join(', ')
    
    await resend.emails.send({
      from: 'TeachGenie <noreply@teachgenie.io>',
      to: data.tutor.email,
      subject: 'Unread messages from students',
      html: `
        <div style="${emailStyles.container}">
          <div style="${emailStyles.content}">
            <div style="${emailStyles.header}">
              <div style="${emailStyles.logo}">🎓 TeachGenie</div>
              <p style="${emailStyles.subtitle}">Your tutoring platform</p>
            </div>
            
            <h1 style="${emailStyles.greeting}">Hi ${data.tutor.first_name}! 👋</h1>
            
            <div style="${emailStyles.highlight}">
              <p style="${emailStyles.highlightText}">
                <strong>You have unread messages waiting for your response!</strong>
              </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6; margin: 20px 0;">
              There are unread messages from <strong>${studentNames}</strong> that are over a day old. 
              Responding promptly helps maintain excellent communication and builds trust with your students!
            </p>
            
            <div style="text-align: center;">
              <a href="https://teachgenie.io/inbox" style="${emailStyles.ctaButton}">
                📬 View Messages
              </a>
            </div>
            
            <div style="${emailStyles.tipsBox}">
              <h3 style="${emailStyles.tipsTitle}">💡 Quick Tips</h3>
              <ul style="${emailStyles.tipsList}">
                <li style="${emailStyles.tipsItem}">Respond within 24 hours to maintain student engagement</li>
                <li style="${emailStyles.tipsItem}">Use this opportunity to schedule follow-up sessions</li>
              </ul>
            </div>
            
            <div style="${emailStyles.footer}">
              <p>Best regards,<br><strong>The TeachGenie Team</strong></p>
              <p>Building better learning experiences together</p>
            </div>
          </div>
        </div>
      `
    })

    // Record that we sent this notification
    await supabase
      .from('session_notifications')
      .insert({
        user_id: tutorId,
        notification_type: 'tutor_response_reminder',
        delivery_status: 'sent'
      })
  }
}

async function send24HourSessionReminders(supabase: any) {
  console.log('Sending 24-hour session reminders')
  const now = new Date()
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const thirtySixHoursFromNow = new Date(now.getTime() + 36 * 60 * 60 * 1000)

  // Get sessions starting in 24–36 hours (daily cron)
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      tutor:tutor_profiles!inner(
        profiles!inner(
          first_name,
          last_name,
          email
        ),
        is_verified
      ),
      student:profiles!inner(
        first_name,
        last_name,
        email
      ),
      subject:subjects!inner(
        name
      )
    `)
    .gte('start_time', twentyFourHoursFromNow.toISOString())
    .lt('start_time', thirtySixHoursFromNow.toISOString())
    .eq('status', 'scheduled')

  console.log('24-hour sessions: ', sessions)

  if (error) {
    console.error('Error fetching 24-hour sessions:', error)
    return
  }

  for (const session of sessions || []) {
    // Check if we've already sent 24-hour reminders for this session
    const { data: existingNotifications } = await supabase
      .from('session_notifications')
      .select('*')
      .eq('session_id', session.id)
      .eq('notification_type', 'reminder_24h')

    if (existingNotifications && existingNotifications.length > 0) {
      console.log(`Skipping 24-hour reminder for session ${session.id} - already sent`)
      continue
    }

    const sessionDate = new Date(session.start_time)
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    const duration = Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))

    // Send to tutor (with tool suggestions for verified tutors)
    const isVerifiedTutor = session.tutor.is_verified
    const tutorEmailContent = `
      <div style="${emailStyles.container}">
        <div style="${emailStyles.content}">
          <div style="${emailStyles.header}">
            <div style="${emailStyles.logo}">🎓 TeachGenie</div>
            <p style="${emailStyles.subtitle}">Your tutoring platform</p>
          </div>
          
          <h1 style="${emailStyles.greeting}">Hi ${session.tutor.profiles.first_name}! 👋</h1>
          
          <div style="${emailStyles.highlight}">
            <p style="${emailStyles.highlightText}">
              <strong>Your tutoring session is tomorrow!</strong>
            </p>
          </div>
          
          <div style="${emailStyles.infoBox}">
            <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px;">📅 Session Details</h3>
            <div style="${emailStyles.infoRow}">
              <span style="${emailStyles.label}">👤 Student:</span>
              <span style="${emailStyles.value}">${session.student.first_name} ${session.student.last_name}</span>
            </div>
            <div style="${emailStyles.infoRow}">
              <span style="${emailStyles.label}">📚 Subject:</span>
              <span style="${emailStyles.value}">${session.subject.name}</span>
            </div>
            <div style="${emailStyles.infoRow}">
              <span style="${emailStyles.label}">📅 Date:</span>
              <span style="${emailStyles.value}">${formattedDate}</span>
            </div>
            <div style="${emailStyles.infoRow}">
              <span style="${emailStyles.label}">⏰ Time:</span>
              <span style="${emailStyles.value}">${formattedTime}</span>
            </div>
            <div style="${emailStyles.infoRow}">
              <span style="${emailStyles.label}">⏱️ Duration:</span>
              <span style="${emailStyles.value}">${duration} minutes</span>
            </div>
            <div style="${emailStyles.infoRowLast}">
              <span style="${emailStyles.label}">💰 Rate:</span>
              <span style="${emailStyles.value}">$${session.price}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://teachgenie.io/sessions/" style="${emailStyles.ctaButton}">
              🚀 Manage Sessions
            </a>
          </div>
          
          ${isVerifiedTutor ? `
          <div style="${emailStyles.featureBox}">
            <h3 style="${emailStyles.featureTitle}">🤖 AI-Powered Teaching Tools</h3>
            <p style="color: #065f46; margin: 0 0 15px 0; line-height: 1.6;">
              As a verified tutor, you have exclusive access to our premium AI tools:
            </p>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="color: #065f46; margin: 8px 0;">🔍 <strong>Gap Assessment:</strong> Identify knowledge gaps in student understanding</li>
              <li style="color: #065f46; margin: 8px 0;">📝 <strong>Test Creator:</strong> Generate customized tests and quizzes</li>
              <li style="color: #065f46; margin: 8px 0;">🎮 <strong>Kahoot Generator:</strong> Create interactive Kahoot-style quizzes</li>
              <li style="color: #065f46; margin: 8px 0;">📋 <strong>Lesson Plan:</strong> Generate structured lesson plans</li>
              <li style="color: #065f46; margin: 8px 0;">🎯 <strong>Activities:</strong> Access library of educational activities</li>
            </ul>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://teach.webexpansions.com" style="
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
              ">🚀 Access Teaching Tools</a>
            </div>
          </div>
          
          <div style="${emailStyles.tipsBox}">
            <h3 style="${emailStyles.tipsTitle}">💡 Teaching Tips</h3>
            <ul style="${emailStyles.tipsList}">
              <li style="${emailStyles.tipsItem}">Offer a free hour session to get to know the student and their learning style</li>
              <li style="${emailStyles.tipsItem}">Start with a quick assessment of the student's current understanding</li>
              <li style="${emailStyles.tipsItem}">Use interactive elements to keep engagement high</li>
              <li style="${emailStyles.tipsItem}">Provide specific, actionable feedback</li>
              <li style="${emailStyles.tipsItem}">End with a summary, next steps, and a follow-up session</li>
            </ul>
          </div>
          ` : ''}
          
          <div style="${emailStyles.footer}">
            <p>Best regards,<br><strong>The TeachGenie Team</strong></p>
            <p>Empowering tutors to inspire learning</p>
          </div>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'TeachGenie <noreply@teachgenie.io>',
      to: session.tutor.profiles.email,
      subject: isVerifiedTutor ? `Teaching Tools & Session Reminder: ${session.subject.name} tomorrow` : `Session Reminder: ${session.subject.name} tomorrow`,
      html: tutorEmailContent
    })

    // Send to student
    await resend.emails.send({
      from: 'TeachGenie <noreply@teachgenie.io>',
      to: session.student.email,
      subject: `Session Reminder: ${session.subject.name} tomorrow`,
      html: `
        <div style="${emailStyles.container}">
          <div style="${emailStyles.content}">
            <div style="${emailStyles.header}">
              <div style="${emailStyles.logo}">🎓 TeachGenie</div>
              <p style="${emailStyles.subtitle}">Your learning platform</p>
            </div>
            
            <h1 style="${emailStyles.greeting}">Hi ${session.student.first_name}! 👋</h1>
            
            <div style="${emailStyles.highlight}">
              <p style="${emailStyles.highlightText}">
                <strong>Your tutoring session is tomorrow!</strong>
              </p>
            </div>
            
            <div style="${emailStyles.infoBox}">
              <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px;">📅 Session Details</h3>
              <div style="${emailStyles.infoRow}">
                <span style="${emailStyles.label}">👨‍🏫 Tutor:</span>
                <span style="${emailStyles.value}">${session.tutor.profiles.first_name} ${session.tutor.profiles.last_name}</span>
              </div>
              <div style="${emailStyles.infoRow}">
                <span style="${emailStyles.label}">📚 Subject:</span>
                <span style="${emailStyles.value}">${session.subject.name}</span>
              </div>
              <div style="${emailStyles.infoRow}">
                <span style="${emailStyles.label}">📅 Date:</span>
                <span style="${emailStyles.value}">${formattedDate}</span>
              </div>
              <div style="${emailStyles.infoRow}">
                <span style="${emailStyles.label}">⏰ Time:</span>
                <span style="${emailStyles.value}">${formattedTime}</span>
              </div>
              <div style="${emailStyles.infoRow}">
                <span style="${emailStyles.label}">⏱️ Duration:</span>
                <span style="${emailStyles.value}">${duration} minutes</span>
              </div>
              <div style="${emailStyles.infoRowLast}">
                <span style="${emailStyles.label}">💰 Cost:</span>
                <span style="${emailStyles.value}">$${session.price}</span>
              </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; text-align: center; font-weight: 500;">
                🎯 <strong>Our tutors are here to help you succeed and support you every step of the way!</strong>
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://teachgenie.io/sessions" style="${emailStyles.ctaButton}">
                📚 Manage Sessions
              </a>
            </div>
            
            <div style="${emailStyles.tipsBox}">
              <h3 style="${emailStyles.tipsTitle}">💡 Preparation Tips</h3>
              <ul style="${emailStyles.tipsList}">
                <li style="${emailStyles.tipsItem}">Review your notes and questions before the session</li>
                <li style="${emailStyles.tipsItem}">Have your materials and resources ready</li>
                <li style="${emailStyles.tipsItem}">Be prepared to discuss your learning goals</li>
                <li style="${emailStyles.tipsItem}">Don't hesitate to ask questions during the session</li>
              </ul>
            </div>
            
            <div style="${emailStyles.footer}">
              <p>Best regards,<br><strong>The TeachGenie Team</strong></p>
              <p>Building better learning experiences together</p>
            </div>
          </div>
        </div>
      `
    })

    // Record notifications for both tutor and student
    await supabase
      .from('session_notifications')
      .insert([
        {
          session_id: session.id,
          user_id: session.tutor.profiles.id,
          notification_type: 'reminder_24h',
          delivery_status: 'sent'
        },
        {
          session_id: session.id,
          user_id: session.student.id,
          notification_type: 'reminder_24h',
          delivery_status: 'sent'
        }
      ])
  }
}
