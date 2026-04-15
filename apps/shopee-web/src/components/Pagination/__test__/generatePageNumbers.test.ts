import { describe, it, expect } from 'vitest'
import { generatePageNumbers } from '../generatePageNumbers'

describe('generatePageNumbers', () => {
  it('returns empty array for 0 total pages', () => {
    expect(generatePageNumbers(1, 0)).toEqual([])
  })

  it('returns single page for totalPages=1', () => {
    const result = generatePageNumbers(1, 1)
    expect(result).toEqual([{ type: 'page', number: 1 }])
  })

  it('returns all pages when totalPages <= 5', () => {
    const result = generatePageNumbers(1, 5)
    const pageNumbers = result.filter((i) => i.type === 'page').map((i) => (i as any).number)
    expect(pageNumbers).toEqual([1, 2, 3, 4, 5])
  })

  it('shows dots after when current page is near start', () => {
    const result = generatePageNumbers(1, 20)
    const types = result.map((i) => i.type)
    expect(types).toContain('dots')
    // First pages should be visible
    expect(result[0]).toEqual({ type: 'page', number: 1 })
    expect(result[1]).toEqual({ type: 'page', number: 2 })
    expect(result[2]).toEqual({ type: 'page', number: 3 })
  })

  it('shows dots before when current page is near end', () => {
    const result = generatePageNumbers(20, 20)
    const types = result.map((i) => i.type)
    expect(types).toContain('dots')
    // Last pages should be visible
    const pages = result.filter((i) => i.type === 'page').map((i) => (i as any).number)
    expect(pages).toContain(20)
    expect(pages).toContain(19)
    expect(pages).toContain(18)
  })

  it('shows dots before and after when current page is in middle', () => {
    const result = generatePageNumbers(10, 20)
    const dotsCount = result.filter((i) => i.type === 'dots').length
    expect(dotsCount).toBe(2)
  })

  it('clamps current page to valid range', () => {
    const result = generatePageNumbers(100, 5)
    const pages = result.filter((i) => i.type === 'page').map((i) => (i as any).number)
    expect(pages).toContain(5)
  })

  it('clamps negative current page to 1', () => {
    const result = generatePageNumbers(-1, 10)
    expect(result[0]).toEqual({ type: 'page', number: 1 })
  })

  it('page 5 on 20 pages shows correct range', () => {
    const result = generatePageNumbers(5, 20)
    const pages = result.filter((i) => i.type === 'page').map((i) => (i as any).number)
    expect(pages).toContain(1)
    expect(pages).toContain(5)
    expect(pages).toContain(20)
  })

  it('page 18 on 20 pages shows dots before', () => {
    const result = generatePageNumbers(18, 20)
    const pages = result.filter((i) => i.type === 'page').map((i) => (i as any).number)
    expect(pages).toContain(1)
    expect(pages).toContain(2)
    expect(pages).toContain(18)
    expect(pages).toContain(19)
    expect(pages).toContain(20)
  })

  it('accepts custom range parameter', () => {
    const result = generatePageNumbers(10, 20, 1)
    const pages = result.filter((i) => i.type === 'page').map((i) => (i as any).number)
    expect(pages).toContain(10)
  })
})
