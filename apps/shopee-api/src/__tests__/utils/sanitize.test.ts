/**
 * Unit Tests cho Sanitize Utilities
 * Test các chức năng sanitize input để chống NoSQL injection
 */

/// <reference types="jest" />
import { sanitizeString, sanitizeObject, sanitizeMongoQuery } from '@utils/sanitize'

describe('Sanitize Utilities', () => {
  describe('sanitizeString', () => {
    // Test: Escape ký tự $ trong string
    it('should escape $ character', () => {
      const input = '$gt'
      const result = sanitizeString(input)
      expect(result).toBe('&#36;gt')
    })

    // Test: Escape ký tự { và } trong string
    it('should escape { and } characters', () => {
      const input = '{$ne: null}'
      const result = sanitizeString(input)
      expect(result).toBe('&#123;&#36;ne: null&#125;')
    })

    // Test: Giữ nguyên string bình thường
    it('should keep normal string unchanged', () => {
      const input = 'Hello World'
      const result = sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    // Test: Xử lý string rỗng
    it('should handle empty string', () => {
      const input = ''
      const result = sanitizeString(input)
      expect(result).toBe('')
    })

    // Test: Trả về giá trị gốc nếu không phải string
    it('should return original value if not string', () => {
      const input = 123 as any
      const result = sanitizeString(input)
      expect(result).toBe(123)
    })

    // Test: Escape nhiều ký tự $ trong cùng string
    it('should escape multiple $ characters', () => {
      const input = '$or: [$gt, $lt]'
      const result = sanitizeString(input)
      expect(result).toBe('&#36;or: [&#36;gt, &#36;lt]')
    })
  })

  describe('sanitizeObject', () => {
    // Test: Loại bỏ key bắt đầu bằng $
    it('should remove keys starting with $', () => {
      const input = {
        name: 'test',
        $gt: 100,
        $ne: null,
      }
      const result = sanitizeObject(input) as Record<string, unknown>
      expect(result).toEqual({ name: 'test' })
      expect(result.$gt).toBeUndefined()
      expect(result.$ne).toBeUndefined()
    })

    // Test: Loại bỏ key chứa dấu .
    it('should remove keys containing dot', () => {
      const input = {
        name: 'test',
        'user.password': 'secret',
      }
      const result = sanitizeObject(input) as Record<string, unknown>
      expect(result).toEqual({ name: 'test' })
      expect(result['user.password']).toBeUndefined()
    })

    // Test: Sanitize nested objects
    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: 'test',
          $where: 'malicious code',
        },
      }
      const result = sanitizeObject(input) as Record<string, Record<string, unknown>>
      expect(result.user).toEqual({ name: 'test' })
      expect(result.user.$where).toBeUndefined()
    })

    // Test: Sanitize arrays
    it('should sanitize arrays', () => {
      const input = {
        items: [
          { name: 'item1', $gt: 100 },
          { name: 'item2', $lt: 50 },
        ],
      }
      const result = sanitizeObject(input) as Record<string, unknown[]>
      expect(result.items).toEqual([{ name: 'item1' }, { name: 'item2' }])
    })

    // Test: Xử lý null và undefined
    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull()
      expect(sanitizeObject(undefined)).toBeUndefined()
    })

    // Test: Giữ nguyên primitive values
    it('should keep primitive values unchanged', () => {
      expect(sanitizeObject(123)).toBe(123)
      expect(sanitizeObject(true)).toBe(true)
    })

    // Test: Sanitize string values trong object
    it('should sanitize string values in object', () => {
      const input = {
        query: '$where: function() { return true; }',
      }
      const result = sanitizeObject(input) as Record<string, unknown>
      expect(result.query).toBe('&#36;where: function() &#123; return true; &#125;')
    })
  })

  describe('sanitizeMongoQuery', () => {
    // Test: Loại bỏ MongoDB operators nguy hiểm
    it('should remove dangerous MongoDB operators', () => {
      const input = {
        name: 'test',
        $where: 'this.password.length > 0',
        $expr: { $eq: ['$password', 'admin'] },
      }
      const result = sanitizeMongoQuery(input) as Record<string, unknown>
      expect(result).toEqual({ name: 'test' })
      expect(result.$where).toBeUndefined()
      expect(result.$expr).toBeUndefined()
    })

    // Test: Loại bỏ $gt, $lt, $ne operators
    it('should remove comparison operators', () => {
      const input = {
        price: {
          $gt: 100,
          $lt: 500,
        },
        $ne: null,
      }
      const result = sanitizeMongoQuery(input) as Record<string, unknown>
      expect(result.$ne).toBeUndefined()
    })

    // Test: Sanitize string chứa pattern injection
    it('should sanitize string with injection pattern', () => {
      const input = '{"$gt": ""}'
      const result = sanitizeMongoQuery(input)
      expect(result).toBe('&#123;"&#36;gt": ""&#125;')
    })

    // Test: Xử lý arrays trong query
    it('should handle arrays in query', () => {
      const input = {
        $or: [{ name: 'test1' }, { name: 'test2' }],
      }
      const result = sanitizeMongoQuery(input) as Record<string, unknown>
      expect(result.$or).toBeUndefined()
    })

    // Test: Giữ nguyên query an toàn
    it('should keep safe query unchanged', () => {
      const input = {
        name: 'test',
        price: 100,
        category: 'electronics',
      }
      const result = sanitizeMongoQuery(input)
      expect(result).toEqual(input)
    })

    // Test: Xử lý null và undefined
    it('should handle null and undefined', () => {
      expect(sanitizeMongoQuery(null)).toBeNull()
      expect(sanitizeMongoQuery(undefined)).toBeUndefined()
    })

    // Test: Giữ nguyên string bình thường
    it('should keep normal string unchanged', () => {
      const input = 'normal search query'
      const result = sanitizeMongoQuery(input)
      expect(result).toBe('normal search query')
    })
  })
})
