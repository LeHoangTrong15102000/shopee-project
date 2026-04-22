import { setupServer } from 'msw/node'
import { handlers } from '../__mocks__/msw/handlers'
import { getProducts, getCategories } from '../apis/product.api'
import { http, HttpResponse } from 'msw'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('getProducts', () => {
  it('fetches first page of products', async () => {
    const result = await getProducts({ page: 1, limit: 10 })
    expect(result.products).toHaveLength(10)
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.limit).toBe(10)
  })

  it('fetches products with category filter', async () => {
    const result = await getProducts({ page: 1, limit: 10, category: 'cat-1' })
    expect(result.products.length).toBeGreaterThan(0)
    result.products.forEach((p) => {
      expect(p.category._id).toBe('cat-1')
    })
  })

  it('throws on API error', async () => {
    server.use(
      http.get('https://api-ecom.duthanhduoc.com/products', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    await expect(getProducts({ page: 1, limit: 10 })).rejects.toThrow('HTTP 500')
  })
})

describe('getCategories', () => {
  it('fetches categories', async () => {
    const result = await getCategories()
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('_id')
    expect(result[0]).toHaveProperty('name')
  })
})
