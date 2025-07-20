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

  it('shows advanced filters when expanded', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Initially, advanced filters should be hidden
    expect(screen.queryByText('Subject')).not.toBeInTheDocument()
    
    // Click to expand
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    // Now advanced filters should be visible
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('Price Range')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
  })

  it('calls setSearchQuery when search input changes', () => {
    render(<TutorFilters {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search tutors by name, bio, or subjects...')
    fireEvent.change(searchInput, { target: { value: 'math tutor' } })
    
    expect(mockProps.setSearchQuery).toHaveBeenCalledWith('math tutor')
  })

  it('calls setPriceRange when price dropdown changes', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Expand advanced filters first
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    const priceSelect = screen.getByLabelText('Price Range')
    fireEvent.change(priceSelect, { target: { value: 'under-25' } })
    
    expect(mockProps.setPriceRange).toHaveBeenCalledWith('under-25')
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

  it('renders all price range options in dropdown', () => {
    render(<TutorFilters {...mockProps} />)
    
    // Expand advanced filters
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    const priceSelect = screen.getByLabelText('Price Range')
    expect(priceSelect).toHaveValue('all')
    
    // Check that all price ranges are rendered as options
    expect(priceSelect).toHaveTextContent('All Prices')
    expect(priceSelect).toHaveTextContent('Under $25')
    expect(priceSelect).toHaveTextContent('$25-$50')
    expect(priceSelect).toHaveTextContent('$50-$75')
    expect(priceSelect).toHaveTextContent('$75-$100')
    expect(priceSelect).toHaveTextContent('Over $100')
  })

  it('shows correct price range value when prop is set', () => {
    render(<TutorFilters {...mockProps} priceRange="25-50" />)
    
    // Expand advanced filters
    fireEvent.click(screen.getByText('Show advanced filters'))
    
    const priceSelect = screen.getByLabelText('Price Range')
    expect(priceSelect).toHaveValue('25-50')
  })

  it('toggles advanced filters visibility', () => {
    render(<TutorFilters {...mockProps} />)
    
    const toggleButton = screen.getByText('Show advanced filters')
    
    // Initially hidden
    expect(screen.queryByText('Subject')).not.toBeInTheDocument()
    
    // Show advanced filters
    fireEvent.click(toggleButton)
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('Price Range')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
    expect(screen.getByText('Hide advanced filters')).toBeInTheDocument()
    
    // Hide advanced filters
    fireEvent.click(screen.getByText('Hide advanced filters'))
    expect(screen.queryByText('Subject')).not.toBeInTheDocument()
    expect(screen.queryByText('Price Range')).not.toBeInTheDocument()
    expect(screen.queryByText('Rating')).not.toBeInTheDocument()
    expect(screen.getByText('Show advanced filters')).toBeInTheDocument()
  })
}) 