/// <reference types="jest" />

import { removeAccents } from '@utils/helper'

describe('helper utils', () => {
  describe('removeAccents', () => {
    it('removes Vietnamese accents', () => {
      expect(removeAccents('Xin chào Việt Nam')).toBe('Xin chao Viet Nam')
    })

    it('converts đ and Đ to d and D', () => {
      expect(removeAccents('Đà Nẵng')).toBe('Da Nang')
    })

    it('leaves normal ASCII string unchanged', () => {
      expect(removeAccents('Hello World')).toBe('Hello World')
    })

    it('handles empty string', () => {
      expect(removeAccents('')).toBe('')
    })
  })
})
