import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TutorFilters from './TutorFilters'

// Mock the component props
const mockProps = {
  searchQuery: '',
  setSearchQuery: jest.fn(),
  selectedSubject: '',
  setSelectedSubject: jest.fn(),
  priceRange: 'all' as const,
  setPriceRange: jest.fn(),
  ratingFilter: 'all' as const,
  setRatingFilter: jest.fn(),
  availableSubjects: [
    { id: '1', name: 'Mathematics' },
    { id: '2', name: 'Physics' },
    { id: '3', name: 'Chemistry' }
  ],
  filteredCount: 10,
  totalCount: 25,
  onClearFilters: jest.fn()
}

describe('TutorFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search input', () => {
    render(<TutorFilters {...mockProps} />)
    expect(screen.getByPlaceholderText('Search tutors by name, bio, or subjects...')).toBeInTheDocument()
  })

  it('renders all quick filter buttons', () => {
    render(<TutorFilters {...mockProps} />)
    expect(screen.getByText('All Prices')).toBeInTheDocument()
    expect(screen.getByText('Under $25')).toBeInTheDocument()
    expect(screen.getByText('$25-$50')).toBeInTheDocument()
    expect(screen.getByText('$50-$75')).toBeInTheDocument()
    expect(screen.getByText('$75-$100')).toBeInTheDocument()
    expect(screen.getByText('Over $100')).toBeInTheDocument()
  })

  it('shows advanced filters when expanded', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Initially, advanced filters should be hidden
    expect(screen.queryByText('Subject')).not.toBeInTheDocument()
    
    // Click to expand
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    // Now advanced filters should be visible
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
  })

  it('calls setSearchQuery when search input changes', () => {
    render(<TutorFilters {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tutors by name, bio, or subjects...')
    fireEvent.change(searchInput, { target: { value: 'math tutor' } })
    
    expect(mockProps.setSearchQuery).toHaveBeenCalledWith('math tutor')
  })

  it('calls setPriceRange when quick filter buttons are clicked', () => {
    render(<TutorFilters {...mockProps} />)
    
    fireEvent.click(screen.getByText('Under $25'))
    expect(mockProps.setPriceRange).toHaveBeenCalledWith('under-25')
    
    fireEvent.click(screen.getByText('$25-$50'))
    expect(mockProps.setPriceRange).toHaveBeenCalledWith('25-50')
    
    fireEvent.click(screen.getByText('$50-$75'))
    expect(mockProps.setPriceRange).toHaveBeenCalledWith('50-75')
    
    fireEvent.click(screen.getByText('$75-$100'))
    expect(mockProps.setPriceRange).toHaveBeenCalledWith('75-100')
    
    fireEvent.click(screen.getByText('Over $100'))
    expect(mockProps.setPriceRange).toHaveBeenCalledWith('over-100')
  })

  it('calls setSelectedSubject when subject dropdown changes', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Expand advanced filters first
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    const subjectSelect = screen.getByLabelText('Subject')
    fireEvent.change(subjectSelect, { target: { value: '1' } })
    
    expect(mockProps.setSelectedSubject).toHaveBeenCalledWith('1')
  })

  it('calls setRatingFilter when rating dropdown changes', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Expand advanced filters first
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    const ratingSelect = screen.getByLabelText('Rating')
    fireEvent.change(ratingSelect, { target: { value: '4-plus' } })
    
    expect(mockProps.setRatingFilter).toHaveBeenCalledWith('4-plus')
  })

  it('calls onClearFilters when clear button is clicked', () => {
    render(<TutorFilters {...mockProps} />)
    
    fireEvent.click(screen.getByText('Clear all filters'))
    expect(mockProps.onClearFilters).toHaveBeenCalled()
  })

  it('displays correct count information', () => {
    render(<TutorFilters {...mockProps} />)
    
    expect(screen.getByText('Showing 10 of 25 tutors')).toBeInTheDocument()
  })

  it('renders all available subjects in dropdown', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Expand advanced filters
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    const subjectSelect = screen.getByLabelText('Subject')
    expect(subjectSelect).toHaveValue('')
    
    // Check that all subjects are rendered as options
    expect(subjectSelect).toHaveTextContent('Mathematics')
    expect(subjectSelect).toHaveTextContent('Physics')
    expect(subjectSelect).toHaveTextContent('Chemistry')
  })

  it('highlights active price range button', () => {
    render(<TutorFilters {...mockProps} priceRange="25-50" />)
    
    const activeButton = screen.getByText('$25-$50')
    expect(activeButton).toHaveClass('bg-primary-600', 'text-white')
    
    const inactiveButton = screen.getByText('All Prices')
    expect(inactiveButton).toHaveClass('bg-gray-100', 'text-gray-700')
  })

  it('toggles advanced filters visibility', () => {
    render(<TutorFilters {...mockProps} />)
    
    const toggleButton = screen.getByText('Show advanced filters')
    
    // Initially hidden
    expect(screen.queryByText('Subject')).not.toBeInTheDocument()
    
    // Show advanced filters
    fireEvent.click(toggleButton)
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('Hide advanced filters')).toBeInTheDocument()
    
    // Hide advanced filters
    fireEvent.click(screen.getByText('Hide advanced filters'))
    expect(screen.queryByText('Subject')).not.toBeInTheDocument()
    expect(screen.getByText('Show advanced filters')).toBeInTheDocument()
  })
}) 