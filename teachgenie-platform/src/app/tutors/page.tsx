'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import TutorFilters from '@/components/tutors/TutorFilters'
import TutorPagination from '@/components/tutors/TutorPagination'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  avatar_url: string | null
}

type Tutor = Database['public']['Tables']['tutor_profiles']['Row'] & {
  profile: Profile | null
  subjects: Database['public']['Tables']['subjects']['Row'][]
}

type PriceRange = 'all' | 'under-25' | '25-50' | '50-75' | '75-100' | 'over-100'
type RatingFilter = 'all' | '4-plus' | '4.5-plus' | '5-star'

/*
 * PERFORMANCE OPTIMIZATION FOR LARGE DATASETS:
 * 
 * Current implementation loads all tutors client-side, which works well for 
 * datasets up to ~1000 tutors. For larger datasets, consider implementing:
 * 
 * 1. Server-side pagination with Supabase:
 *    - Use .range() for pagination
 *    - Add .limit() to control page size
 *    - Implement cursor-based pagination for better performance
 * 
 * 2. Server-side filtering:
 *    - Move text search to database level using full-text search
 *    - Use database indexes for price and rating filtering
 *    - Implement search suggestions/autocomplete
 * 
 * 3. Example server-side implementation:
 *    const fetchTutors = async (page: number, filters: FilterParams) => {
 *      const from = (page - 1) * tutorsPerPage
 *      const to = from + tutorsPerPage - 1
 *      
 *      let query = supabase
 *        .from('tutor_profiles')
 *        .select(`
 *          *,
 *          profile:profiles(*),
 *          subjects:tutor_subjects(subject:subjects(*))
 *        `)
 *        .eq('is_verified', true)
 *        .range(from, to)
 *      
 *      if (filters.searchQuery) {
 *        query = query.or(`profile.first_name.ilike.%${filters.searchQuery}%,profile.last_name.ilike.%${filters.searchQuery}%,bio.ilike.%${filters.searchQuery}%`)
 *      }
 *      
 *      if (filters.priceRange !== 'all') {
 *        // Add price range filtering
 *      }
 *      
 *      return await query
 *    }
 */

