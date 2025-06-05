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