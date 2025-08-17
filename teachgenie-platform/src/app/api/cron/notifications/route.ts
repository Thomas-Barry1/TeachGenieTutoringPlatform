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
      subject: 'Unread messages from students',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message Reminder</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #667eea; border-radius: 16px; padding: 20px;">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                            <h1 style="font-size: 32px; font-weight: 700; color: #667eea; margin: 0 0 10px 0;">🎓 TeachGenie</h1>
                            <p style="color: #374151; font-size: 16px; margin: 0;">Your tutoring platform</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Greeting -->
                      <h2 style="font-size: 24px; color: #000000; margin: 30px 0 20px 0; font-weight: 600;">Hi ${data.tutor.first_name}!</h2>
                      
                      <!-- Highlight Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="color: #000000; margin: 0; text-align: center; font-weight: 600; font-size: 16px;">
                              <strong>You have unread messages waiting for your response!</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Message Content -->
                      <p style="color: #000000; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                        There are unread messages from <strong>${studentNames}</strong> that are over a day old. 
                        Responding promptly helps maintain excellent communication and builds trust with your students!
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://teachgenie.io/inbox" style="
                              display: inline-block;
                              background-color: #667eea;
                              color: #ffffff;
                              padding: 16px 32px;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: 600;
                              font-size: 16px;
                            ">📬 View Messages</a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Tips Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tr>
                          <td style="background-color: #f0f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                            <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💡 Quick Tips</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #000000;">
                              <li style="margin: 8px 0; line-height: 1.5;">Respond within 24 hours to maintain student engagement</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Use this opportunity to schedule follow-up sessions</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Show your commitment to student success</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Footer -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                        <tr>
                          <td align="center" style="color: #374151; font-size: 14px;">
                            <p style="margin: 0 0 5px 0;">Best regards,<br><strong>The TeachGenie Team</strong></p>
                            <p style="margin: 0;">Building better learning experiences together</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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

    await resend.emails.send({
      from: 'TeachGenie <noreply@teachgenie.io>',
      to: session.tutor.profiles.email,
      subject: isVerifiedTutor ? `Teaching Tools & Session Reminder: ${session.subject.name} tomorrow` : `Session Reminder: ${session.subject.name} tomorrow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Reminder</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #667eea; border-radius: 16px; padding: 20px;">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                            <h1 style="font-size: 32px; font-weight: 700; color: #667eea; margin: 0 0 10px 0;">🎓 TeachGenie</h1>
                            <p style="color: #374151; font-size: 16px; margin: 0;">Your tutoring platform</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Greeting -->
                      <h2 style="font-size: 24px; color: #000000; margin: 30px 0 20px 0; font-weight: 600;">Hi ${session.tutor.profiles.first_name}!</h2>
                      
                      <!-- Highlight Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="color: #000000; margin: 0; text-align: center; font-weight: 600; font-size: 16px;">
                              <strong>Your tutoring session is tomorrow!</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Session Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tr>
                          <td style="background-color: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #667eea;">
                            <h3 style="color: #000000; margin: 0 0 20px 0; font-size: 18px;">📅 Session Details</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">👤 Student:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${session.student.first_name} ${session.student.last_name}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">📚 Subject:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${session.subject.name}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">📅 Date:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${formattedDate}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">⏰ Time:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${formattedTime}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">⏱️ Duration:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${duration} minutes</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">💰 Rate:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">$${session.price}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://teachgenie.io/sessions" style="
                              display: inline-block;
                              background-color: #667eea;
                              color: #ffffff;
                              padding: 16px 32px;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: 600;
                              font-size: 16px;
                            ">📚 Manage Sessions</a>
                          </td>
                        </tr>
                      </table>
                      
                      ${isVerifiedTutor ? `
                      <!-- AI Tools Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tr>
                          <td style="background-color: #f0fdf4; padding: 25px; border-radius: 12px; border-left: 4px solid #10b981;">
                            <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🤖 AI-Powered Teaching Tools</h3>
                            <p style="color: #000000; margin: 0 0 15px 0; line-height: 1.6;">
                              As a verified tutor, you have exclusive access to our premium AI tools:
                            </p>
                            <ul style="margin: 0; padding-left: 20px; color: #000000;">
                              <li style="margin: 8px 0;">🔍 <strong>Gap Assessment:</strong> Identify knowledge gaps in student understanding</li>
                              <li style="margin: 8px 0;">📝 <strong>Test Creator:</strong> Generate customized tests and quizzes</li>
                              <li style="margin: 8px 0;">🎮 <strong>Kahoot Generator:</strong> Create interactive Kahoot-style quizzes</li>
                              <li style="margin: 8px 0;">📋 <strong>Lesson Plan:</strong> Generate structured lesson plans</li>
                              <li style="margin: 8px 0;">🎯 <strong>Activities:</strong> Access library of educational activities</li>
                            </ul>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px;">
                              <tr>
                                <td align="center">
                                  <a href="https://teach.webexpansions.com" style="
                                    display: inline-block;
                                    background-color: #10b981;
                                    color: #ffffff;
                                    padding: 12px 24px;
                                    text-decoration: none;
                                    border-radius: 6px;
                                    font-weight: 600;
                                    font-size: 14px;
                                  ">🚀 Access Teaching Tools</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Teaching Tips Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tr>
                          <td style="background-color: #f0f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                            <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💡 Teaching Tips</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #000000;">
                              <li style="margin: 8px 0; line-height: 1.5;">Offer a free hour session to get to know the student and their learning style</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Start with a quick assessment of the student's current understanding</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Use interactive elements to keep engagement high</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Provide specific, actionable feedback</li>
                              <li style="margin: 8px 0; line-height: 1.5;">End with a summary, next steps, and a follow-up session</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      
                      <!-- Footer -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                        <tr>
                          <td align="center" style="color: #374151; font-size: 14px;">
                            <p style="margin: 0 0 5px 0;">Best regards,<br><strong>The TeachGenie Team</strong></p>
                            <p style="margin: 0;">Empowering tutors to inspire learning</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })

    // Send to student
    await resend.emails.send({
      from: 'TeachGenie <noreply@teachgenie.io>',
      to: session.student.email,
      subject: `Session Reminder: ${session.subject.name} tomorrow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Reminder</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #667eea; border-radius: 16px; padding: 20px;">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                            <h1 style="font-size: 32px; font-weight: 700; color: #667eea; margin: 0 0 10px 0;">🎓 TeachGenie</h1>
                            <p style="color: #374151; font-size: 16px; margin: 0;">Your learning platform</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Greeting -->
                      <h2 style="font-size: 24px; color: #000000; margin: 30px 0 20px 0; font-weight: 600;">Hi ${session.student.first_name}!</h2>
                      
                      <!-- Highlight Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="color: #000000; margin: 0; text-align: center; font-weight: 600; font-size: 16px;">
                              <strong>Your tutoring session is tomorrow!</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Session Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tr>
                          <td style="background-color: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #667eea;">
                            <h3 style="color: #000000; margin: 0 0 20px 0; font-size: 18px;">📅 Session Details</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">👨‍🏫 Tutor:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${session.tutor.profiles.first_name} ${session.tutor.profiles.last_name}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">📚 Subject:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${session.subject.name}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">📅 Date:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${formattedDate}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">⏰ Time:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${formattedTime}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">⏱️ Duration:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">${duration} minutes</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0;">
                                  <span style="font-weight: 600; color: #000000; font-size: 14px; display: inline-block; width: 120px;">💰 Cost:</span>
                                  <span style="color: #000000; font-weight: 500; font-size: 14px;">$${session.price}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Motivational Message -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="color: #000000; margin: 0; text-align: center; font-weight: 600; font-size: 16px;">
                              🎯 <strong>Our tutors are here to help you succeed and support you every step of the way!</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://teachgenie.io/sessions" style="
                              display: inline-block;
                              background-color: #667eea;
                              color: #ffffff;
                              padding: 16px 32px;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: 600;
                              font-size: 16px;
                            ">📚 Manage Sessions</a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Preparation Tips Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tr>
                          <td style="background-color: #f0f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                            <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💡 Preparation Tips</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #000000;">
                              <li style="margin: 8px 0; line-height: 1.5;">Review your notes and questions before the session</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Have your materials and resources ready</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Be prepared to discuss your learning goals</li>
                              <li style="margin: 8px 0; line-height: 1.5;">Don't hesitate to ask questions during the session</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Footer -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                        <tr>
                          <td align="center" style="color: #374151; font-size: 14px;">
                            <p style="margin: 0 0 5px 0;">Best regards,<br><strong>The TeachGenie Team</strong></p>
                            <p>Building better learning experiences together</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
