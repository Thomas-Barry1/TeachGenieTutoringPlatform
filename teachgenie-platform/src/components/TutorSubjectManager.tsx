import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Subject = {
  id: string
  name: string
  category: string
}

type TutorSubject = {
  tutor_id: string
  subject_id: string
  subject: Subject
}

export default function TutorSubjectManager({ tutorId }: { tutorId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const supabase = createClient()

  useEffect(() => {
    loadSubjects()
    loadTutorSubjects()
  }, [tutorId])

  async function loadSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      setError('Failed to load subjects')
      console.error('Error loading subjects:', error)
      return
    }

    setSubjects(data || [])
  }

  async function loadTutorSubjects() {
    const { data, error } = await supabase
      .from('tutor_subjects')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('tutor_id', tutorId)

    if (error) {
      setError('Failed to load tutor subjects')
      console.error('Error loading tutor subjects:', error)
      return
    }

    setTutorSubjects(data || [])
    setLoading(false)
  }

  async function ensureTutorProfile() {
    // Check if tutor profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('id', tutorId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error('Failed to check tutor profile')
    }

    // If profile doesn't exist, create it
    if (!existingProfile) {
      const { error: createError } = await supabase
        .from('tutor_profiles')
        .insert({
          id: tutorId,
          is_verified: false
        })

      if (createError) {
        throw new Error('Failed to create tutor profile')
      }
    }
  }

  async function addSubject(subjectId: string) {
    try {
      // Ensure tutor profile exists before adding subject
      await ensureTutorProfile()

      const { error } = await supabase
        .from('tutor_subjects')
        .insert([
          {
            tutor_id: tutorId,
            subject_id: subjectId
          }
        ])

      if (error) {
        setError('Failed to add subject')
        console.error('Error adding subject:', error)
        return
      }

      await loadTutorSubjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subject')
      console.error('Error in addSubject:', err)
    }
  }

  async function removeSubject(subjectId: string) {
    const { error } = await supabase
      .from('tutor_subjects')
      .delete()
      .eq('tutor_id', tutorId)
      .eq('subject_id', subjectId)

    if (error) {
      setError('Failed to remove subject')
      console.error('Error removing subject:', error)
      return
    }

    await loadTutorSubjects()
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading subjects...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>
  }

  const availableSubjects = subjects.filter(
    subject => !tutorSubjects.some(ts => ts.subject_id === subject.id)
  )

  // Get unique categories from subjects
  const categories = Array.from(new Set(subjects.map(s => s.category))).sort()

  // Filter available subjects by search and category
  const filteredAvailableSubjects = availableSubjects.filter(subject => {
    const matchesCategory = selectedCategory === 'All' || subject.category === selectedCategory
    const matchesSearch = subject.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Your Subjects</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage the subjects you can tutor in
        </p>
      </div>

      {tutorSubjects.length > 0 ? (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {tutorSubjects.map(({ subject }) => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="font-medium">{subject.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({subject.category})
                </span>
              </div>
              <button
                onClick={() => removeSubject(subject.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No subjects added yet</p>
      )}

      {availableSubjects.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Add Subject</h4>
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center w-full">
            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-grow min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm bg-gray-50"
            />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm bg-gray-50"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
            {filteredAvailableSubjects.length > 0 ? (
              filteredAvailableSubjects.map(subject => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{subject.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({subject.category})
                    </span>
                  </div>
                  <button
                    onClick={() => addSubject(subject.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Add
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No subjects found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 