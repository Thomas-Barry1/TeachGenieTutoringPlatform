'use client'

interface SessionPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function SessionPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: SessionPaginationProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="mt-8">
      {/* Pagination controls */}
      <div className="flex justify-center">
        <nav className="flex items-center space-x-2">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {/* First page */}
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </>
          )}
          
          {/* Page numbers */}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          {/* Last page */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
          
          {/* Next button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </nav>
      </div>

      {/* Page info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Page {currentPage} of {totalPages} • Showing {startItem} to {endItem} of {totalItems} sessions
      </div>
    </div>
  )
} 