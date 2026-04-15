/**
 * MSW request handlers for all shopee-admin API endpoints
 * Intercepts network requests and returns mock data in dev mode
 */
import { http, HttpResponse, delay } from 'msw'
import {
  categories,
  users,
  products,
  orders,
  reviews,
  reviewCommentsData,
  vouchers,
  notifications,
  loyaltyRewards,
  loyaltyTransactions,
  qaQuestions,
  dashboardOverview,
  revenueData,
  orderTrendData,
  userGrowthData,
  topProducts,
  topBuyers,
  revenueByCategoryData,
  productAnalytics,
  chatbotAnalytics,
  importStats,
} from './data'

const BASE = 'https://api-ecom.duthanhduoc.com'

// Wrap data in SuccessResponse shape
const ok = <T>(data: T) => HttpResponse.json({ message: 'Success', data })

// Paginate helper
function paginate<T>(items: T[], page = 1, limit = 10) {
  const start = (page - 1) * limit
  const sliced = items.slice(start, start + limit)
  return {
    items: sliced,
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
    page_size: sliced.length,
  }
}

// ─── Auth ──────────────────────────────────────────────────
const MOCK_CREDENTIALS = { email: 'admin@shopee.com', password: 'admin123' }
const MOCK_ADMIN_USER = {
  _id: 'admin-001',
  email: 'admin@shopee.com',
  name: 'Admin Shopee',
  roles: ['Admin'] as string[],
  avatar: '',
  phone: '0900000000',
  address: '',
  date_of_birth: '1990-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const authHandlers = [
  http.post(`${BASE}/login`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { email: string; password: string }
    if (body.email !== MOCK_CREDENTIALS.email || body.password !== MOCK_CREDENTIALS.password) {
      return HttpResponse.json({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 })
    }
    return ok({
      access_token: 'mock-access-token-xyz',
      refresh_token: 'mock-refresh-token-xyz',
      user: MOCK_ADMIN_USER,
    })
  }),
  http.post(`${BASE}/logout`, () => ok(null)),
  http.post(`${BASE}/refresh-access-token`, () => ok({ access_token: 'mock-refreshed-token-xyz' })),
]

// ─── Settings (me) ─────────────────────────────────────────
const settingsHandlers = [
  http.get(`${BASE}/me`, () => ok(users[0])),
  http.put(`${BASE}/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({ ...users[0], ...body })
  }),
]

// ─── Dashboard ─────────────────────────────────────────────
const dashboardHandlers = [
  http.get(`${BASE}/admin/dashboard/overview`, () => ok(dashboardOverview)),
  http.get(`${BASE}/admin/dashboard/revenue`, () => ok(revenueData)),
  http.get(`${BASE}/admin/dashboard/revenue/by-category`, () => ok(revenueByCategoryData)),
  http.get(`${BASE}/admin/dashboard/revenue/by-product`, () => ok(topProducts)),
  http.get(`${BASE}/admin/dashboard/orders/trend`, () => ok(orderTrendData)),
  http.get(`${BASE}/admin/dashboard/users/growth`, () => ok(userGrowthData)),
  http.get(`${BASE}/admin/dashboard/users/top-buyers`, () => ok(topBuyers)),
]

// ─── Categories ────────────────────────────────────────────
const categoryHandlers = [
  http.get(`${BASE}/admin/categories`, () => ok(categories)),
  http.get(`${BASE}/admin/categories/:id`, ({ params }) => {
    const cat = categories.find((c) => c._id === params.id)
    return cat ? ok(cat) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),
  http.post(`${BASE}/admin/categories`, async ({ request }) => {
    const body = (await request.json()) as { name: string }
    return ok({ _id: `cat-${Date.now()}`, name: body.name })
  }),
  http.put(`${BASE}/admin/categories/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name: string }
    return ok({ _id: params.id, name: body.name })
  }),
  http.delete(`${BASE}/admin/categories/delete/:id`, () => ok(null)),
]

