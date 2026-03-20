/// <reference types="jest" />

describe('User Middleware', () => {
  it('should be importable (validation migrated to Zod schemas)', () => {
    const mod = require('../../middleware/user.middleware')
    expect(mod).toEqual({})
  })
})
