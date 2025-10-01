'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

// VARK Learning Styles
type VARKType = 'V' | 'A' | 'R' | 'K'

interface VARKResult {
  V: number
  A: number
  R: number
  K: number
  primary: VARKType
  secondary?: VARKType
}

interface Question {
  id: number
  text: string
  options: {
    text: string
    type: VARKType
  }[]
}

const VARK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "You are helping someone who wants to go to your airport, town center, or railway station. You would:",
    options: [
      { text: "Go with them", type: 'K' },
      { text: "Tell them the directions", type: 'A' },
      { text: "Write down the directions", type: 'R' },
      { text: "Draw a map or give them a map", type: 'V' }
    ]
  },
  {
    id: 2,
    text: "A website has a video showing how to make a special graph. There is a person speaking, some lists and words describing what to do, and some diagrams. You would learn most from:",
    options: [
      { text: "Seeing the diagrams", type: 'V' },
      { text: "Listening to the person", type: 'A' },
      { text: "Reading the words and lists", type: 'R' },
      { text: "Watching the actions", type: 'K' }
    ]
  },
  {
    id: 3,
    text: "You are planning a vacation for a group. You want some feedback from them about your plans. You would:",
    options: [
      { text: "Describe some of the highlights they will experience", type: 'A' },
      { text: "Use a map to show them the places", type: 'V' },
      { text: "Give them a copy of the printed itinerary", type: 'R' },
      { text: "Walk them through your plan in person", type: 'K' }
    ]
  },
  {
    id: 4,
    text: "You are going to cook something as a special treat for your family. You would:",
    options: [
      { text: "Cook something you know without the need for instructions", type: 'K' },
      { text: "Ask friends for suggestions", type: 'A' },
      { text: "Look at pictures on the Internet or in some cookbooks for ideas", type: 'V' },
      { text: "Use a cookbook where you know there's a good recipe", type: 'R' }
    ]
  },
  {
    id: 5,
    text: "A group of tourists want to learn about the parks or wildlife reserves in your area. You would:",
    options: [
      { text: "Talk about, or arrange a talk for them about parks and wildlife reserves", type: 'A' },
      { text: "Show them internet pictures, photographs or picture books", type: 'V' },
      { text: "Take them to a park or wildlife reserve and walk with them", type: 'K' },
      { text: "Give them a book or pamphlets about the parks or wildlife reserves", type: 'R' }
    ]
  },
  {
    id: 6,
    text: "You are about to purchase a digital camera or mobile phone. Other than price, what would most influence your decision?",
    options: [
      { text: "The salesperson telling me about its features", type: 'A' },
      { text: "Reading details about its features", type: 'R' },
      { text: "Playing with it and testing its features", type: 'K' },
      { text: "The design and look of it", type: 'V' }
    ]
  },
  {
    id: 7,
    text: "Remember a time when you learned how to do something new. Try to avoid choosing a physical skill, e.g. riding a bike. You learned best by:",
    options: [
      { text: "Trying it out yourself", type: 'K' },
      { text: "Listening to somebody explaining it and asking questions", type: 'A' },
      { text: "Diagrams and charts - visual clues", type: 'V' },
      { text: "Written instructions - e.g. a manual or book", type: 'R' }
    ]
  },
  {
    id: 8,
    text: "You have a problem with your heart. You would prefer that the doctor:",
    options: [
      { text: "Used a plastic model to explain what was wrong", type: 'K' },
      { text: "Gave you a pamphlet to read about it", type: 'R' },
      { text: "Described what was wrong", type: 'A' },
      { text: "Showed you a diagram of what was wrong", type: 'V' }
    ]
  },
  {
    id: 9,
    text: "You want to learn a new program, skill or game on a computer. You would:",
    options: [
      { text: "Read the written instructions that came with the program", type: 'R' },
      { text: "Talk with people who know about the program", type: 'A' },
      { text: "Use the controls or keyboard", type: 'K' },
      { text: "Follow the diagrams in the book that came with it", type: 'V' }
    ]
  },
  {
    id: 10,
    text: "I like websites that have:",
    options: [
      { text: "Things I can click on or touch", type: 'K' },
      { text: "Interesting design and visual features", type: 'V' },
      { text: "Interesting written descriptions, lists and explanations", type: 'R' },
      { text: "Audio channels where I can hear music, radio programs or interviews", type: 'A' }
    ]
  },
  {
    id: 11,
    text: "Other than price, what would most influence your decision to buy a new non-fiction book?",
    options: [
      { text: "The way it looks is appealing", type: 'V' },
      { text: "A friend talks about it and recommends it", type: 'A' },
      { text: "Quickly reading parts of it", type: 'R' },
      { text: "It has real-life stories, experiences and examples", type: 'K' }
    ]
  },
  {
    id: 12,
    text: "You are using a book, CD or website to learn how to take photos with your new digital camera. You would like to have:",
    options: [
      { text: "A chance to ask questions and talk about the camera and its features", type: 'A' },
      { text: "Clear written instructions with lists and bullet-points about what to do", type: 'R' },
      { text: "Many examples of good and poor photos and how to improve them", type: 'V' },
      { text: "A chance to use the camera and try it out", type: 'K' }
    ]
  },
  {
    id: 13,
    text: "Do you prefer a teacher or presenter who uses:",
    options: [
      { text: "Demonstrations, models or practical sessions", type: 'K' },
      { text: "Question and answer, talk, group discussion, or guest speakers", type: 'A' },
      { text: "Handouts, books, or readings", type: 'R' },
      { text: "Diagrams, charts, graphs or other visual aids", type: 'V' }
    ]
  },
  {
    id: 14,
    text: "You have finished a competition or test and would like some feedback. You would like to have feedback:",
    options: [
      { text: "Using examples from what you did", type: 'K' },
      { text: "Using a written description of your results", type: 'R' },
      { text: "From somebody who talks it through with you", type: 'A' },
      { text: "Using graphs showing what you had achieved", type: 'V' }
    ]
  },
  {
    id: 15,
    text: "You are going to choose food at a restaurant or cafe. You would:",
    options: [
      { text: "Choose something that you have had there before", type: 'K' },
      { text: "Listen to the waiter or ask friends to recommend choices", type: 'A' },
      { text: "Choose from the descriptions in the menu", type: 'R' },
      { text: "Look at what others are eating or look at pictures of each dish", type: 'V' }
    ]
  },
  {
    id: 16,
    text: "You have to make an important speech at a conference or special occasion. You would:",
    options: [
      { text: "Make diagrams or get graphs to help explain things", type: 'V' },
      { text: "Write a few key words and practice saying your speech over and over", type: 'A' },
      { text: "Write out your speech and learn from reading it over several times", type: 'R' },
      { text: "Gather many examples and stories to make the talk real and practical", type: 'K' }
    ]
  }
]

