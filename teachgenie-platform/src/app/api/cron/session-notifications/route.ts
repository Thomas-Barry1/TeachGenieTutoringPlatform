import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      subject: 'You have unread messages from students',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Message Reminder</h2>
          <p>Hi ${data.tutor.first_name},</p>
          <p>You have unread messages from ${studentNames} that are over a day old. Responding can help maintain good communication with your students.</p>
          <p><a href="https://teachgenie.io" style="color: #2563eb;">Log in to your TeachGenie dashboard</a> to view and respond to these messages.</p>
          <p>Best regards,<br>The TeachGenie Team</p>
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

    // Send to tutor (with tool suggestions for verified tutors)
    const isVerifiedTutor = session.tutor.is_verified
    const tutorEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Session Reminder</h2>
        <p>Hi ${session.tutor.profiles.first_name},</p>
        <p>You have a tutoring session tomorrow:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${session.student.first_name} ${session.student.last_name}</p>
          <p><strong>Subject:</strong> ${session.subject.name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Duration:</strong> ${Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))} minutes</p>
          <p><strong>Rate:</strong> $${session.price}</p>
        </div>
        <p><a href="https://teachgenie.io" style="color: #2563eb;">Visit TeachGenie</a> to manage your sessions and communicate with your student.</p>
        ${isVerifiedTutor ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="color: #059669; margin-top: 0;">AI-Powered Teaching Tools</h3>
          <p>As a verified tutor, you have access to our premium AI tools:</p>
          <ul>
            <li><strong>Gap Assessment:</strong> Identify knowledge gaps in student understanding</li>
            <li><strong>Test Creator:</strong> Generate customized tests and quizzes</li>
            <li><strong>Kahoot Generator:</strong> Create interactive Kahoot-style quizzes</li>
            <li><strong>Lesson Plan:</strong> Generate structured lesson plans</li>
            <li><strong>Activities:</strong> Access library of educational activities</li>
          </ul>
          <p><a href="https://teach.webexpansions.com" style="color: #059669;">Access Teaching Tools →</a></p>
        </div>
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0;">Teaching Tips</h3>
          <ul>
            <li>Offer a free hour session to the student to get to know them and their learning style</li>
            <li>Start with a quick assessment of the student's current understanding</li>
            <li>Use interactive elements to keep engagement high</li>
            <li>Provide specific, actionable feedback</li>
            <li>End with a summary, next steps, and a follow-up session</li>
          </ul>
        </div>
        ` : ''}
        <p>Best regards,<br>The TeachGenie Team</p>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Session Reminder</h2>
          <p>Hi ${session.student.first_name},</p>
          <p>You have a tutoring session tomorrow:</p>
          <div style="background: #f3f6f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tutor:</strong> ${session.tutor.profiles.first_name} ${session.tutor.profiles.last_name}</p>
            <p><strong>Subject:</strong> ${session.subject.name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))} minutes</p>
            <p><strong>Cost:</strong> $${session.price}</p>
          </div>
          <p>Please prepare any questions or materials you'd like to discuss during the session.</p>
          <p><a href="https://teachgenie.io" style="color: #2563eb;">Visit TeachGenie</a> to manage your sessions and communicate with your tutor.</p>
          <p>Best regards,<br>The TeachGenie Team</p>
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
