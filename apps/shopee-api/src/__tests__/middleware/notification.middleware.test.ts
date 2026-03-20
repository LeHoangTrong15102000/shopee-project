/// <reference types="jest" />

describe('Notification Middleware', () => {
  it('should be importable (validation migrated to Zod schemas)', () => {
    const mod = require('../../middleware/notification.middleware')
    expect(mod).toEqual({})
  })
})
