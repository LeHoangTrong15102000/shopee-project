import { http, HttpResponse } from 'msw'
import { mockCategories } from './data/products.mock'
import { API_URL } from './msw-utils'

const categoriesHandlers = [
  http.get(`${API_URL}/admin/categories`, () => {
    return HttpResponse.json({
      message: 'Lấy danh sách danh mục thành công',
      data: mockCategories,
    })
  }),

  http.get(`${API_URL}/admin/categories/:id`, ({ params }) => {
    const category = mockCategories.find((c) => c._id === params.id)
    if (!category) {
      return HttpResponse.json({ message: 'Không tìm thấy danh mục' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: category })
  }),

  http.post(`${API_URL}/admin/categories`, async ({ request }) => {
    const body = (await request.json()) as { name: string }
    const newCategory = { _id: `cat-new-${Date.now()}`, name: body.name }
    return HttpResponse.json(
      { message: 'Tạo danh mục thành công', data: newCategory },
      { status: 201 },
    )
  }),

  http.put(`${API_URL}/admin/categories/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name: string }
    return HttpResponse.json({
      message: 'Cập nhật danh mục thành công',
      data: { _id: params.id, name: body.name },
    })
  }),

  http.delete(`${API_URL}/admin/categories/delete/:id`, () => {
    return HttpResponse.json({ message: 'Xóa danh mục thành công', data: null })
  }),
]

export default categoriesHandlers
