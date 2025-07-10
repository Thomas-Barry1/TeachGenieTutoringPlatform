import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SessionCard from './SessionCard'

describe('SessionCard', () => {
  const mockSession = {
    id: '123',
    start_time: '2024-03-20T10:00:00Z',
    end_time: '2024-03-20T11:00:00Z',
    status: 'scheduled' as const,
    price: 50,
    subject: {
      id: 'subject-123',
      name: 'Mathematics',
      category: 'STEM',
      created_at: '2024-03-19T00:00:00Z',
    },
    tutor: {
      profile: {
        id: 'tutor-profile-123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'tutor' as const,
        email: 'john.doe@example.com',
        created_at: '2024-03-19T00:00:00Z',
      },
    },
    student: {
      profile: {
        id: 'student-profile-123',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'student' as const,
        email: 'jane.smith@example.com',
        created_at: '2024-03-19T00:00:00Z',
      },
    },
    tutor_id: 'tutor-123',
    student_id: 'student-123',
    subject_id: 'subject-123',
    created_at: '2024-03-19T00:00:00Z',
  }

  const mockOnStatusChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders session information correctly', () => {
    render(<SessionCard session={mockSession} userType="student" onStatusChange={mockOnStatusChange} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
  })

  test('calls onStatusChange when Complete button is clicked', () => {
    render(<SessionCard session={mockSession} userType="student" onStatusChange={mockOnStatusChange} />)
    const completeButton = screen.getByText('Complete')
    fireEvent.click(completeButton)
    expect(mockOnStatusChange).toHaveBeenCalledWith('123', 'completed')
  })

  test('calls onStatusChange when Cancel button is clicked', () => {
    render(<SessionCard session={mockSession} userType="student" onStatusChange={mockOnStatusChange} />)
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    expect(mockOnStatusChange).toHaveBeenCalledWith('123', 'cancelled')
  })

  test('displays Write a Review link for completed sessions when user is student', () => {
    const completedSession = { ...mockSession, status: 'completed' as const }
    render(<SessionCard session={completedSession} userType="student" onStatusChange={mockOnStatusChange} />)
    expect(screen.getByText('Write a Review')).toBeInTheDocument()
  })

  test('does not display Write a Review link for completed sessions when user is tutor', () => {
    const completedSession = { ...mockSession, status: 'completed' as const }
    render(<SessionCard session={completedSession} userType="tutor" onStatusChange={mockOnStatusChange} />)
    expect(screen.queryByText('Write a Review')).not.toBeInTheDocument()
  })
})

// Simple test to verify session filtering logic
describe('Session Filtering', () => {
  const mockSessions = [
    {
      id: '1',
      start_time: '2024-12-25T10:00:00Z', // Future date
      status: 'scheduled',
      payment_status: 'pending',
      subject: { id: 'math', name: 'Mathematics' },
      tutor: { profile: { first_name: 'John', last_name: 'Doe' } },
      student: { profile: { first_name: 'Jane', last_name: 'Smith' } }
    },
    {
      id: '2',
      start_time: '2024-01-01T10:00:00Z', // Past date
      status: 'completed',
      payment_status: 'paid',
      subject: { id: 'science', name: 'Science' },
      tutor: { profile: { first_name: 'Bob', last_name: 'Johnson' } },
      student: { profile: { first_name: 'Alice', last_name: 'Brown' } }
    },
    {
      id: '3',
      start_time: '2024-12-26T10:00:00Z', // Future date
      status: 'scheduled',
      payment_status: 'pending',
      subject: { id: 'math', name: 'Mathematics' },
      tutor: { profile: { first_name: 'John', last_name: 'Doe' } },
      student: { profile: { first_name: 'Charlie', last_name: 'Wilson' } }
    }
  ]

  test('should filter upcoming sessions', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const upcoming = mockSessions.filter(session => new Date(session.start_time) > now)
    expect(upcoming).toHaveLength(2)
    expect(upcoming[0].id).toBe('1')
    expect(upcoming[1].id).toBe('3')
  })

  test('should filter past sessions', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const past = mockSessions.filter(session => new Date(session.start_time) <= now)
    expect(past).toHaveLength(1)
    expect(past[0].id).toBe('2')
  })

  test('should filter by status', () => {
    const scheduled = mockSessions.filter(session => session.status === 'scheduled')
    expect(scheduled).toHaveLength(2)
    
    const completed = mockSessions.filter(session => session.status === 'completed')
    expect(completed).toHaveLength(1)
  })

  test('should filter by payment status', () => {
    const pending = mockSessions.filter(session => session.payment_status === 'pending')
    expect(pending).toHaveLength(2)
    
    const paid = mockSessions.filter(session => session.payment_status === 'paid')
    expect(paid).toHaveLength(1)
  })

  test('should filter by subject', () => {
    const mathSessions = mockSessions.filter(session => session.subject.id === 'math')
    expect(mathSessions).toHaveLength(2)
    
    const scienceSessions = mockSessions.filter(session => session.subject.id === 'science')
    expect(scienceSessions).toHaveLength(1)
  })

  test('should search by name', () => {
    const query = 'john'
    const results = mockSessions.filter(session => {
      const tutorName = `${session.tutor.profile.first_name} ${session.tutor.profile.last_name}`.toLowerCase()
      const studentName = `${session.student.profile.first_name} ${session.student.profile.last_name}`.toLowerCase()
      return tutorName.includes(query) || studentName.includes(query)
    })
    expect(results).toHaveLength(2) // John Doe (tutor) and Charlie Wilson (student)
  })

  test('should search by subject name', () => {
    const query = 'math'
    const results = mockSessions.filter(session => {
      const subjectName = session.subject.name.toLowerCase()
      return subjectName.includes(query)
    })
    expect(results).toHaveLength(2)
  })
}) 