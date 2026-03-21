/**
 * Mock data for MSW browser worker — all domains
 * Used in dev mode when the real API is not available
 */

import type {
  Product,
  Category,
  User,
  Order,
  OrderStatus,
  Voucher,
  LoyaltyReward,
  LoyaltyTransaction,
  Notification,
  QAQuestion,
  DashboardOverview,
  RevenueData,
  OrderTrendData,
  UserGrowthData,
  TopProduct,
  TopBuyer,
  RevenueByCategoryData,
  ProductAnalytics,
  ChatbotAnalytics,
  ImportStats,
  Review,
  ReviewComment,
} from 'src/types';

// ─── Helpers ───────────────────────────────────────────────
const id = (prefix: string, i: number) => `${prefix}-${String(i).padStart(3, '0')}`;
const date = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const IMG = 'https://placehold.co';

// ─── Categories ────────────────────────────────────────────
export const categories: Category[] = [
  { _id: 'cat-001', name: 'Điện thoại & Phụ kiện' },
  { _id: 'cat-002', name: 'Máy tính & Laptop' },
  { _id: 'cat-003', name: 'Thiết bị điện tử' },
  { _id: 'cat-004', name: 'Thời trang Nam' },
  { _id: 'cat-005', name: 'Thời trang Nữ' },
  { _id: 'cat-006', name: 'Giày dép' },
  { _id: 'cat-007', name: 'Túi xách & Ví' },
  { _id: 'cat-008', name: 'Đồng hồ' },
  { _id: 'cat-009', name: 'Nhà cửa & Đời sống' },
  { _id: 'cat-010', name: 'Sức khỏe & Sắc đẹp' },
];

// ─── Users ─────────────────────────────────────────────────
const userNames = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Hoàng Cường',
  'Phạm Minh Đức',
  'Hoàng Thị Em',
  'Vũ Quốc Phong',
  'Đặng Thùy Giang',
  'Bùi Thanh Hải',
  'Ngô Thị Ích',
  'Dương Văn Khoa',
  'Lý Thị Lan',
  'Trịnh Đình Minh',
  'Hồ Ngọc Nhi',
  'Phan Văn Oanh',
  'Mai Thị Phương',
  'Tạ Quang Rạng',
  'Đinh Thị Sen',
  'Cao Văn Tùng',
  'Lương Thị Uyên',
  'Châu Minh Vũ',
];

