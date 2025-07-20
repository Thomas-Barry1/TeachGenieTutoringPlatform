'use client'

interface TutorPaginationProps {
  currentPage: number        // Current active page (1-based indexing)
  totalPages: number         // Total number of pages available
  onPageChange: (page: number) => void  // Callback when user clicks a page
  totalTutors: number        // Total number of tutors in filtered results
  tutorsPerPage: number      // Number of tutors shown per page
}

export default function TutorPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalTutors,
  tutorsPerPage
}: TutorPaginationProps) {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) return null

  // Calculate the range of tutors being displayed on current page
  const startTutor = (currentPage - 1) * tutorsPerPage + 1
  const endTutor = Math.min(currentPage * tutorsPerPage, totalTutors)

  /**
   * Smart page number generation with ellipsis support
   * Shows max 5 page numbers at once to prevent UI clutter
   * Always shows first and last page when there are gaps
   */
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5  // Maximum number of page buttons to show
    const halfVisible = Math.floor(maxVisiblePages / 2)

    // Calculate the range of pages to show around current page
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust start page if we're near the end (to show 5 pages when possible)
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Add first page and ellipsis if there's a gap at the beginning
    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) {
        pages.push('...') // Show ellipsis if there's more than one page gap
      }
    }

    // Add the visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Add ellipsis and last page if there's a gap at the end
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...') // Show ellipsis if there's more than one page gap
      }
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        {/* Results counter - shows "Showing X to Y of Z tutors" */}
        <div className="text-sm text-gray-700 text-center sm:text-left">
          Showing {startTutor} to {endTutor} of {totalTutors} tutors
        </div>

        {/* Pagination controls - Previous, Page Numbers, Next */}
        <div className="flex items-center justify-center space-x-2">
          {/* Previous page button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page number buttons with smart ellipsis */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'  // Active page
                    : page === '...'
                    ? 'text-gray-400 cursor-not-allowed'  // Ellipsis (non-clickable)
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'  // Inactive pages
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next page button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 