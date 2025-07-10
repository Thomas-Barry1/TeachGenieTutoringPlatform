'use client'

import { useState } from 'react'

type FilterType = 'upcoming' | 'past' | 'all'
type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled'
type PaymentFilter = 'all' | 'paid' | 'pending' | 'failed'

interface SessionFiltersProps {
  filter: FilterType
  setFilter: (filter: FilterType) => void
  statusFilter: StatusFilter
  setStatusFilter: (filter: StatusFilter) => void
  paymentFilter: PaymentFilter
  setPaymentFilter: (filter: PaymentFilter) => void
  subjectFilter: string
  setSubjectFilter: (filter: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  availableSubjects: Array<{id: string, name: string}>
  filteredCount: number
  totalCount: number
  onClearFilters: () => void
}

export default function SessionFilters({
  filter,
  setFilter,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
  subjectFilter,
  setSubjectFilter,
  searchQuery,
  setSearchQuery,
  availableSubjects,
  filteredCount,
  totalCount,
  onClearFilters
}: SessionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {/* Time-based filter buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-1">
                Payment
              </label>
              <select
                id="payment"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter summary and clear button */}
      <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Clear all filters
        </button>
        <div className="text-sm text-gray-600">
          Showing {filteredCount} of {totalCount} sessions
        </div>
      </div>
    </div>
  )
} 