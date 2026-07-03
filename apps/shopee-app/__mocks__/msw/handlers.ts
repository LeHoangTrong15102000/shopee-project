import { http, HttpResponse } from 'msw'

const API_BASE = 'https://api-ecom.lehoangtrong.com'

const mockCategories = [
  { _id: 'cat-1', name: 'Áo thun' },
  { _id: 'cat-2', name: 'Đồng hồ' },
  { _id: 'cat-3', name: 'Điện thoại' },
]

function createMockProduct(id: number) {
  return {
    _id: `product-${id}`,
    images: [`https://example.com/img-${id}.jpg`],
    price: 100000 + id * 10000,
    rating: 3.5 + (id % 5) * 0.3,
    price_before_discount: 150000 + id * 10000,
    quantity: 100,
    sold: 500 + id * 50,
    view: 1000 + id * 100,
    name: `Test Product ${id} - Sản phẩm thử nghiệm`,
    category: mockCategories[id % 3],
    image: `https://example.com/img-${id}.jpg`,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

const allProducts = Array.from({ length: 48 }, (_, i) => createMockProduct(i + 1))

export const handlers = [
  http.get(`${API_BASE}/products`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const limit = Number(url.searchParams.get('limit') || '10')
    const category = url.searchParams.get('category')

    let filtered = allProducts
    if (category) {
      filtered = allProducts.filter((p) => p.category._id === category)
    }

    const start = (page - 1) * limit
    const products = filtered.slice(start, start + limit)
    const pageSize = Math.ceil(filtered.length / limit)

    return HttpResponse.json({
      message: 'Lấy các sản phẩm thành công',
      data: {
        products,
        pagination: { page, limit, total: filtered.length, total_pages: pageSize },
      },
    })
  }),

  http.get(`${API_BASE}/categories`, () => {
    return HttpResponse.json({
      message: 'Lấy categories thành công',
      data: mockCategories,
    })
  }),
]

export { mockCategories, allProducts }
