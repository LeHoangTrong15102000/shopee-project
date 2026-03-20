/// <reference types="jest" />

describe('Review Middleware', () => {
  it('should be importable (validation migrated to Zod schemas)', () => {
    const mod = require('../../middleware/review.middleware')
    expect(mod).toEqual({})
  })
})
