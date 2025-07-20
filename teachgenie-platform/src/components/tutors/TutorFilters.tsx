'use client'

import { useState } from 'react'

type PriceRange = 'all' | 'under-25' | '25-50' | '50-75' | '75-100' | 'over-100'
type RatingFilter = 'all' | '4-plus' | '4.5-plus' | '5-star'

interface TutorFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedSubject: string
  setSelectedSubject: (subject: string) => void
  priceRange: PriceRange
  setPriceRange: (range: PriceRange) => void
  ratingFilter: RatingFilter
  setRatingFilter: (rating: RatingFilter) => void
  availableSubjects: Array<{id: string, name: string}>
  filteredCount: number
  totalCount: number
  onClearFilters: () => void
}

export default function TutorFilters({
  searchQuery,
  setSearchQuery,
  selectedSubject,
  setSelectedSubject,
  priceRange,
  setPriceRange,
  ratingFilter,
  setRatingFilter,
  availableSubjects,
  filteredCount,
  totalCount,
  onClearFilters
}: TutorFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
      {/* Main search bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search tutors by name, bio, or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Quick filters row */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setPriceRange('all')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              priceRange === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Prices
          </button>
          <button
            onClick={() => setPriceRange('under-25')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              priceRange === 'under-25'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Under $25
          </button>
          <button
            onClick={() => setPriceRange('25-50')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              priceRange === '25-50'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            $25-$50
          </button>
          <button
            onClick={() => setPriceRange('50-75')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              priceRange === '50-75'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            $50-$75
          </button>
          <button
            onClick={() => setPriceRange('75-100')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              priceRange === '75-100'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            $75-$100
          </button>
          <button
            onClick={() => setPriceRange('over-100')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              priceRange === 'over-100'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Over $100
          </button>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center sm:justify-start space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span>{isExpanded ? 'Hide' : 'Show'} advanced filters</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Advanced filters */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Filters grid - Stack on mobile, 2 columns on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject Filter */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Subjects</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <select
                id="rating"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Ratings</option>
                <option value="4-plus">4+ Stars</option>
                <option value="4.5-plus">4.5+ Stars</option>
                <option value="5-star">5 Stars Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter summary and clear button */}
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-200 space-y-2 sm:space-y-0">
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 underline text-center sm:text-left"
        >
          Clear all filters
        </button>
        <div className="text-sm text-gray-600 text-center sm:text-right">
          Showing {filteredCount} of {totalCount} tutors
        </div>
      </div>
    </div>
  )
} 