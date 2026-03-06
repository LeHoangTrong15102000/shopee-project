import { describe, it, expect } from 'vitest'
import {
  isValidImageUrl,
  getImageUrl,
  getOptimizedImageUrl,
  generateSrcSet,
  getAspectRatioPadding,
  createBlurPlaceholder,
  FALLBACK_IMAGES
} from '../imageUtils'

describe('isValidImageUrl', () => {
  it('returns false for null/undefined', () => {
    expect(isValidImageUrl(null)).toBe(false)
    expect(isValidImageUrl(undefined)).toBe(false)
    expect(isValidImageUrl('')).toBe(false)
  })

  it('returns true for valid http URLs', () => {
    expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true)
    expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true)
  })

  it('returns true for relative paths', () => {
    expect(isValidImageUrl('/images/test.jpg')).toBe(true)
  })

  it('returns true for data URLs', () => {
    expect(isValidImageUrl('data:image/png;base64,abc')).toBe(true)
  })

  it('returns true for blob URLs', () => {
    expect(isValidImageUrl('blob:http://localhost/abc')).toBe(true)
  })
})

describe('getImageUrl', () => {
  it('returns URL for valid image', () => {
    expect(getImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg')
  })

  it('returns fallback for invalid URL', () => {
    expect(getImageUrl(null)).toBe(FALLBACK_IMAGES.placeholder)
  })

  it('returns specific fallback type', () => {
    expect(getImageUrl(null, 'product')).toBe(FALLBACK_IMAGES.product)
    expect(getImageUrl(null, 'avatar')).toBe(FALLBACK_IMAGES.avatar)
  })
})

describe('getOptimizedImageUrl', () => {
  it('returns original URL (no CDN yet)', () => {
    expect(getOptimizedImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg')
  })
})

describe('generateSrcSet', () => {
  it('returns empty string (no CDN yet)', () => {
    expect(generateSrcSet('https://example.com/img.jpg')).toBe('')
  })
})

describe('getAspectRatioPadding', () => {
  it('calculates correct padding for 1:1', () => {
    expect(getAspectRatioPadding(100, 100)).toBe('100%')
  })

  it('calculates correct padding for 16:9', () => {
    expect(getAspectRatioPadding(16, 9)).toBe('56.25%')
  })
})

describe('createBlurPlaceholder', () => {
  it('returns a data URI', () => {
    const result = createBlurPlaceholder()
    expect(result).toContain('data:image/svg+xml;base64,')
  })

  it('accepts custom dimensions and color', () => {
    const result = createBlurPlaceholder(20, 20, '#FF0000')
    expect(result).toContain('data:image/svg+xml;base64,')
  })
})
