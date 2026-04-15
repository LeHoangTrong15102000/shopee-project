import { http, HttpResponse } from 'msw'
import { mockReviews } from './data/reviews.mock'
import { API_URL } from './msw-utils'

const reviewsHandlers = [
  http.get(`${API_URL}/admin/reviews`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    const rating = url.searchParams.get('rating')
    let filtered = mockReviews
    if (rating) {
      filtered = filtered.filter((r) => r.rating === Number(rating))
    }
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        reviews: paginated,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      },
    })
  }),

  http.get(`${API_URL}/admin/reviews/stats`, () => {
    return HttpResponse.json({
      message: 'Thành công',
      data: {
        total: mockReviews.length,
        average_rating: mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length,
        rating_distribution: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 },
      },
    })
  }),

  http.get(`${API_URL}/admin/reviews/:id`, ({ params }) => {
    const review = mockReviews.find((r) => r._id === params.id)
    if (!review) {
      return HttpResponse.json({ message: 'Không tìm thấy đánh giá' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Thành công', data: { ...review, comments: [] } })
  }),

  http.delete(`${API_URL}/admin/reviews/:id`, () => {
    return HttpResponse.json({ message: 'Xóa đánh giá thành công', data: null })
  }),

  http.delete(`${API_URL}/admin/reviews/comments/:id`, () => {
    return HttpResponse.json({ message: 'Xóa bình luận thành công', data: null })
  }),
]

export default reviewsHandlers
