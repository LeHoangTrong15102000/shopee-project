/// <reference types="jest" />

describe('Loyalty Middleware', () => {
  it('should be importable (validation migrated to Zod schemas)', () => {
    const mod = require('../../middleware/loyalty.middleware')
    expect(mod).toEqual({})
  })
})