// ─── Products ──────────────────────────────────────────────
const productHandlers = [
  http.get(`${BASE}/admin/products`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const name = url.searchParams.get('name') ?? ''
    const category = url.searchParams.get('category') ?? ''
    let filtered = products
    if (name) filtered = filtered.filter((p) => p.name.toLowerCase().includes(name.toLowerCase()))
    if (category)
      filtered = filtered.filter(
        (p) => typeof p.category === 'object' && p.category._id === category,
      )
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ products: items, pagination })
  }),
  http.get(`${BASE}/admin/products/all`, () => ok(products)),
  http.get(`${BASE}/admin/products/:id`, ({ params }) => {
    const prod = products.find((p) => p._id === params.id)
    return prod ? ok(prod) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),
  http.post(`${BASE}/admin/products`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `prod-${Date.now()}`,
      ...body,
      sold: 0,
      view: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.put(`${BASE}/admin/products/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const prod = products.find((p) => p._id === params.id)
    return ok({ ...prod, ...body, updatedAt: new Date().toISOString() })
  }),
  http.delete(`${BASE}/admin/products/delete/:id`, () => ok(null)),
  http.delete(`${BASE}/admin/products/delete-many`, () => ok({ deletedCount: 1 })),
  http.post(`${BASE}/admin/products/upload-image`, () =>
    ok('https://placehold.co/400x400/f5f5f5/333?text=Uploaded'),
  ),
  http.post(`${BASE}/admin/products/upload-images`, () =>
    ok([
      'https://placehold.co/400x400/f5f5f5/333?text=Uploaded1',
      'https://placehold.co/400x400/f5f5f5/333?text=Uploaded2',
    ]),
  ),
]

// ─── Orders ────────────────────────────────────────────────
const orderHandlers = [
  http.get(`${BASE}/admin/orders`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const status = url.searchParams.get('status')
    let filtered = orders
    if (status) filtered = filtered.filter((o) => o.status === status)
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ orders: items, pagination })
  }),
  http.get(`${BASE}/admin/orders/count-by-status`, () =>
    ok([
      { _id: 'pending', count: orders.filter((o) => o.status === 'pending').length },
      { _id: 'processing', count: orders.filter((o) => o.status === 'processing').length },
      { _id: 'shipped', count: orders.filter((o) => o.status === 'shipped').length },
      { _id: 'delivered', count: orders.filter((o) => o.status === 'delivered').length },
      { _id: 'cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
    ]),
  ),
  http.get(`${BASE}/admin/orders/:id`, ({ params }) => {
    const order = orders.find((o) => o._id === params.id)
    return order ? ok(order) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),
  http.put(`${BASE}/admin/orders/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { status: string }
    const order = orders.find((o) => o._id === params.id)
    return ok({ ...order, status: body.status, updatedAt: new Date().toISOString() })
  }),
  http.put(`${BASE}/admin/orders/bulk-status`, () => ok({ modifiedCount: 3 })),
]

// ─── Users ─────────────────────────────────────────────────
const userHandlers = [
  http.get(`${BASE}/admin/users`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const search = url.searchParams.get('search') ?? ''
    let filtered = users
    if (search)
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ items, pagination })
  }),
  http.get(`${BASE}/admin/users/:id`, ({ params }) => {
    const user = users.find((u) => u._id === params.id)
    return user ? ok(user) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),
  http.post(`${BASE}/admin/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `user-${Date.now()}`,
      ...body,
      roles: body.roles ?? ['User'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.put(`${BASE}/admin/users/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const user = users.find((u) => u._id === params.id)
    return ok({ ...user, ...body, updatedAt: new Date().toISOString() })
  }),
  http.delete(`${BASE}/admin/users/delete/:id`, () => ok(null)),
]

// ─── Notifications ─────────────────────────────────────────
const notificationHandlers = [
  http.get(`${BASE}/admin/notifications`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const type = url.searchParams.get('type')
    let filtered = notifications
    if (type) filtered = filtered.filter((n) => n.type === type)
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ notifications: items, pagination })
  }),
  http.post(`${BASE}/admin/notifications`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `noti-${Date.now()}`,
      ...body,
      type: 'targeted',
      is_read: false,
      createdAt: new Date().toISOString(),
    })
  }),
  http.post(`${BASE}/admin/notifications/broadcast`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `noti-${Date.now()}`,
      ...body,
      type: 'broadcast',
      is_read: false,
      createdAt: new Date().toISOString(),
    })
  }),
  http.delete(`${BASE}/admin/notifications/:id`, () => ok(null)),
  http.put(`${BASE}/admin/notifications/:id/read`, ({ params }) => {
    const noti = notifications.find((n) => n._id === params.id)
    return ok({ ...noti, is_read: true })
  }),
]

