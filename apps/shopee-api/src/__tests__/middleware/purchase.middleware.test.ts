/// <reference types="jest" />

describe('Purchase Middleware', () => {
  it('should be importable (validation migrated to Zod schemas)', () => {
    const mod = require('../../middleware/purchase.middleware')
    expect(mod).toEqual({})
  })
})
