import type {
  Product,
  User,
  Category,
  Review,
  Order,
  OrderItem,
  Notification,
  Voucher,
  DashboardOverview,
  LoyaltyReward,
  LoyaltyTransaction,
  QAQuestion,
  ImportStats,
  ProductAnalytics,
  ChatbotAnalytics,
} from 'src/types'

let counter = 0
function uid() {
  return `mock-${++counter}-${Math.random().toString(36).slice(2, 8)}`
}

export function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    _id: uid(),
    name: 'Điện thoại',
    ...overrides,
  }
}

export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: uid(),
    name: 'iPhone 15 Pro Max',
    image: 'https://example.com/iphone.jpg',
    images: ['https://example.com/iphone.jpg'],
    description: 'Điện thoại cao cấp',
    category: { _id: 'cat-1', name: 'Điện thoại' },
    price: 29990000,
    rating: 4.5,
    price_before_discount: 34990000,
    quantity: 100,
    sold: 50,
    view: 1000,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({ _id: `product-${i + 1}`, name: `Product ${i + 1}` }),
  )
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    _id: uid(),
    email: 'user@example.com',
    name: 'Nguyễn Văn A',
    roles: ['User'],
    avatar: 'https://example.com/avatar.jpg',
    date_of_birth: '1990-01-01',
    address: 'Hà Nội',
    phone: '0901234567',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockOrder(overrides: Partial<Order> = {}): Order {
  const item: OrderItem = {
    product: createMockProduct(),
    buy_count: 1,
    price: 29990000,
    price_before_discount: 34990000,
  }
  return {
    _id: uid(),
    user: createMockUser(),
    items: [item],
    total_price: 29990000,
    status: 'pending',
    payment_method: 'COD',
    shipping_address: '123 Nguyễn Huệ, Q1, TP.HCM',
    note: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    _id: uid(),
    title: 'Đơn hàng mới',
    message: 'Bạn có đơn hàng mới cần xử lý',
    type: 'broadcast',
    is_read: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockReview(overrides: Partial<Review> = {}): Review {
  return {
    _id: uid(),
    user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
    product: { _id: 'product-1', name: 'iPhone 15', image: 'https://example.com/iphone.jpg' },
    rating: 5,
    comment: 'Sản phẩm rất tốt',
    images: [],
    helpful_count: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockVoucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    _id: uid(),
    code: 'SALE50',
    discount_type: 'percentage',
    discount_value: 50,
    min_order_value: 100000,
    usage_limit: 100,
    used_count: 10,
    is_active: true,
    start_date: '2024-01-01T00:00:00.000Z',
    end_date: '2024-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockDashboardOverview(
  overrides: Partial<DashboardOverview> = {},
): DashboardOverview {
  return {
    total_revenue: 500000000,
    total_orders: 1200,
    total_users: 5000,
    total_products: 300,
    revenue_change: 12.5,
    orders_change: 8.3,
    users_change: 15.2,
    products_change: 3.1,
    ...overrides,
  }
}

export function createMockLoyaltyReward(overrides: Partial<LoyaltyReward> = {}): LoyaltyReward {
  return {
    _id: uid(),
    name: 'Giảm 50k',
    description: 'Giảm 50.000đ cho đơn từ 200.000đ',
    points_required: 500,
    is_active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockLoyaltyTransaction(
  overrides: Partial<LoyaltyTransaction> = {},
): LoyaltyTransaction {
  return {
    _id: uid(),
    user: 'user-1',
    type: 'earn',
    points: 100,
    description: 'Mua hàng',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockQAQuestion(overrides: Partial<QAQuestion> = {}): QAQuestion {
  return {
    _id: uid(),
    user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
    title: 'Sản phẩm có bảo hành không?',
    question: 'Sản phẩm có bảo hành không?',
    content: 'Sản phẩm có bảo hành không?',
    answers: [],
    answers_count: 0,
    likes_count: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockImportStats(overrides: Partial<ImportStats> = {}): ImportStats {
  return {
    totalProducts: 150,
    productsWithLocation: 120,
    locationStats: [
      { _id: 'Hà Nội', count: 60 },
      { _id: 'TP.HCM', count: 60 },
    ],
    ...overrides,
  }
}

export function createMockProductAnalytics(
  overrides: Partial<ProductAnalytics> = {},
): ProductAnalytics {
  return {
    _id: uid(),
    name: 'iPhone 15 Pro Max',
    image: 'https://example.com/iphone.jpg',
    sold: 50,
    view: 1000,
    rating: 4.5,
    revenue: 1499500000,
    ...overrides,
  }
}

export function createMockChatbotAnalytics(
  overrides: Partial<ChatbotAnalytics> = {},
): ChatbotAnalytics {
  return {
    total_conversations: 500,
    total_messages: 2500,
    avg_messages_per_conversation: 5,
    satisfaction_rate: 0.85,
    ...overrides,
  }
}