// ─── Reviews ───────────────────────────────────────────────
const reviewHandlers = [
  http.get(`${BASE}/admin/reviews`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const rating = url.searchParams.get('rating')
    let filtered = reviews
    if (rating) filtered = filtered.filter((r) => r.rating === Number(rating))
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ reviews: items, pagination })
  }),
  http.get(`${BASE}/admin/reviews/stats`, () =>
    ok({
      total: reviews.length,
      average_rating: +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
      rating_distribution: { '1': 4, '2': 4, '3': 4, '4': 4, '5': 4 },
    }),
  ),
  http.get(`${BASE}/admin/reviews/:id`, ({ params }) => {
    const review = reviews.find((r) => r._id === params.id)
    if (!review) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const comments = reviewCommentsData.filter((c) => c.review === review._id)
    return ok({ ...review, comments })
  }),
  http.delete(`${BASE}/admin/reviews/:id`, () => ok(null)),
  http.delete(`${BASE}/admin/reviews/comments/:id`, () => ok(null)),
]

// ─── Vouchers ──────────────────────────────────────────────
const voucherHandlers = [
  http.get(`${BASE}/admin/vouchers`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const isActive = url.searchParams.get('is_active')
    let filtered = vouchers
    if (isActive !== null && isActive !== '')
      filtered = filtered.filter((v) => v.is_active === (isActive === 'true'))
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ vouchers: items, pagination })
  }),
  http.get(`${BASE}/admin/vouchers/stats`, () =>
    ok({
      total: vouchers.length,
      active: vouchers.filter((v) => v.is_active).length,
      inactive: vouchers.filter((v) => !v.is_active).length,
      total_usage: vouchers.reduce((s, v) => s + v.used_count, 0),
    }),
  ),
  http.get(`${BASE}/admin/vouchers/:id/usage`, ({ params }) => {
    const usage = Array.from({ length: 5 }, (_, i) => ({
      _id: `vu-${params.id}-${i}`,
      user: users[i % users.length],
      voucher: params.id as string,
      order: orders[i % orders.length]._id,
      discount_amount: vouchers[0].discount_value,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    }))
    return ok({ usage, pagination: { page: 1, limit: 10, total: 5 } })
  }),
  http.get(`${BASE}/admin/vouchers/:id`, ({ params }) => {
    const v = vouchers.find((vc) => vc._id === params.id)
    return v ? ok(v) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),
  http.post(`${BASE}/admin/vouchers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `vc-${Date.now()}`,
      ...body,
      used_count: 0,
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.put(`${BASE}/admin/vouchers/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const v = vouchers.find((vc) => vc._id === params.id)
    return ok({ ...v, ...body, updatedAt: new Date().toISOString() })
  }),
  http.delete(`${BASE}/admin/vouchers/:id`, () => ok(null)),
]

// ─── Analytics ─────────────────────────────────────────────
const analyticsHandlers = [
  http.get(`${BASE}/admin/products/analytics/top-selling`, () =>
    ok(productAnalytics.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))),
  ),
  http.get(`${BASE}/admin/products/analytics/top-viewed`, () =>
    ok(productAnalytics.sort((a, b) => (b.view ?? 0) - (a.view ?? 0))),
  ),
  http.get(`${BASE}/admin/products/analytics/top-rated`, () =>
    ok(productAnalytics.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))),
  ),
  http.get(`${BASE}/admin/products/analytics/by-category`, () =>
    ok(
      categories.map((c) => ({
        _id: c._id,
        category_name: c.name,
        product_count: products.filter(
          (p) => typeof p.category === 'object' && p.category._id === c._id,
        ).length,
        total_stock: 500,
        total_sold: 3000,
        average_price: 5000000,
        average_rating: 4.2,
      })),
    ),
  ),
  http.get(`${BASE}/admin/analytics/chatbot-overview`, () => ok(chatbotAnalytics)),
  http.get(`${BASE}/admin/analytics/chatbot-performance`, () =>
    ok({
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
        conversations: 300 + Math.floor(Math.random() * 200),
        satisfaction: 0.85 + Math.random() * 0.1,
      })),
    }),
  ),
]

