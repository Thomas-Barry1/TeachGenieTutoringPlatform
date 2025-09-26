/**
 * Utility functions for price display and calculations
 */

/**
 * Calculate price range based on hourly rate
 * @param hourlyRate - The base hourly rate
 * @returns Object with min and max prices
 */
export function calculatePriceRange(hourlyRate: number | null): { min: number; max: number } | null {
  if (!hourlyRate) return null
  
  const range = 10 // $10 range
  const min = Math.max(10, hourlyRate - range) // Ensure minimum is at least $10
  const max = hourlyRate + range
  
  return { min, max }
}

/**
 * Format price range for display
 * @param hourlyRate - The base hourly rate
 * @returns Formatted price range string or null
 */
export function formatPriceRange(hourlyRate: number | null): string | null {
  const range = calculatePriceRange(hourlyRate)
  if (!range) return null
  
  return `$${range.min}-$${range.max}/hour`
}