const VARK_DESCRIPTIONS = {
  V: {
    name: 'Visual',
    description: 'You learn best through visual aids such as diagrams, charts, graphs, and pictures. You prefer to see information rather than hear it.',
    characteristics: [
      'Prefer visual representations of information',
      'Like charts, graphs, and diagrams',
      'Use color coding and highlighting',
      'Benefit from mind maps and visual organizers',
      'Remember faces better than names'
    ],
    studyTips: [
      'Use visual aids like diagrams and charts',
      'Create mind maps and concept maps',
      'Use color coding in your notes',
      'Watch educational videos',
      'Draw pictures to represent concepts'
    ]
  },
  A: {
    name: 'Aural/Auditory',
    description: 'You learn best through listening and speaking. You prefer to hear information and discuss it with others.',
    characteristics: [
      'Learn best through listening',
      'Prefer discussions and group work',
      'Remember what you hear',
      'Like to talk through problems',
      'Benefit from lectures and audio materials'
    ],
    studyTips: [
      'Record lectures and listen to them again',
      'Discuss topics with study groups',
      'Read aloud or use text-to-speech',
      'Use mnemonic devices and rhymes',
      'Explain concepts to others'
    ]
  },
  R: {
    name: 'Read/Write',
    description: 'You learn best through reading and writing. You prefer text-based materials and written instructions.',
    characteristics: [
      'Prefer written information',
      'Learn best through reading',
      'Like to take detailed notes',
      'Benefit from written instructions',
      'Prefer lists and bullet points'
    ],
    studyTips: [
      'Take detailed written notes',
      'Rewrite information in your own words',
      'Use lists and bullet points',
      'Read textbooks and articles',
      'Write summaries and essays'
    ]
  },
  K: {
    name: 'Kinesthetic',
    description: 'You learn best through hands-on experience and physical activities. You prefer to learn by doing.',
    characteristics: [
      'Learn best through hands-on experience',
      'Prefer practical activities',
      'Like to move around while learning',
      'Benefit from experiments and demonstrations',
      'Remember what you do'
    ],
    studyTips: [
      'Use hands-on activities and experiments',
      'Take frequent breaks to move around',
      'Use physical models and manipulatives',
      'Practice with real-world applications',
      'Study in different locations'
    ]
  }
}

