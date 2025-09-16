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
  isLoading?: boolean
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
  onClearFilters,
  isLoading = false
}: TutorFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
      {/* Main search bar and advanced filters toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
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
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
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

      {/* Advanced filters - Always render to prevent CLS */}
      <div className={`space-y-4 border-t border-gray-200 pt-4 transition-all duration-300 ${isExpanded ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        {/* Filters grid - Stack on mobile, 3 columns on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Price Range Filter */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <select
              id="price"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Prices</option>
              <option value="under-25">Under $25</option>
              <option value="25-50">$25-$50</option>
              <option value="50-75">$50-$75</option>
              <option value="75-100">$75-$100</option>
              <option value="over-100">Over $100</option>
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