import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  getProductDetail,
  getProductReviews,
  toggleReviewLike,
  getQuestions,
  askQuestion,
  answerQuestion,
  likeQuestion,
  addToCart,
  buyNow,
  getRelatedProducts,
} from '../apis/product-detail.api'
import { createReview } from '../apis/review.api'
import { checkWishlist, addToWishlist, removeFromWishlist } from '../apis/wishlist.api'

const API_BASE = 'https://api-ecom.lehoangtrong.com'

const mockProduct = {
  _id: 'p1',
  name: 'Test Product',
  image: 'img.jpg',
  images: ['img1.jpg', 'img2.jpg'],
  description: 'A test product',
  category: { _id: 'cat-1', name: 'Category' },
  price: 100000,
  rating: 4.5,
  price_before_discount: 150000,
  quantity: 50,
  sold: 200,
  view: 1000,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockReview = {
  _id: 'r1',
  user: { _id: 'u1', name: 'User', email: 'u@e.com' },
  product: { _id: 'p1', name: 'Test', image: 'img.jpg' },
  purchase: 'pur1',
  rating: 5,
  comment: 'Great product',
  images: [],
  helpful_count: 3,
  is_liked: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockQuestion = {
  _id: 'q1',
  product_id: 'p1',
  user_id: 'u1',
  user_name: 'User',
  question: 'Is this good?',
  answers: [],
  likes_count: 0,
  is_liked: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const server = setupServer(
  http.get(`${API_BASE}/products/:id`, () =>
    HttpResponse.json({ message: 'OK', data: mockProduct })
  ),
  http.get(`${API_BASE}/reviews/product/:id`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        reviews: [mockReview],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
        stats: { total_reviews: 1, average_rating: 5, rating_breakdown: { 5: 1 } },
      },
    })
  ),
  http.post(`${API_BASE}/reviews`, () => HttpResponse.json({ message: 'OK', data: mockReview })),
  http.post(`${API_BASE}/reviews/like/:id`, () =>
    HttpResponse.json({ message: 'OK', data: { is_liked: true, helpful_count: 4 } })
  ),
  http.get(`${API_BASE}/qa/questions`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        questions: [mockQuestion],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      },
    })
  ),
  http.post(`${API_BASE}/qa/questions`, () =>
    HttpResponse.json({ message: 'OK', data: mockQuestion })
  ),
  http.post(`${API_BASE}/qa/questions/:id/answers`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        _id: 'a1',
        user_id: 'u1',
        user_name: 'User',
        is_seller: false,
        answer: 'Yes',
        likes_count: 0,
        is_liked: false,
        created_at: '2024-01-01',
      },
    })
  ),
  http.post(`${API_BASE}/qa/questions/:id/like`, () =>
    HttpResponse.json({ message: 'OK', data: { is_liked: true, likes_count: 1 } })
  ),
  http.get(`${API_BASE}/wishlist/check/:id`, () =>
    HttpResponse.json({ message: 'OK', data: { in_wishlist: false } })
  ),
  http.post(`${API_BASE}/wishlist`, () => HttpResponse.json({ message: 'OK', data: {} })),
  http.delete(`${API_BASE}/wishlist/:id`, () => HttpResponse.json({ message: 'OK', data: {} })),
  http.post(`${API_BASE}/purchases/add-to-cart`, () =>
    HttpResponse.json({ message: 'OK', data: {} })
  ),
  http.post(`${API_BASE}/purchases/buy-products`, () =>
    HttpResponse.json({ message: 'OK', data: {} })
  ),
  http.get(`${API_BASE}/products`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        products: [mockProduct],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      },
    })
  )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Product Detail API', () => {
  it('getProductDetail fetches product by id', async () => {
    const result = await getProductDetail('p1')
    expect(result.data._id).toBe('p1')
    expect(result.data.name).toBe('Test Product')
  })

  it('getProductReviews fetches reviews with pagination', async () => {
    const result = await getProductReviews('p1', 1)
    expect(result.data.reviews).toHaveLength(1)
    expect(result.data.stats.average_rating).toBe(5)
  })

  it('createReview posts a new review', async () => {
    const result = await createReview({
      purchaseId: 'pur1',
      rating: 5,
      comment: 'Great product!',
    })
    expect(result.data._id).toBe('r1')
  })

  it('toggleReviewLike toggles like on a review', async () => {
    const result = await toggleReviewLike('r1')
    expect(result.data.is_liked).toBe(true)
  })

  it('getQuestions fetches questions', async () => {
    const result = await getQuestions('p1', 1)
    expect(result.data.questions).toHaveLength(1)
  })

  it('askQuestion posts a new question', async () => {
    const result = await askQuestion({ product_id: 'p1', question: 'Is this good?' })
    expect(result.data._id).toBe('q1')
  })

  it('answerQuestion posts an answer', async () => {
    const result = await answerQuestion('q1', { answer: 'Yes' })
    expect(result.data.answer).toBe('Yes')
  })

  it('likeQuestion toggles like on a question', async () => {
    const result = await likeQuestion('q1')
    expect(result.data.is_liked).toBe(true)
  })

  it('checkWishlist checks wishlist status', async () => {
    const result = await checkWishlist('p1')
    expect(result.data.in_wishlist).toBe(false)
  })

  it('addToWishlist adds product to wishlist', async () => {
    const result = await addToWishlist('p1')
    expect(result.message).toBe('OK')
  })

  it('removeFromWishlist removes product from wishlist', async () => {
    const result = await removeFromWishlist('p1')
    expect(result.message).toBe('OK')
  })

  it('addToCart adds product to cart', async () => {
    const result = await addToCart({ product_id: 'p1', buy_count: 2 })
    expect(result.message).toBe('OK')
  })

  it('buyNow wraps body in array', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${API_BASE}/purchases/buy-products`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ message: 'OK', data: {} })
      })
    )
    await buyNow({ product_id: 'p1', buy_count: 1 })
    expect(Array.isArray(capturedBody)).toBe(true)
    expect((capturedBody as Array<{ product_id: string }>)[0].product_id).toBe('p1')
  })

  it('getRelatedProducts fetches related products', async () => {
    const result = await getRelatedProducts('cat-1', 'p1')
    expect(result.data.products).toHaveLength(1)
  })

  it('handles API errors', async () => {
    server.use(http.get(`${API_BASE}/products/:id`, () => new HttpResponse(null, { status: 500 })))
    await expect(getProductDetail('p1')).rejects.toThrow()
  })
})