export default function LearningStyleQuizPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: VARKType }>({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<VARKResult | null>(null)

  // Client-side authentication check (same pattern as inbox page)
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.replace('/auth/login')
    }
  }, [user, loading, router])

  const handleAnswerSelect = (questionId: number, answerType: VARKType) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerType
    }))
  }

  const handleNext = () => {
    if (currentQuestion < VARK_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      calculateResults()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const calculateResults = async () => {
    const scores = { V: 0, A: 0, R: 0, K: 0 }
    
    Object.values(answers).forEach(answer => {
      scores[answer]++
    })

    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a)
    const primary = sortedScores[0][0] as VARKType
    const secondary = sortedScores[1][1] > 0 ? sortedScores[1][0] as VARKType : undefined

    const result: VARKResult = {
      ...scores,
      primary,
      secondary
    }

    // Store learning style results in database
    if (user) {
      try {
        const supabase = createClient()
        
        // First, delete any existing learning style entries for this user
        await supabase
          .from('user_info')
          .delete()
          .eq('user_id', user.id)
          .contains('category', ['learning_style'])

        // Create learning style entries for primary and secondary styles
        const learningStyles = [primary]
        if (secondary) {
          learningStyles.push(secondary)
        }

        const entriesToInsert = learningStyles.map((style, index) => ({
          user_id: user.id,
          category: ['learning_style'],
          confidence_score: index === 0 ? 1.0 : 0.8, // Primary gets 1.0, secondary gets 0.8
        }))

        const { data, error } = await supabase
          .from('user_info')
          .insert(entriesToInsert)
          .select()

        if (error) {
          console.error('Error saving learning style results:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          // Still show results even if saving fails
        } else {
          console.log('Learning style results saved successfully:', data)
        }
      } catch (error) {
        console.error('Error saving learning style results:', error)
        // Still show results even if saving fails
      }
    }

    setResults(result)
    setShowResults(true)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setResults(null)
  }

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

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-teachgenie-deep-blue mb-4">
                Your Learning Style Results
              </h1>
              <p className="text-lg text-gray-600">
                Based on your responses, here&apos;s your VARK learning style profile
              </p>
            </div>

            <div className="mb-8">
              <div className="bg-gradient-to-r from-teachgenie-orange to-teachgenie-orangeLight rounded-lg p-6 text-white text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  Primary Learning Style: {VARK_DESCRIPTIONS[results.primary].name}
                </h2>
                <p className="text-lg opacity-90">
                  {VARK_DESCRIPTIONS[results.primary].description}
                </p>
              </div>

              {results.secondary && (
                <div className="bg-teachgenie-teal/10 border border-teachgenie-teal/20 rounded-lg p-4 text-center mb-6">
                  <h3 className="text-lg font-semibold text-teachgenie-deep-blue mb-2">
                    Secondary Learning Style: {VARK_DESCRIPTIONS[results.secondary].name}
                  </h3>
                  <p className="text-gray-700">
                    You also show strong tendencies toward {VARK_DESCRIPTIONS[results.secondary].name.toLowerCase()} learning
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-teachgenie-deep-blue mb-4">
                    Your Learning Characteristics
                  </h3>
                  <ul className="space-y-2">
                    {VARK_DESCRIPTIONS[results.primary].characteristics.map((char, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-teachgenie-orange mr-2">•</span>
                        <span className="text-gray-700">{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-teachgenie-deep-blue mb-4">
                    Study Tips for You
                  </h3>
                  <ul className="space-y-2">
                    {VARK_DESCRIPTIONS[results.primary].studyTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-teachgenie-teal mr-2">•</span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-teachgenie-deep-blue/10 border border-teachgenie-deep-blue/20 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-teachgenie-deep-blue mb-4">
                  Your VARK Scores
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries({ V: 'Visual', A: 'Aural', R: 'Read/Write', K: 'Kinesthetic' }).map(([key, name]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-teachgenie-deep-blue mb-1">
                        {results[key as VARKType]}
                      </div>
                      <div className="text-sm text-gray-600">{name}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-teachgenie-orange h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(results[key as VARKType] / 16) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center space-y-4">
                <button
                  onClick={resetQuiz}
                  className="btn-teachgenie-primary px-8 py-3 text-lg mr-4"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() => router.push('/tutors')}
                  className="btn-teachgenie-secondary px-8 py-3 text-lg"
                >
                  Find Tutors Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = VARK_QUESTIONS[currentQuestion]
  const progress = (currentQuestion / VARK_QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-teachgenie-deep-blue mb-4">
              VARK Learning Style Quiz
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover your unique learning style to optimize your study habits and find the perfect tutor match.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {currentQuestion + 1} of {VARK_QUESTIONS.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentQuestion / VARK_QUESTIONS.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teachgenie-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-teachgenie-deep-blue mb-6">
              {currentQ.text}
            </h2>
            
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <label
                  key={index}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    answers[currentQ.id] === option.type
                      ? 'border-teachgenie-orange bg-teachgenie-orange/5'
                      : 'border-gray-200 hover:border-teachgenie-teal hover:bg-teachgenie-teal/5'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ.id}`}
                    value={option.type}
                    checked={answers[currentQ.id] === option.type}
                    onChange={() => handleAnswerSelect(currentQ.id, option.type)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      answers[currentQ.id] === option.type
                        ? 'border-teachgenie-orange bg-teachgenie-orange'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQ.id] === option.type && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <span className="text-gray-700">{option.text}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                !answers[currentQ.id]
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'btn-teachgenie-primary'
              }`}
            >
              {currentQuestion === VARK_QUESTIONS.length - 1 ? 'See Results' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