export const users: User[] = userNames.map((name, i) => ({
  _id: id('user', i + 1),
  email: `${name
    .toLowerCase()
    .replace(/\s+/g, '.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')}@gmail.com`,
  name,
  roles: i === 0 ? ['Admin'] : ['User'],
  avatar: `${IMG}/40x40/EE4D2D/fff?text=${name.charAt(0)}`,
  phone: `09${String(10000000 + i * 1111111).slice(0, 8)}`,
  address: `${100 + i} Nguyễn Huệ, Quận 1, TP.HCM`,
  date_of_birth: `199${i % 10}-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  createdAt: date(365 - i * 15),
  updatedAt: date(i * 3),
}));

// ─── Products ──────────────────────────────────────────────
const productData = [
  { name: 'iPhone 15 Pro Max 256GB', cat: 0, price: 29990000, sold: 1250, view: 45000 },
  { name: 'Samsung Galaxy S24 Ultra', cat: 0, price: 31990000, sold: 980, view: 38000 },
  { name: 'MacBook Air M3 15 inch', cat: 1, price: 32990000, sold: 520, view: 28000 },
  { name: 'Laptop ASUS ROG Strix G16', cat: 1, price: 35990000, sold: 340, view: 22000 },
  { name: 'iPad Pro M4 11 inch', cat: 2, price: 24990000, sold: 680, view: 31000 },
  { name: 'AirPods Pro 2 USB-C', cat: 2, price: 5990000, sold: 2100, view: 52000 },
  { name: 'Áo thun nam Polo Classic', cat: 3, price: 299000, sold: 8500, view: 65000 },
  { name: 'Quần jean nam Slim Fit', cat: 3, price: 450000, sold: 6200, view: 48000 },
  { name: 'Đầm nữ hoa nhí vintage', cat: 4, price: 350000, sold: 4800, view: 55000 },
  { name: 'Áo khoác nữ bomber', cat: 4, price: 520000, sold: 3200, view: 42000 },
  { name: 'Giày Nike Air Force 1', cat: 5, price: 2800000, sold: 1800, view: 38000 },
  { name: 'Dép Adidas Adilette', cat: 5, price: 890000, sold: 3500, view: 29000 },
  { name: 'Túi xách nữ Charles & Keith', cat: 6, price: 1290000, sold: 2200, view: 35000 },
  { name: 'Ví nam da bò handmade', cat: 6, price: 650000, sold: 1500, view: 18000 },
  { name: 'Đồng hồ Casio G-Shock', cat: 7, price: 3200000, sold: 900, view: 25000 },
  { name: 'Apple Watch Series 9', cat: 7, price: 10990000, sold: 750, view: 32000 },
  { name: 'Nồi chiên không dầu Philips', cat: 8, price: 2490000, sold: 4200, view: 58000 },
  { name: 'Robot hút bụi Xiaomi', cat: 8, price: 5990000, sold: 1100, view: 28000 },
  { name: 'Serum Vitamin C The Ordinary', cat: 9, price: 280000, sold: 9500, view: 72000 },
  { name: 'Kem chống nắng Anessa', cat: 9, price: 450000, sold: 7800, view: 61000 },
  { name: 'Xiaomi Redmi Note 13 Pro', cat: 0, price: 7490000, sold: 3200, view: 42000 },
  { name: 'Bàn phím cơ Keychron K8', cat: 2, price: 2190000, sold: 1600, view: 21000 },
  { name: 'Áo sơ mi nam Oxford', cat: 3, price: 380000, sold: 5400, view: 38000 },
  { name: 'Chân váy nữ xếp ly', cat: 4, price: 280000, sold: 4100, view: 35000 },
  { name: 'Giày Converse Chuck 70', cat: 5, price: 1890000, sold: 2800, view: 33000 },
];

export const products: Product[] = productData.map((p, i) => ({
  _id: id('prod', i + 1),
  name: p.name,
  image: `${IMG}/400x400/f5f5f5/333?text=P${i + 1}`,
  images: Array.from({ length: 4 }, (_, j) => `${IMG}/400x400/f5f5f5/333?text=P${i + 1}-${j + 1}`),
  description: `Mô tả chi tiết cho sản phẩm ${p.name}. Sản phẩm chính hãng, bảo hành 12 tháng.`,
  category: categories[p.cat],
  price: p.price,
  price_before_discount: Math.round(p.price * 1.2),
  quantity: Math.floor(Math.random() * 500) + 10,
  sold: p.sold,
  view: p.view,
  rating: +(3.5 + Math.random() * 1.5).toFixed(1),
  location: pick(['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']),
  createdAt: date(180 - i * 5),
  updatedAt: date(i * 2),
}));

// ─── Orders ────────────────────────────────────────────────
const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const orders: Order[] = Array.from({ length: 30 }, (_, i) => {
  const user = users[i % users.length];
  const numItems = (i % 3) + 1;
  const items = Array.from({ length: numItems }, (_, j) => {
    const prod = products[(i * 3 + j) % products.length];
    return {
      product: prod,
      buy_count: (j % 4) + 1,
      price: prod.price,
      price_before_discount: prod.price_before_discount,
    };
  });
  const total = items.reduce((s, it) => s + it.price * it.buy_count, 0);
  return {
    _id: id('order', i + 1),
    user,
    items,
    total_price: total,
    status: statuses[i % statuses.length],
    payment_method: pick(['COD', 'Momo', 'ZaloPay', 'VNPay', 'Credit Card']),
    shipping_address: user.address ?? '123 Nguyễn Huệ, Q1, TP.HCM',
    note: i % 4 === 0 ? 'Giao giờ hành chính' : undefined,
    createdAt: date(60 - i * 2),
    updatedAt: date(i),
  };
});

// ─── Reviews ───────────────────────────────────────────────
const reviewComments = [
  'Sản phẩm rất tốt, đúng mô tả!',
  'Giao hàng nhanh, đóng gói cẩn thận.',
  'Chất lượng tạm ổn so với giá tiền.',
  'Mình rất hài lòng, sẽ mua lại.',
  'Hàng đẹp, shop tư vấn nhiệt tình.',
  'Sản phẩm dùng được, nhưng hơi nhỏ.',
  'Giá hợp lý, chất lượng OK.',
  'Đã mua lần 2, vẫn rất ưng.',
  'Ship hơi lâu nhưng hàng tốt.',
  'Không như mong đợi lắm.',
  'Tuyệt vời! 10 điểm không có nhưng.',
  'Sản phẩm chính hãng, yên tâm.',
  'Màu hơi khác ảnh một chút.',
  'Dùng 1 tuần rồi, rất bền.',
  'Đóng gói kỹ, hàng nguyên vẹn.',
];

export const reviews: Review[] = Array.from({ length: 20 }, (_, i) => {
  const user = users[i % users.length];
  const prod = products[i % products.length];
  return {
    _id: id('review', i + 1),
    user: { _id: user._id, name: user.name ?? '', email: user.email, avatar: user.avatar },
    product: { _id: prod._id, name: prod.name, image: prod.image },
    rating: (i % 5) + 1,
    comment: reviewComments[i % reviewComments.length],
    images: i % 3 === 0 ? [`${IMG}/200x200/f5f5f5/333?text=R${i + 1}`] : [],
    helpful_count: Math.floor(Math.random() * 50),
    comments_count: i % 4,
    createdAt: date(90 - i * 4),
    updatedAt: date(i * 2),
  };
});

export const reviewCommentsData: ReviewComment[] = Array.from({ length: 8 }, (_, i) => {
  const user = users[(i + 5) % users.length];
  return {
    _id: id('rc', i + 1),
    user: { _id: user._id, name: user.name ?? '', email: user.email, avatar: user.avatar },
    review: reviews[i % reviews.length]._id,
    content: pick([
      'Cảm ơn bạn đã review!',
      'Mình cũng thấy vậy.',
      'Shop sẽ cải thiện ạ.',
      'Đồng ý với bạn!',
    ]),
    level: 0,
    replies_count: 0,
    createdAt: date(80 - i * 5),
    updatedAt: date(i * 3),
  };
});

// ─── Vouchers ──────────────────────────────────────────────
export const vouchers: Voucher[] = [
  {
    _id: 'vc-001',
    code: 'WELCOME50',
    discount_type: 'percentage',
    discount_value: 50,
    min_order_value: 200000,
    usage_limit: 1000,
    used_count: 456,
    is_active: true,
    start_date: date(30),
    end_date: date(-60),
    createdAt: date(30),
    updatedAt: date(5),
  },
  {
    _id: 'vc-002',
    code: 'SALE100K',
    discount_type: 'fixed',
    discount_value: 100000,
    min_order_value: 500000,
    usage_limit: 500,
    used_count: 312,
    is_active: true,
    start_date: date(20),
    end_date: date(-45),
    createdAt: date(20),
    updatedAt: date(3),
  },
  {
    _id: 'vc-003',
    code: 'FREESHIP',
    discount_type: 'fixed',
    discount_value: 30000,
    min_order_value: 0,
    usage_limit: 5000,
    used_count: 3200,
    is_active: true,
    start_date: date(60),
    end_date: date(-30),
    createdAt: date(60),
    updatedAt: date(1),
  },
  {
    _id: 'vc-004',
    code: 'VIP20',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_value: 1000000,
    usage_limit: 200,
    used_count: 89,
    is_active: true,
    start_date: date(15),
    end_date: date(-90),
    createdAt: date(15),
    updatedAt: date(2),
  },
  {
    _id: 'vc-005',
    code: 'FLASH30',
    discount_type: 'percentage',
    discount_value: 30,
    min_order_value: 300000,
    usage_limit: 100,
    used_count: 100,
    is_active: false,
    start_date: date(45),
    end_date: date(5),
    createdAt: date(45),
    updatedAt: date(5),
  },
  {
    _id: 'vc-006',
    code: 'NEWYEAR',
    discount_type: 'fixed',
    discount_value: 200000,
    min_order_value: 800000,
    usage_limit: 300,
    used_count: 178,
    is_active: false,
    start_date: date(90),
    end_date: date(30),
    createdAt: date(90),
    updatedAt: date(30),
  },
  {
    _id: 'vc-007',
    code: 'SUMMER25',
    discount_type: 'percentage',
    discount_value: 25,
    min_order_value: 400000,
    usage_limit: 800,
    used_count: 234,
    is_active: true,
    start_date: date(10),
    end_date: date(-20),
    createdAt: date(10),
    updatedAt: date(1),
  },
  {
    _id: 'vc-008',
    code: 'MEMBER10',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 100000,
    usage_limit: 10000,
    used_count: 5678,
    is_active: true,
    start_date: date(120),
    end_date: date(-180),
    createdAt: date(120),
    updatedAt: date(0),
  },
];

// ─── Notifications ─────────────────────────────────────────
export const notifications: Notification[] = [
  {
    _id: 'noti-001',
    title: 'Đơn hàng mới',
    message: 'Bạn có 5 đơn hàng mới cần xử lý.',
    type: 'broadcast',
    is_read: false,
    createdAt: date(0),
  },
  {
    _id: 'noti-002',
    title: 'Sản phẩm hết hàng',
    message: 'iPhone 15 Pro Max sắp hết hàng (còn 3).',
    type: 'broadcast',
    is_read: false,
    createdAt: date(1),
  },
  {
    _id: 'noti-003',
    user: users[1],
    title: 'Yêu cầu hoàn tiền',
    message: 'Khách hàng Trần Thị Bình yêu cầu hoàn tiền đơn #order-005.',
    type: 'targeted',
    is_read: true,
    createdAt: date(2),
  },
  {
    _id: 'noti-004',
    title: 'Khuyến mãi sắp hết hạn',
    message: 'Voucher FLASH30 sẽ hết hạn trong 2 ngày.',
    type: 'broadcast',
    is_read: true,
    createdAt: date(3),
  },
  {
    _id: 'noti-005',
    user: users[3],
    title: 'Review mới',
    message: 'Phạm Minh Đức đã đánh giá 5 sao cho MacBook Air M3.',
    type: 'targeted',
    is_read: false,
    createdAt: date(4),
  },
  {
    _id: 'noti-006',
    title: 'Cập nhật hệ thống',
    message: 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 AM ngày mai.',
    type: 'broadcast',
    is_read: true,
    createdAt: date(5),
  },
  {
    _id: 'noti-007',
    user: users[6],
    title: 'Đơn hàng bị hủy',
    message: 'Đặng Thùy Giang đã hủy đơn hàng #order-012.',
    type: 'targeted',
    is_read: false,
    createdAt: date(6),
  },
  {
    _id: 'noti-008',
    title: 'Báo cáo tuần',
    message: 'Doanh thu tuần này tăng 15% so với tuần trước.',
    type: 'broadcast',
    is_read: true,
    createdAt: date(7),
  },
  {
    _id: 'noti-009',
    title: 'Tồn kho thấp',
    message: '8 sản phẩm có tồn kho dưới 10 đơn vị.',
    type: 'broadcast',
    is_read: false,
    createdAt: date(8),
  },
  {
    _id: 'noti-010',
    user: users[9],
    title: 'Câu hỏi mới',
    message: 'Dương Văn Khoa đặt câu hỏi về sản phẩm AirPods Pro 2.',
    type: 'targeted',
    is_read: false,
    createdAt: date(9),
  },
];

// ─── Loyalty ───────────────────────────────────────────────
export const loyaltyRewards: LoyaltyReward[] = [
  {
    _id: 'lr-001',
    name: 'Giảm 50K đơn tiếp theo',
    description: 'Đổi điểm lấy voucher giảm 50.000đ',
    points_required: 500,
    is_active: true,
    createdAt: date(90),
    updatedAt: date(5),
  },
  {
    _id: 'lr-002',
    name: 'Free Ship 7 ngày',
    description: 'Miễn phí vận chuyển trong 7 ngày',
    points_required: 300,
    is_active: true,
    createdAt: date(80),
    updatedAt: date(3),
  },
  {
    _id: 'lr-003',
    name: 'Giảm 10% tối đa 200K',
    description: 'Voucher giảm 10% cho đơn từ 500K',
    points_required: 1000,
    is_active: true,
    createdAt: date(70),
    updatedAt: date(1),
  },
  {
    _id: 'lr-004',
    name: 'Quà tặng sinh nhật',
    description: 'Voucher đặc biệt nhân dịp sinh nhật',
    points_required: 200,
    is_active: true,
    createdAt: date(60),
    updatedAt: date(10),
  },
  {
    _id: 'lr-005',
    name: 'Giảm 500K đơn từ 2 triệu',
    description: 'Ưu đãi VIP cho thành viên trung thành',
    points_required: 5000,
    is_active: false,
    createdAt: date(120),
    updatedAt: date(30),
  },
];

export const loyaltyTransactions: LoyaltyTransaction[] = Array.from({ length: 15 }, (_, i) => ({
  _id: id('lt', i + 1),
  user: users[i % users.length],
  type: (['earn', 'redeem', 'adjust'] as const)[i % 3],
  points: (i % 3 === 1 ? -1 : 1) * ((i + 1) * 50),
  description: [
    'Mua hàng đơn #order-001',
    'Đổi voucher Giảm 50K',
    'Admin điều chỉnh điểm',
    'Mua hàng đơn #order-008',
    'Đổi Free Ship 7 ngày',
  ][i % 5],
  createdAt: date(30 - i * 2),
}));

// ─── QA ────────────────────────────────────────────────────
export const qaQuestions: QAQuestion[] = Array.from({ length: 10 }, (_, i) => {
  const user = users[i % users.length];
  const prod = products[i % products.length];
  return {
    _id: id('qa', i + 1),
    user: { _id: user._id, name: user.name ?? '', email: user.email, avatar: user.avatar },
    content: [
      `Sản phẩm ${prod.name} có bảo hành không?`,
      `Màu ${prod.name} có giống ảnh không ạ?`,
      `Ship ${prod.name} về tỉnh mất bao lâu?`,
      `${prod.name} có hàng sẵn không shop?`,
      `Mua ${prod.name} có quà tặng kèm không?`,
    ][i % 5],
    answers:
      i % 3 === 0
        ? []
        : [
            {
              _id: id('qa-ans', i + 1),
              user: { _id: 'user-001', name: 'Nguyễn Văn An', email: 'admin@shopee.com' },
              content: 'Dạ có ạ, bạn yên tâm nhé!',
              likes_count: Math.floor(Math.random() * 10),
              createdAt: date(20 - i),
            },
          ],
    answers_count: i % 3 === 0 ? 0 : 1,
    likes_count: Math.floor(Math.random() * 20),
    createdAt: date(40 - i * 3),
    updatedAt: date(i * 2),
  };
});

// ─── Dashboard ─────────────────────────────────────────────
export const dashboardOverview: DashboardOverview = {
  total_revenue: 2_847_500_000,
  total_orders: 1_256,
  total_users: 8_432,
  total_products: 25,
  revenue_change: 12.5,
  orders_change: 8.3,
  users_change: 15.2,
  products_change: -2.1,
};

export const revenueData: RevenueData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  revenue: 50_000_000 + Math.floor(Math.random() * 100_000_000),
}));

export const orderTrendData: OrderTrendData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  orders: 20 + Math.floor(Math.random() * 60),
}));

export const userGrowthData: UserGrowthData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  users: 200 + i * 15 + Math.floor(Math.random() * 30),
}));

export const topProducts: TopProduct[] = products.slice(0, 10).map((p) => ({
  _id: p._id,
  name: p.name,
  image: p.image,
  revenue: p.price * p.sold,
  sold: p.sold,
}));

export const topBuyers: TopBuyer[] = users.slice(0, 10).map((u, i) => ({
  _id: u._id,
  name: u.name ?? '',
  email: u.email,
  avatar: u.avatar,
  total_spent: 5_000_000 + (10 - i) * 2_000_000,
  total_orders: 10 + (10 - i) * 3,
}));

export const revenueByCategoryData: RevenueByCategoryData[] = categories
  .slice(0, 6)
  .map((c, i, arr) => {
    const revenue = 100_000_000 + Math.floor(Math.random() * 500_000_000);
    const totalRevenue = arr.reduce(
      (sum) => sum + 100_000_000 + Math.floor(Math.random() * 500_000_000),
      0,
    );
    return {
      category: c.name,
      revenue,
      percent: Math.round((revenue / totalRevenue) * 100),
    };
  });

// ─── Analytics ─────────────────────────────────────────────
export const productAnalytics: ProductAnalytics[] = products.slice(0, 15).map((p) => ({
  _id: p._id,
  name: p.name,
  image: p.image,
  sold: p.sold,
  view: p.view,
  rating: p.rating,
  revenue: p.price * p.sold,
}));

export const chatbotAnalytics: ChatbotAnalytics = {
  total_conversations: 12_450,
  total_messages: 87_320,
  avg_messages_per_conversation: 7.01,
  satisfaction_rate: 0.89,
};

// ─── Import Stats ──────────────────────────────────────────
export const importStats: ImportStats = {
  totalProducts: 25,
  productsWithLocation: 22,
  locationStats: [
    { _id: 'TP. Hồ Chí Minh', count: 12 },
    { _id: 'Hà Nội', count: 7 },
    { _id: 'Đà Nẵng', count: 3 },
  ],
};