// ─── Remaining domains ────────────────────────────────────
// ─── Inventory ─────────────────────────────────────────────
const inventoryHandlers = [
  http.get(`${BASE}/admin/inventory/low-stock`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const threshold = Number(url.searchParams.get('threshold') ?? 50)
    const lowStock = products.filter((p) => p.quantity < threshold)
    const { items, ...pagination } = paginate(lowStock, page, limit)
    return ok({ products: items, pagination })
  }),
  http.get(`${BASE}/admin/inventory/out-of-stock`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const outOfStock = products.filter((p) => p.quantity <= 0)
    const { items, ...pagination } = paginate(
      outOfStock.length ? outOfStock : products.slice(0, 2).map((p) => ({ ...p, quantity: 0 })),
      page,
      limit,
    )
    return ok({ products: items, pagination })
  }),
  http.put(`${BASE}/admin/inventory/:id/stock`, async ({ params, request }) => {
    const body = (await request.json()) as { quantity: number }
    const prod = products.find((p) => p._id === params.id)
    return ok({ ...prod, quantity: body.quantity, updatedAt: new Date().toISOString() })
  }),
  http.put(`${BASE}/admin/inventory/bulk-stock`, () => ok({ modifiedCount: 5 })),
]

// ─── Loyalty ───────────────────────────────────────────────
const loyaltyHandlers = [
  http.get(`${BASE}/admin/loyalty/rewards`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const { items, ...pagination } = paginate(loyaltyRewards, page, limit)
    return ok({ rewards: items, pagination })
  }),
  http.post(`${BASE}/admin/loyalty/rewards`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `lr-${Date.now()}`,
      ...body,
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.put(`${BASE}/admin/loyalty/rewards/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const reward = loyaltyRewards.find((r) => r._id === params.id)
    return ok({ ...reward, ...body, updatedAt: new Date().toISOString() })
  }),
  http.delete(`${BASE}/admin/loyalty/rewards/:id`, () => ok(null)),
  http.patch(`${BASE}/admin/loyalty/rewards/:id/toggle`, ({ params }) => {
    const reward = loyaltyRewards.find((r) => r._id === params.id)
    return ok({ ...reward, is_active: !reward?.is_active, updatedAt: new Date().toISOString() })
  }),
  http.post(`${BASE}/admin/loyalty/points/adjust`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      _id: `lt-${Date.now()}`,
      ...body,
      type: 'adjust',
      createdAt: new Date().toISOString(),
    })
  }),
  http.get(`${BASE}/admin/loyalty/transactions`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const { items, ...pagination } = paginate(loyaltyTransactions, page, limit)
    return ok({ transactions: items, pagination })
  }),
  http.get(`${BASE}/admin/loyalty/stats`, () =>
    ok({
      total_users: users.length,
      total_points_earned: 45000,
      total_points_redeemed: 12000,
      total_rewards: loyaltyRewards.length,
      active_rewards: loyaltyRewards.filter((r) => r.is_active).length,
    }),
  ),
]

// ─── QA ────────────────────────────────────────────────────
const qaHandlers = [
  http.get(`${BASE}/admin/qa/questions`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const unanswered = url.searchParams.get('unanswered')
    let filtered = qaQuestions
    if (unanswered === 'true') filtered = filtered.filter((q) => q.answers_count === 0)
    const { items, ...pagination } = paginate(filtered, page, limit)
    return ok({ questions: items, pagination })
  }),
  http.get(`${BASE}/admin/qa/stats`, () =>
    ok({
      total_questions: qaQuestions.length,
      total_answers: qaQuestions.reduce((s, q) => s + q.answers_count, 0),
      unanswered_questions: qaQuestions.filter((q) => q.answers_count === 0).length,
    }),
  ),
  http.delete(`${BASE}/admin/qa/questions/:id`, () => ok(null)),
  http.delete(`${BASE}/admin/qa/questions/:qId/answers/:aId`, () => ok(null)),
]

// ─── Import ────────────────────────────────────────────────
const importHandlers = [
  http.post(`${BASE}/admin/import/products`, async () => {
    await delay(1000)
    return ok({ imported: 15, deleted: 2, locationStats: importStats.locationStats })
  }),
  http.get(`${BASE}/admin/import/products/stats`, () => ok(importStats)),
]

// ─── Export all handlers ───────────────────────────────────
export const handlers = [
  ...authHandlers,
  ...settingsHandlers,
  ...dashboardHandlers,
  ...categoryHandlers,
  ...productHandlers,
  ...orderHandlers,
  ...userHandlers,
  ...notificationHandlers,
  ...reviewHandlers,
  ...voucherHandlers,
  ...analyticsHandlers,
  ...inventoryHandlers,
  ...loyaltyHandlers,
  ...qaHandlers,
  ...importHandlers,
]
