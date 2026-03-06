import { describe, it, expect } from 'vitest'
import {
  isAxiosError,
  isAxiosUnprocessableEntityError,
  isAxiosExpiredTokenError,
  formatCurrency,
  formatNumberToSocialStyle,
  generateNameId,
  getIdFromNameId,
  getAvatarUrl,
  formatTimeAgo,
  formatDate,
  formatDateTime,
  isWithinDays,
  escapeHtml,
  truncateText,
  normalizeSearchQuery
} from '../utils'
import { AxiosError, AxiosResponse } from 'axios'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'

describe('isAxiosError', () => {
  it('isAxiosError trả về boolean', () => {
    expect(isAxiosError(new Error())).toBe(false)
    expect(isAxiosError(new AxiosError())).toBe(true)
  })
})

describe('isAxiosUnprocessableEntityError', () => {
  it('isAxiosUnprocessableEntityError trả về boolean', () => {
    expect(isAxiosUnprocessableEntityError(new Error())).toBe(false)
    expect(
      isAxiosUnprocessableEntityError(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: HTTP_STATUS_CODE.InternalServerError,
          data: null
        } as AxiosResponse)
      )
    ).toBe(false)
    expect(
      isAxiosUnprocessableEntityError(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: HTTP_STATUS_CODE.UnprocessableEntity,
          data: null
        } as AxiosResponse)
      )
    ).toBe(true)
  })
})

describe('isAxiosExpiredTokenError', () => {
  it('returns false for non-axios errors', () => {
    expect(isAxiosExpiredTokenError(new Error())).toBe(false)
  })

  it('returns false for non-401 errors', () => {
    expect(
      isAxiosExpiredTokenError(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: HTTP_STATUS_CODE.InternalServerError,
          data: { data: { name: 'EXPIRED_TOKEN', message: 'Token expired' } }
        } as AxiosResponse)
      )
    ).toBe(false)
  })

  it('returns false for 401 without EXPIRED_TOKEN name', () => {
    expect(
      isAxiosExpiredTokenError(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: HTTP_STATUS_CODE.Unauthorized,
          data: { data: { name: 'INVALID_TOKEN', message: 'Invalid' } }
        } as AxiosResponse)
      )
    ).toBe(false)
  })

  it('returns true for 401 with EXPIRED_TOKEN name', () => {
    expect(
      isAxiosExpiredTokenError(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: HTTP_STATUS_CODE.Unauthorized,
          data: { data: { name: 'EXPIRED_TOKEN', message: 'Token expired' } }
        } as AxiosResponse)
      )
    ).toBe(true)
  })
})

describe('formatCurrency', () => {
  it('formats 0', () => {
    expect(formatCurrency(0)).toBe('0')
  })

  it('formats thousands', () => {
    expect(formatCurrency(1000)).toBe('1.000')
  })

  it('formats millions', () => {
    expect(formatCurrency(1000000)).toBe('1.000.000')
  })

  it('formats negative numbers', () => {
    expect(formatCurrency(-5000)).toBe('-5.000')
  })
})

describe('formatNumberToSocialStyle', () => {
  it('formats numbers below 1000 as-is', () => {
    expect(formatNumberToSocialStyle(500)).toBe('500')
  })

  it('formats thousands with k suffix', () => {
    const result = formatNumberToSocialStyle(1500)
    expect(result).toBe('1,5k')
  })

  it('formats millions with m suffix', () => {
    const result = formatNumberToSocialStyle(1000000)
    expect(result).toBe('1m')
  })
})

describe('generateNameId', () => {
  it('creates URL-safe slug from name and id', () => {
    const result = generateNameId({ name: 'Điện thoại iPhone 12', id: '123' })
    expect(result).toContain('-i-123')
    expect(result).not.toContain(' ')
  })

  it('handles names with special characters', () => {
    const result = generateNameId({ name: 'Áo thun (cotton) 100%', id: '456' })
    expect(result).toContain('-i-456')
  })
})

describe('getIdFromNameId', () => {
  it('extracts ID from slug', () => {
    expect(getIdFromNameId('dien-thoai-iphone-12-i-123')).toBe('123')
  })

  it('handles IDs with hyphens', () => {
    expect(getIdFromNameId('product-name-i-abc-def')).toBe('abc-def')
  })
})

describe('getAvatarUrl', () => {
  it('returns default image when no avatar', () => {
    const result = getAvatarUrl()
    expect(result).toBeTruthy()
  })

  it('returns full URL as-is', () => {
    const url = 'https://example.com/avatar.jpg'
    expect(getAvatarUrl(url)).toBe(url)
  })

  it('returns http URL as-is', () => {
    const url = 'http://example.com/avatar.jpg'
    expect(getAvatarUrl(url)).toBe(url)
  })

  it('prefixes relative path with baseUrl', () => {
    const result = getAvatarUrl('avatar.jpg')
    expect(result).toContain('images/avatar.jpg')
  })
})

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).not.toContain('<script>')
  })

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('truncateText', () => {
  it('returns short text unchanged', () => {
    expect(truncateText('hello', 10)).toBe('hello')
  })

  it('truncates long text with ellipsis', () => {
    const result = truncateText('this is a very long text', 10)
    expect(result.length).toBeLessThanOrEqual(13) // 10 + '...'
    expect(result).toContain('...')
  })
})

describe('normalizeSearchQuery', () => {
  it('lowercases and trims input', () => {
    const result = normalizeSearchQuery('  Hello World  ')
    expect(result).toBe('hello world')
  })

  it('trims whitespace', () => {
    expect(normalizeSearchQuery('  hello  ')).toBe('hello')
  })
})

describe('formatTimeAgo', () => {
  it('returns relative time for valid date', () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const result = formatTimeAgo(recentDate)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns empty string for invalid date', () => {
    expect(formatTimeAgo('invalid-date')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats valid date', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z')
    expect(result).toBeTruthy()
    expect(result).toContain('15')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('formats valid datetime', () => {
    const result = formatDateTime('2024-01-15T10:30:00.000Z')
    expect(result).toBeTruthy()
  })

  it('returns empty string for invalid date', () => {
    expect(formatDateTime('invalid')).toBe('')
  })
})

describe('isWithinDays', () => {
  it('returns true for recent date', () => {
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(isWithinDays(recentDate, 7)).toBe(true)
  })

  it('returns false for old date', () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(isWithinDays(oldDate, 7)).toBe(false)
  })

  it('returns false for invalid date', () => {
    expect(isWithinDays('invalid', 7)).toBe(false)
  })
})