export default function TutorsPage() {
  // Core data state
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states - these control what tutors are displayed
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  
  // Pagination states - controls which page of results is shown
  const [currentPage, setCurrentPage] = useState(1)
  const [tutorsPerPage] = useState(12) // Fixed page size for consistent UX
  
  // Supporting data for filters and display
  const [subjects, setSubjects] = useState<Database['public']['Tables']['subjects']['Row'][]>([])
  const [reviewsSummary, setReviewsSummary] = useState<Record<string, { avg: number, count: number }>>({})

  useEffect(() => {
    const supabase = createClient()

    // Fetch all available subjects for the subject filter dropdown
    supabase
      .from('subjects')
      .select('*')
      .order('name')
      .then(({ data: subjectsData, error: subjectsError }) => {
        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError)
          setError('Failed to load subjects')
          return
        }
        if (subjectsData) {
          setSubjects(subjectsData)
        }
      })

    // Fetch all verified tutors with their profiles and subjects
    // This loads the complete dataset for client-side filtering
    supabase
      .from('tutor_profiles')
      .select(`
        *,
        profile:profiles(*),
        subjects:tutor_subjects(
          subject:subjects(*)
        )
      `)
      .eq('is_verified', true) // Only show verified tutors
      .then(async ({ data: tutorsData, error: tutorsError }) => {
        if (tutorsError) {
          console.error('Error fetching tutors:', tutorsError)
          setError('Failed to load tutors')
          return
        }

        if (!tutorsData) {
          setTutors([])
          setLoading(false)
          return
        }

        // Transform the nested data structure to match our Tutor type
        const transformedTutors = tutorsData
          .filter(tutor => tutor.profile !== null) // Filter out tutors without profiles
          .map(tutor => ({
            ...tutor,
            subjects: tutor.subjects?.map((s: any) => s.subject) || []
          }))
        
        // Fetch review data for each tutor (combines platform and external reviews)
        // This is needed for the rating filter functionality
        const summaries: Record<string, { avg: number, count: number }> = {}
        await Promise.all(transformedTutors.map(async (tutor) => {
          // Fetch platform reviews from our database
          const { data: platformReviews, error: platformReviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('tutor_id', tutor.id)
          
          // Fetch external reviews (from other platforms like Google, Yelp, etc.)
          const { data: externalReviews, error: externalReviewsError } = await supabase
            .from('external_reviews')
            .select('rating')
            .eq('tutor_id', tutor.id)
          
          if (!platformReviewsError && !externalReviewsError) {
            // Combine all reviews and calculate average rating
            const allReviews = [
              ...(platformReviews || []),
              ...(externalReviews || [])
            ]
            
            if (allReviews.length > 0) {
              const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
              summaries[tutor.id] = { avg, count: allReviews.length }
            } else {
              summaries[tutor.id] = { avg: 0, count: 0 }
            }
          } else {
            summaries[tutor.id] = { avg: 0, count: 0 }
          }
        }))
        
        // Sort tutors by: 1) Has ratings (tutors with reviews first), 2) Price (cheapest first)
        const sortedTutors = transformedTutors.sort((a, b) => {
          const aHasRatings = summaries[a.id] && summaries[a.id].count > 0
          const bHasRatings = summaries[b.id] && summaries[b.id].count > 0
          
          // First priority: Tutors with ratings come first
          if (aHasRatings && !bHasRatings) return -1
          if (!aHasRatings && bHasRatings) return 1
          
          // Second priority: If both have ratings or both don't have ratings, sort by price
          const aPrice = a.hourly_rate || 0
          const bPrice = b.hourly_rate || 0
          
          if (aPrice !== bPrice) {
            return aPrice - bPrice // Cheapest first
          }
          
          // Third priority: If prices are the same, sort alphabetically by first name
          const aFirstName = a.profile?.first_name || ''
          const bFirstName = b.profile?.first_name || ''
          return aFirstName.localeCompare(bFirstName)
        })
        
        setTutors(sortedTutors)
        setReviewsSummary(summaries)
        setLoading(false)
      })
  }, [])

  // Memoized filtering logic - recalculates only when dependencies change
  // This is the core search and filter functionality
  const filteredTutors = useMemo(() => {
    let filtered = tutors

    // Text search across multiple fields (name, bio, subjects)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tutor => {
        if (!tutor.profile) return false
        
        const fullName = `${tutor.profile.first_name || ''} ${tutor.profile.last_name || ''}`.toLowerCase()
        const bio = tutor.bio?.toLowerCase() || ''
        const subjectNames = tutor.subjects.map(s => s.name.toLowerCase()).join(' ')
        
        return fullName.includes(query) || 
               bio.includes(query) || 
               subjectNames.includes(query)
      })
    }

    // Filter by specific subject
    if (selectedSubject !== '') {
      filtered = filtered.filter(tutor => 
        tutor.subjects.some(subject => subject.id === selectedSubject)
      )
    }

    // Filter by price range (hourly rate)
    if (priceRange !== 'all') {
      filtered = filtered.filter(tutor => {
        if (!tutor.hourly_rate) return false // Skip tutors without set rates
        
        switch (priceRange) {
          case 'under-25':
            return tutor.hourly_rate < 25
          case '25-50':
            return tutor.hourly_rate >= 25 && tutor.hourly_rate < 50
          case '50-75':
            return tutor.hourly_rate >= 50 && tutor.hourly_rate < 75
          case '75-100':
            return tutor.hourly_rate >= 75 && tutor.hourly_rate < 100
          case 'over-100':
            return tutor.hourly_rate >= 100
          default:
            return true
        }
      })
    }

    // Filter by rating (average of all reviews)
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(tutor => {
        const reviewData = reviewsSummary[tutor.id]
        if (!reviewData || reviewData.count === 0) return false // Skip tutors without reviews
        
        switch (ratingFilter) {
          case '4-plus':
            return reviewData.avg >= 4.0
          case '4.5-plus':
            return reviewData.avg >= 4.5
          case '5-star':
            return reviewData.avg === 5.0
          default:
            return true
        }
      })
    }

    return filtered
  }, [tutors, searchQuery, selectedSubject, priceRange, ratingFilter, reviewsSummary])

  // Pagination logic - slice the filtered results to show current page
  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage)
  const paginatedTutors = filteredTutors.slice(
    (currentPage - 1) * tutorsPerPage, // Start index for current page
    currentPage * tutorsPerPage        // End index for current page
  )

  // Reset to first page whenever filters change
  // This prevents users from being on an empty page after filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedSubject, priceRange, ratingFilter])

  // Clear all active filters and return to initial state
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSubject('')
    setPriceRange('all')
    setRatingFilter('all')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Error state - show error message if data loading failed
  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">{error}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Advanced Filters Component - handles all search and filter UI */}
      <TutorFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        availableSubjects={subjects.map(s => ({ id: s.id, name: s.name }))}
        filteredCount={filteredTutors.length}
        totalCount={tutors.length}
        onClearFilters={clearFilters}
      />

      {/* Tutors Grid - displays the current page of filtered tutors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedTutors.map(tutor => (
          <div
            key={tutor.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[370px] max-h-[370px]"
          >
            <div className="p-6 flex flex-col h-full">
              {/* Tutor Header - Avatar, Name, Rate, and Rating */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                  {tutor.profile?.avatar_url ? (
                    <img
                      src={tutor.profile.avatar_url}
                      alt={`${tutor.profile.first_name} ${tutor.profile.last_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {tutor.profile?.first_name} {tutor.profile?.last_name}
                  </h3>
                  <p className="text-gray-600">
                    {tutor.hourly_rate ? `$${tutor.hourly_rate}/hour` : 'Rate not set'}
                  </p>
                  {/* Star Rating Display */}
                  <div className="flex items-center mt-1">
                    {reviewsSummary[tutor.id]?.count > 0 ? (
                      <>
                        {/* Render 5 stars, filled based on average rating */}
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(reviewsSummary[tutor.id].avg) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          ({reviewsSummary[tutor.id].avg.toFixed(1)}, {reviewsSummary[tutor.id].count} review{reviewsSummary[tutor.id].count > 1 ? 's' : ''})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">No reviews yet</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tutor Bio - truncated to 3 lines */}
              {tutor.bio && (
                <p className="mt-4 text-gray-600 line-clamp-3">{tutor.bio}</p>
              )}
              
              {/* Subject Tags - shows up to 6 subjects, with overflow indicator */}
              <div
                className="mt-4 flex flex-wrap gap-2 max-h-16 relative"
                title={tutor.subjects.map(s => s.name).join(', ')} // Full tooltip on hover
              >
                {tutor.subjects.slice(0, 6).map(subject => (
                  <span
                    key={subject.id}
                    className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {subject.name}
                  </span>
                ))}
                {tutor.subjects.length > 6 && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">+{tutor.subjects.length - 6} more</span>
                )}
              </div>
              
              {/* View Profile Button - positioned at bottom of card */}
              <div className="mt-auto pt-6">
                <a
                  href={`/tutors/${tutor.id}`}
                  className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Profile
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message - shown when filters return no matches */}
      {filteredTutors.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No tutors found</h3>
          <p className="mt-2 text-gray-600">
            Try adjusting your search criteria or filters
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Pagination Component - handles page navigation */}
      <TutorPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalTutors={filteredTutors.length}
        tutorsPerPage={tutorsPerPage}
      />
    </div>
  )
} 