import { formatCurrency } from './format'

describe('formatCurrency', () => {
  it('formats a normal number', () => {
    expect(formatCurrency(1000)).toBe('₫1.000')
  })

  it('formats a string input', () => {
    expect(formatCurrency('5000' as unknown as number)).toBe('₫5.000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₫0')
  })

  it('formats a large number', () => {
    expect(formatCurrency(1000000)).toBe('₫1.000.000')
  })

  it('formats a decimal number (rounds)', () => {
    const result = formatCurrency(1000.5)
    // vi-VN locale rounds to nearest integer
    expect(result).toMatch(/₫1\.00[01]/)
  })

  it('formats a negative number', () => {
    expect(formatCurrency(-5000)).toBe('₫-5.000')
  })

  it('formats NaN', () => {
    expect(formatCurrency(NaN)).toBe('₫NaN')
  })
})
