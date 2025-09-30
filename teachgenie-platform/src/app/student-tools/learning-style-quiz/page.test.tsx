import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LearningStyleQuizPage from './page'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockReplace = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LearningStyleQuizPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    })
  })

  test('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    })

    render(<LearningStyleQuizPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/login')
    })
  })

  test('shows loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'student-123' },
      loading: true,
      signOut: jest.fn(),
    })

    render(<LearningStyleQuizPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('renders quiz page for authenticated users (any type)', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signOut: jest.fn(),
    })

    render(<LearningStyleQuizPage />)

    await waitFor(() => {
      expect(screen.getByText('Learning Style Quiz')).toBeInTheDocument()
      expect(screen.getByText('Discover your unique learning style to optimize your study habits and find the perfect tutor match.')).toBeInTheDocument()
      expect(screen.getByText('Quiz Coming Soon!')).toBeInTheDocument()
    })
  })

  test('renders quiz page for authenticated tutors (no redirect)', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'tutor-123' },
      loading: false,
      signOut: jest.fn(),
    })

    render(<LearningStyleQuizPage />)

    await waitFor(() => {
      expect(screen.getByText('Learning Style Quiz')).toBeInTheDocument()
      expect(screen.getByText('Discover your unique learning style to optimize your study habits and find the perfect tutor match.')).toBeInTheDocument()
      expect(screen.getByText('Quiz Coming Soon!')).toBeInTheDocument()
    })

    // Should not redirect tutors away
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
