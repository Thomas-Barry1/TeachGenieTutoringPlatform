'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LearningStyleQuizPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Client-side authentication check (same pattern as inbox page)
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.replace('/auth/login')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teachgenie-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-teachgenie-deep-blue mb-4">
              Learning Style Quiz
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover your unique learning style to optimize your study habits and find the perfect tutor match.
            </p>
          </div>

          <div className="bg-teachgenie-teal/10 border border-teachgenie-teal/20 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-teachgenie-deep-blue mb-4">
              What is a Learning Style?
            </h2>
            <p className="text-gray-700 mb-4">
              Learning styles are the different ways people naturally prefer to process and retain information. 
              Understanding your learning style can help you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Choose study methods that work best for you</li>
              <li>Communicate your needs effectively to tutors</li>
              <li>Find tutors who match your learning preferences</li>
              <li>Improve your academic performance</li>
            </ul>
          </div>

          <div className="text-center">
            <div className="bg-teachgenie-orange/10 border border-teachgenie-orange/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-teachgenie-deep-blue mb-2">
                Quiz Coming Soon!
              </h3>
              <p className="text-gray-700">
                We&apos;re working hard to create an interactive learning style assessment that will help you 
                discover your optimal learning approach. Check back soon!
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/tutors')}
                className="btn-teachgenie-primary px-8 py-3 text-lg"
              >
                Find Tutors Now
              </button>
              <div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-teachgenie-teal hover:text-teachgenie-teal-dark font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
