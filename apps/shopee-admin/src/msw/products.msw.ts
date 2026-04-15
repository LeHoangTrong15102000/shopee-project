import { http, HttpResponse } from 'msw'
import { mockProducts } from './data/products.mock'
import { API_URL } from './msw-utils'

const productsHandlers = [
  http.get(`${API_URL}/admin/products`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    const name = url.searchParams.get('name') ?? ''
    let filtered = mockProducts
    if (name) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(name.toLowerCase()))
    }
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)
    return HttpResponse.json({
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products: paginated,
        pagination: { page, limit, page_size: Math.ceil(filtered.length / limit) || 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/products/all`, () => {
    return HttpResponse.json({
      message: 'Lấy tất cả sản phẩm thành công',
      data: mockProducts,
    })
  }),

  http.get(`${API_URL}/admin/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p._id === params.id)
    if (!product) {
      return HttpResponse.json({ message: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: product })
  }),

  http.post(`${API_URL}/admin/products`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newProduct = { ...mockProducts[0], ...body, _id: `prod-new-${Date.now()}` }
    return HttpResponse.json(
      { message: 'Tạo sản phẩm thành công', data: newProduct },
      { status: 201 },
    )
  }),

  http.put(`${API_URL}/admin/products/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const product = mockProducts.find((p) => p._id === params.id)
    if (!product) {
      return HttpResponse.json({ message: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Cập nhật thành công', data: { ...product, ...body } })
  }),

  http.delete(`${API_URL}/admin/products/delete/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p._id === params.id)
    if (!product) {
      return HttpResponse.json({ message: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Xóa sản phẩm thành công', data: null })
  }),

  http.delete(`${API_URL}/admin/products/delete-many`, async ({ request }) => {
    const body = (await request.json()) as { list_id: string[] }
    return HttpResponse.json({
      message: 'Xóa nhiều sản phẩm thành công',
      data: { deletedCount: body.list_id.length },
    })
  }),
]

export default productsHandlers
