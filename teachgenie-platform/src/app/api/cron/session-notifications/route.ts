import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Verify this is a legitimate cron job request
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createClient()

    // 1. Send tutor response reminders (tutors who haven't responded in >24 hours)
    await sendTutorResponseReminders(supabase)

    // 2. Send 24-hour session reminders (24-25 hours before session)
    await send24HourSessionReminders(supabase)

    // 3. Send 1-hour session reminders (1-2 hours before session)
    await send1HourSessionReminders(supabase)

    // 4. Send tutor tool suggestions (24 hours before session)
    await sendTutorToolSuggestions(supabase)

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
      from: 'TeachGenie <notifications@teachgenie.io>',
      to: data.tutor.email,
      subject: 'You have unread messages from students',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Message Reminder</h2>
          <p>Hi ${data.tutor.first_name},</p>
          <p>You have unread messages from ${studentNames} that are over 24 hours old. Please respond to maintain good communication with your students.</p>
          <p>Log in to your TeachGenie dashboard to view and respond to these messages.</p>
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
  const now = new Date()
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // Get sessions starting in 24-25 hours
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      tutor:tutor_profiles!inner(
        profiles!inner(
          first_name,
          last_name,
          email
        )
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
    .lt('start_time', twentyFiveHoursFromNow.toISOString())
    .eq('status', 'scheduled')

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

    // Send to tutor
    await resend.emails.send({
      from: 'TeachGenie <notifications@teachgenie.io>',
      to: session.tutor.profiles.email,
      subject: `Session Reminder: ${session.subject.name} tomorrow`,
      html: `
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
          <p>Please prepare your lesson materials and ensure you're ready for the session.</p>
          <p>Best regards,<br>The TeachGenie Team</p>
        </div>
      `
    })

    // Send to student
    await resend.emails.send({
      from: 'TeachGenie <notifications@teachgenie.io>',
      to: session.student.email,
      subject: `Session Reminder: ${session.subject.name} tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Session Reminder</h2>
          <p>Hi ${session.student.first_name},</p>
          <p>You have a tutoring session tomorrow:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tutor:</strong> ${session.tutor.profiles.first_name} ${session.tutor.profiles.last_name}</p>
            <p><strong>Subject:</strong> ${session.subject.name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))} minutes</p>
            <p><strong>Cost:</strong> $${session.price}</p>
          </div>
          <p>Please prepare any questions or materials you'd like to discuss during the session.</p>
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

async function send1HourSessionReminders(supabase: any) {
  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  // Get sessions starting in 1-2 hours
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      tutor:tutor_profiles!inner(
        profiles!inner(
          first_name,
          last_name,
          email
        )
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
    .gte('start_time', oneHourFromNow.toISOString())
    .lt('start_time', twoHoursFromNow.toISOString())
    .eq('status', 'scheduled')

  if (error) {
    console.error('Error fetching 1-hour sessions:', error)
    return
  }

  for (const session of sessions || []) {
    // Check if we've already sent 1-hour reminders for this session
    const { data: existingNotifications } = await supabase
      .from('session_notifications')
      .select('*')
      .eq('session_id', session.id)
      .eq('notification_type', 'reminder_1h')

    if (existingNotifications && existingNotifications.length > 0) {
      console.log(`Skipping 1-hour reminder for session ${session.id} - already sent`)
      continue
    }

    const sessionDate = new Date(session.start_time)
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Send to tutor
    await resend.emails.send({
      from: 'TeachGenie <notifications@teachgenie.io>',
      to: session.tutor.profiles.email,
      subject: `Session Starting Soon: ${session.subject.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Session Starting Soon</h2>
          <p>Hi ${session.tutor.profiles.first_name},</p>
          <p>Your tutoring session starts in about an hour:</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Student:</strong> ${session.student.first_name} ${session.student.last_name}</p>
            <p><strong>Subject:</strong> ${session.subject.name}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))} minutes</p>
          </div>
          <p>Please ensure you're ready and have all your materials prepared.</p>
          <p>Best regards,<br>The TeachGenie Team</p>
        </div>
      `
    })

    // Send to student
    await resend.emails.send({
      from: 'TeachGenie <notifications@teachgenie.io>',
      to: session.student.email,
      subject: `Session Starting Soon: ${session.subject.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Session Starting Soon</h2>
          <p>Hi ${session.student.first_name},</p>
          <p>Your tutoring session starts in about an hour:</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Tutor:</strong> ${session.tutor.profiles.first_name} ${session.tutor.profiles.last_name}</p>
            <p><strong>Subject:</strong> ${session.subject.name}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))} minutes</p>
          </div>
          <p>Please have your questions and materials ready for the session.</p>
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
          notification_type: 'reminder_1h',
          delivery_status: 'sent'
        },
        {
          session_id: session.id,
          user_id: session.student.id,
          notification_type: 'reminder_1h',
          delivery_status: 'sent'
        }
      ])
  }
}

async function sendTutorToolSuggestions(supabase: any) {
  const now = new Date()
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // Get sessions starting in 24-25 hours for verified tutors
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
        last_name
      ),
      subject:subjects!inner(
        name
      )
    `)
    .gte('start_time', twentyFourHoursFromNow.toISOString())
    .lt('start_time', twentyFiveHoursFromNow.toISOString())
    .eq('status', 'scheduled')
    .eq('tutor.is_verified', true)

  if (error) {
    console.error('Error fetching sessions for tool suggestions:', error)
    return
  }

  for (const session of sessions || []) {
    // Check if we've already sent tool suggestions for this session
    const { data: existingNotification } = await supabase
      .from('session_notifications')
      .select('*')
      .eq('session_id', session.id)
      .eq('notification_type', 'tutor_tools')
      .single()

    if (existingNotification) {
      console.log(`Skipping tool suggestions for session ${session.id} - already sent`)
      continue
    }

    const sessionDate = new Date(session.start_time)
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    await resend.emails.send({
      from: 'TeachGenie <notifications@teachgenie.io>',
      to: session.tutor.profiles.email,
      subject: `Teaching Tools for Tomorrow's Session`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Teaching Tools & Suggestions</h2>
          <p>Hi ${session.tutor.profiles.first_name},</p>
          <p>You have a session tomorrow with ${session.student.first_name} in ${session.subject.name}. Here are some tools and suggestions to enhance your lesson:</p>
          
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

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #d97706; margin-top: 0;">Session Details</h3>
            <p><strong>Student:</strong> ${session.student.first_name} ${session.student.last_name}</p>
            <p><strong>Subject:</strong> ${session.subject.name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Duration:</strong> ${Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60))} minutes</p>
          </div>

          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Teaching Tips</h3>
            <ul>
              <li>Offer a free hour session to the student to get to know them and their learning style</li>
              <li>Use the AI tools to create a lesson plan and activities</li>
              <li>Start with a quick assessment of the student's current understanding</li>
              <li>Use interactive elements to keep engagement high</li>
              <li>End with a summary and next steps</li>
              <li>Schedule a follow-up session to review the student's progress</li>
              <li>Ask the student to provide feedback on the session</li>
            </ul>
          </div>

          <p>Best regards,<br>The TeachGenie Team</p>
        </div>
      `
    })

    // Record the tool suggestion notification
    await supabase
      .from('session_notifications')
      .insert({
        session_id: session.id,
        user_id: session.tutor.profiles.id,
        notification_type: 'tutor_tools',
        delivery_status: 'sent'
      })
  }
} 