/// <reference types="jest" />
import categoryMiddleware from '../../middleware/category.middleware'

describe('Category Middleware', () => {
  it('should export an empty middleware object', () => {
    expect(categoryMiddleware).toEqual({})
  })
})
