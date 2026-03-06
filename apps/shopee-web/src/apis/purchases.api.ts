import { Product } from 'src/types/product.type'
import { Purchase, PurchaseListStatus } from 'src/types/purchases.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Khai báo các api của purchases

const createDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

// Mock Products đa dạng
const mockProducts: Product[] = [
  // Thời trang
  {
    _id: 'prod-shirt-01',
    name: 'Áo thun nam cotton cao cấp',
    price: 250000,
    price_before_discount: 350000,
    image: 'https://picsum.photos/seed/shirt01/200',
    images: ['https://picsum.photos/seed/shirt01/200', 'https://picsum.photos/seed/shirt01b/200'],
    category: { _id: 'cat-fashion', name: 'Thời trang nam' },
    quantity: 100,
    sold: 1500,
    view: 5000,
    rating: 4.5,
    description: 'Áo thun nam chất liệu cotton 100%, thoáng mát',
    location: 'Hồ Chí Minh',
    createdAt: createDate(30),
    updatedAt: createDate(1)
  },
  {
    _id: 'prod-dress-02',
    name: 'Váy đầm nữ công sở thanh lịch',
    price: 450000,
    price_before_discount: 650000,
    image: 'https://picsum.photos/seed/dress02/200',
    images: ['https://picsum.photos/seed/dress02/200', 'https://picsum.photos/seed/dress02b/200'],
    category: { _id: 'cat-fashion-w', name: 'Thời trang nữ' },
    quantity: 80,
    sold: 2300,
    view: 7500,
    rating: 4.8,
    description: 'Váy đầm công sở thiết kế sang trọng, chất liệu cao cấp',
    location: 'Hà Nội',
    createdAt: createDate(25),
    updatedAt: createDate(2)
  },
  // Điện tử
  {
    _id: 'prod-phone-03',
    name: 'Điện thoại Samsung Galaxy A54 5G',
    price: 8990000,
    price_before_discount: 10990000,
    image: 'https://picsum.photos/seed/phone03/200',
    images: ['https://picsum.photos/seed/phone03/200', 'https://picsum.photos/seed/phone03b/200'],
    category: { _id: 'cat-phone', name: 'Điện thoại' },
    quantity: 50,
    sold: 890,
    view: 15000,
    rating: 4.7,
    description: 'Samsung Galaxy A54 5G 128GB, màn hình Super AMOLED',
    location: 'Hồ Chí Minh',
    createdAt: createDate(20),
    updatedAt: createDate(1)
  },
  {
    _id: 'prod-earphone-04',
    name: 'Tai nghe Bluetooth không dây TWS',
    price: 350000,
    price_before_discount: 500000,
    image: 'https://picsum.photos/seed/earphone04/200',
    images: ['https://picsum.photos/seed/earphone04/200', 'https://picsum.photos/seed/earphone04b/200'],
    category: { _id: 'cat-electronic', name: 'Điện tử' },
    quantity: 200,
    sold: 5600,
    view: 12000,
    rating: 4.4,
    description: 'Tai nghe Bluetooth 5.0, pin 20 giờ, chống ồn chủ động',
    location: 'Hà Nội',
    createdAt: createDate(15),
    updatedAt: createDate(3)
  },
  // Giày dép
  {
    _id: 'prod-sneaker-05',
    name: 'Giày thể thao nam Nike Air Max',
    price: 2500000,
    price_before_discount: 3200000,
    image: 'https://picsum.photos/seed/sneaker05/200',
    images: ['https://picsum.photos/seed/sneaker05/200', 'https://picsum.photos/seed/sneaker05b/200'],
    category: { _id: 'cat-shoes', name: 'Giày dép nam' },
    quantity: 60,
    sold: 1200,
    view: 8900,
    rating: 4.9,
    description: 'Giày Nike Air Max chính hãng, đệm khí êm ái',
    location: 'Hồ Chí Minh',
    createdAt: createDate(18),
    updatedAt: createDate(2)
  },
  {
    _id: 'prod-sandal-06',
    name: 'Dép sandal nữ quai ngang thời trang',
    price: 180000,
    price_before_discount: 250000,
    image: 'https://picsum.photos/seed/sandal06/200',
    images: ['https://picsum.photos/seed/sandal06/200', 'https://picsum.photos/seed/sandal06b/200'],
    category: { _id: 'cat-shoes-w', name: 'Giày dép nữ' },
    quantity: 150,
    sold: 3400,
    view: 6700,
    rating: 4.3,
    description: 'Dép sandal nữ thiết kế hiện đại, đế cao su chống trượt',
    location: 'Đà Nẵng',
    createdAt: createDate(12),
    updatedAt: createDate(1)
  },
  // Mỹ phẩm
  {
    _id: 'prod-skincare-07',
    name: 'Serum Vitamin C dưỡng trắng da',
    price: 320000,
    price_before_discount: 450000,
    image: 'https://picsum.photos/seed/skincare07/200',
    images: ['https://picsum.photos/seed/skincare07/200', 'https://picsum.photos/seed/skincare07b/200'],
    category: { _id: 'cat-beauty', name: 'Mỹ phẩm' },
    quantity: 300,
    sold: 8900,
    view: 25000,
    rating: 4.6,
    description: 'Serum Vitamin C 20% giúp làm sáng da, mờ thâm nám',
    location: 'Hồ Chí Minh',
    createdAt: createDate(10),
    updatedAt: createDate(1)
  },
  {
    _id: 'prod-lipstick-08',
    name: 'Son môi MAC Retro Matte',
    price: 550000,
    price_before_discount: 750000,
    image: 'https://picsum.photos/seed/lipstick08/200',
    images: ['https://picsum.photos/seed/lipstick08/200', 'https://picsum.photos/seed/lipstick08b/200'],
    category: { _id: 'cat-beauty', name: 'Mỹ phẩm' },
    quantity: 120,
    sold: 4500,
    view: 18000,
    rating: 4.8,
    description: 'Son MAC chính hãng, màu đỏ ruby quyến rũ',
    location: 'Hà Nội',
    createdAt: createDate(8),
    updatedAt: createDate(2)
  },
  // Đồ gia dụng
  {
    _id: 'prod-blender-09',
    name: 'Máy xay sinh tố đa năng Philips',
    price: 890000,
    price_before_discount: 1200000,
    image: 'https://picsum.photos/seed/blender09/200',
    images: ['https://picsum.photos/seed/blender09/200', 'https://picsum.photos/seed/blender09b/200'],
    category: { _id: 'cat-home', name: 'Đồ gia dụng' },
    quantity: 70,
    sold: 2100,
    view: 9500,
    rating: 4.5,
    description: 'Máy xay sinh tố Philips 1000W, cối thủy tinh 1.5L',
    location: 'Hồ Chí Minh',
    createdAt: createDate(14),
    updatedAt: createDate(3)
  },
  {
    _id: 'prod-pot-10',
    name: 'Nồi chiên không dầu Lock&Lock 5.5L',
    price: 1850000,
    price_before_discount: 2500000,
    image: 'https://picsum.photos/seed/pot10/200',
    images: ['https://picsum.photos/seed/pot10/200', 'https://picsum.photos/seed/pot10b/200'],
    category: { _id: 'cat-home', name: 'Đồ gia dụng' },
    quantity: 40,
    sold: 1800,
    view: 11000,
    rating: 4.7,
    description: 'Nồi chiên không dầu Lock&Lock 5.5L, điều khiển cảm ứng',
    location: 'Hà Nội',
    createdAt: createDate(7),
    updatedAt: createDate(1)
  },
  // Phụ kiện
  {
    _id: 'prod-bag-11',
    name: 'Balo laptop chống nước 15.6 inch',
    price: 320000,
    price_before_discount: 450000,
    image: 'https://picsum.photos/seed/bag11/200',
    images: ['https://picsum.photos/seed/bag11/200', 'https://picsum.photos/seed/bag11b/200'],
    category: { _id: 'cat-accessory', name: 'Phụ kiện' },
    quantity: 90,
    sold: 2800,
    view: 7200,
    rating: 4.4,
    description: 'Balo laptop chống nước, nhiều ngăn tiện lợi',
    location: 'Đà Nẵng',
    createdAt: createDate(11),
    updatedAt: createDate(2)
  },
  {
    _id: 'prod-watch-12',
    name: 'Đồng hồ thông minh Xiaomi Mi Band 8',
    price: 750000,
    price_before_discount: 990000,
    image: 'https://picsum.photos/seed/watch12/200',
    images: ['https://picsum.photos/seed/watch12/200', 'https://picsum.photos/seed/watch12b/200'],
    category: { _id: 'cat-accessory', name: 'Phụ kiện' },
    quantity: 150,
    sold: 6700,
    view: 22000,
    rating: 4.6,
    description: 'Mi Band 8 theo dõi sức khỏe, chống nước 5ATM',
    location: 'Hồ Chí Minh',
    createdAt: createDate(5),
    updatedAt: createDate(1)
  },
  // Thêm sản phẩm giá rẻ
  {
    _id: 'prod-mask-13',
    name: 'Mặt nạ dưỡng da Hàn Quốc (10 miếng)',
    price: 85000,
    price_before_discount: 120000,
    image: 'https://picsum.photos/seed/mask13/200',
    images: ['https://picsum.photos/seed/mask13/200', 'https://picsum.photos/seed/mask13b/200'],
    category: { _id: 'cat-beauty', name: 'Mỹ phẩm' },
    quantity: 500,
    sold: 15000,
    view: 35000,
    rating: 4.5,
    description: 'Mặt nạ dưỡng ẩm chiết xuất thiên nhiên',
    location: 'Hồ Chí Minh',
    createdAt: createDate(6),
    updatedAt: createDate(1)
  },
  {
    _id: 'prod-cable-14',
    name: 'Cáp sạc nhanh Type-C 65W',
    price: 55000,
    price_before_discount: 80000,
    image: 'https://picsum.photos/seed/cable14/200',
    images: ['https://picsum.photos/seed/cable14/200', 'https://picsum.photos/seed/cable14b/200'],
    category: { _id: 'cat-electronic', name: 'Điện tử' },
    quantity: 1000,
    sold: 25000,
    view: 45000,
    rating: 4.3,
    description: 'Cáp sạc nhanh 65W, dây dài 1.5m, chống đứt',
    location: 'Hà Nội',
    createdAt: createDate(4),
    updatedAt: createDate(1)
  },
  // Sản phẩm giá cao
  {
    _id: 'prod-laptop-15',
    name: 'Laptop ASUS VivoBook 15 i5-1235U',
    price: 15990000,
    price_before_discount: 18990000,
    image: 'https://picsum.photos/seed/laptop15/200',
    images: ['https://picsum.photos/seed/laptop15/200', 'https://picsum.photos/seed/laptop15b/200'],
    category: { _id: 'cat-laptop', name: 'Laptop' },
    quantity: 30,
    sold: 450,
    view: 28000,
    rating: 4.7,
    description: 'ASUS VivoBook 15, Intel Core i5, RAM 8GB, SSD 512GB',
    location: 'Hồ Chí Minh',
    createdAt: createDate(9),
    updatedAt: createDate(2)
  }
]

// Status -1: Trong giỏ hàng (3 đơn)
const cartPurchases: Purchase[] = [
  {
    _id: 'purchase-cart-01',
    buy_count: 2,
    price: mockProducts[0].price,
    price_before_discount: mockProducts[0].price_before_discount,
    status: -1,
    user: 'mock-user-id',
    product: mockProducts[0],
    createdAt: createDate(0),
    updatedAt: createDate(0)
  },
  {
    _id: 'purchase-cart-02',
    buy_count: 1,
    price: mockProducts[3].price,
    price_before_discount: mockProducts[3].price_before_discount,
    status: -1,
    user: 'mock-user-id',
    product: mockProducts[3],
    createdAt: createDate(0),
    updatedAt: createDate(0)
  },
  {
    _id: 'purchase-cart-03',
    buy_count: 3,
    price: mockProducts[12].price,
    price_before_discount: mockProducts[12].price_before_discount,
    status: -1,
    user: 'mock-user-id',
    product: mockProducts[12],
    createdAt: createDate(0),
    updatedAt: createDate(0)
  }
]

// Status 1: Chờ xác nhận (3 đơn)
const waitingConfirmPurchases: Purchase[] = [
  {
    _id: 'purchase-confirm-01',
    buy_count: 1,
    price: mockProducts[2].price,
    price_before_discount: mockProducts[2].price_before_discount,
    status: 1,
    user: 'mock-user-id',
    product: mockProducts[2],
    createdAt: createDate(1),
    updatedAt: createDate(1)
  },
  {
    _id: 'purchase-confirm-02',
    buy_count: 2,
    price: mockProducts[6].price,
    price_before_discount: mockProducts[6].price_before_discount,
    status: 1,
    user: 'mock-user-id',
    product: mockProducts[6],
    createdAt: createDate(0),
    updatedAt: createDate(0)
  },
  {
    _id: 'purchase-confirm-03',
    buy_count: 1,
    price: mockProducts[9].price,
    price_before_discount: mockProducts[9].price_before_discount,
    status: 1,
    user: 'mock-user-id',
    product: mockProducts[9],
    createdAt: createDate(0),
    updatedAt: createDate(0)
  }
]

// Status 2: Chờ lấy hàng (3 đơn)
const waitingPickupPurchases: Purchase[] = [
  {
    _id: 'purchase-pickup-01',
    buy_count: 1,
    price: mockProducts[4].price,
    price_before_discount: mockProducts[4].price_before_discount,
    status: 2,
    user: 'mock-user-id',
    product: mockProducts[4],
    createdAt: createDate(2),
    updatedAt: createDate(1)
  },
  {
    _id: 'purchase-pickup-02',
    buy_count: 3,
    price: mockProducts[13].price,
    price_before_discount: mockProducts[13].price_before_discount,
    status: 2,
    user: 'mock-user-id',
    product: mockProducts[13],
    createdAt: createDate(2),
    updatedAt: createDate(1)
  },
  {
    _id: 'purchase-pickup-03',
    buy_count: 1,
    price: mockProducts[7].price,
    price_before_discount: mockProducts[7].price_before_discount,
    status: 2,
    user: 'mock-user-id',
    product: mockProducts[7],
    createdAt: createDate(3),
    updatedAt: createDate(2)
  }
]

// Status 3: Đang giao (4 đơn)
const shippingPurchases: Purchase[] = [
  {
    _id: 'purchase-shipping-01',
    buy_count: 2,
    price: mockProducts[1].price,
    price_before_discount: mockProducts[1].price_before_discount,
    status: 3,
    user: 'mock-user-id',
    product: mockProducts[1],
    createdAt: createDate(4),
    updatedAt: createDate(2)
  },
  {
    _id: 'purchase-shipping-02',
    buy_count: 1,
    price: mockProducts[8].price,
    price_before_discount: mockProducts[8].price_before_discount,
    status: 3,
    user: 'mock-user-id',
    product: mockProducts[8],
    createdAt: createDate(3),
    updatedAt: createDate(1)
  },
  {
    _id: 'purchase-shipping-03',
    buy_count: 1,
    price: mockProducts[11].price,
    price_before_discount: mockProducts[11].price_before_discount,
    status: 3,
    user: 'mock-user-id',
    product: mockProducts[11],
    createdAt: createDate(5),
    updatedAt: createDate(3)
  },
  {
    _id: 'purchase-shipping-04',
    buy_count: 5,
    price: mockProducts[12].price,
    price_before_discount: mockProducts[12].price_before_discount,
    status: 3,
    user: 'mock-user-id',
    product: mockProducts[12],
    createdAt: createDate(4),
    updatedAt: createDate(2)
  }
]

// Status 4: Đã giao/Hoàn thành (5 đơn)
const deliveredPurchases: Purchase[] = [
  {
    _id: 'purchase-delivered-01',
    buy_count: 1,
    price: mockProducts[14].price,
    price_before_discount: mockProducts[14].price_before_discount,
    status: 4,
    user: 'mock-user-id',
    product: mockProducts[14],
    createdAt: createDate(15),
    updatedAt: createDate(7)
  },
  {
    _id: 'purchase-delivered-02',
    buy_count: 2,
    price: mockProducts[5].price,
    price_before_discount: mockProducts[5].price_before_discount,
    status: 4,
    user: 'mock-user-id',
    product: mockProducts[5],
    createdAt: createDate(20),
    updatedAt: createDate(14)
  },
  {
    _id: 'purchase-delivered-03',
    buy_count: 1,
    price: mockProducts[10].price,
    price_before_discount: mockProducts[10].price_before_discount,
    status: 4,
    user: 'mock-user-id',
    product: mockProducts[10],
    createdAt: createDate(25),
    updatedAt: createDate(18)
  },
  {
    _id: 'purchase-delivered-04',
    buy_count: 3,
    price: mockProducts[0].price,
    price_before_discount: mockProducts[0].price_before_discount,
    status: 4,
    user: 'mock-user-id',
    product: mockProducts[0],
    createdAt: createDate(30),
    updatedAt: createDate(23)
  },
  {
    _id: 'purchase-delivered-05',
    buy_count: 1,
    price: mockProducts[3].price,
    price_before_discount: mockProducts[3].price_before_discount,
    status: 4,
    user: 'mock-user-id',
    product: mockProducts[3],
    createdAt: createDate(12),
    updatedAt: createDate(5)
  }
]

// Status 5: Đã hủy (2 đơn)
const cancelledPurchases: Purchase[] = [
  {
    _id: 'purchase-cancelled-01',
    buy_count: 1,
    price: mockProducts[2].price,
    price_before_discount: mockProducts[2].price_before_discount,
    status: 5,
    user: 'mock-user-id',
    product: mockProducts[2],
    createdAt: createDate(10),
    updatedAt: createDate(9)
  },
  {
    _id: 'purchase-cancelled-02',
    buy_count: 2,
    price: mockProducts[9].price,
    price_before_discount: mockProducts[9].price_before_discount,
    status: 5,
    user: 'mock-user-id',
    product: mockProducts[9],
    createdAt: createDate(8),
    updatedAt: createDate(7)
  }
]

// Tổng hợp tất cả mock purchases
const allMockPurchases: Purchase[] = [
  ...cartPurchases,
  ...waitingConfirmPurchases,
  ...waitingPickupPurchases,
  ...shippingPurchases,
  ...deliveredPurchases,
  ...cancelledPurchases
]

// Giữ lại mockPurchases cũ cho backward compatibility
const mockPurchases = cartPurchases

const purchaseApi = {
  // addToCart gửi lên từng sản phẩm - purchase
  addToCart: async (body: { product_id: string; buy_count: number }) => {
    try {
      return await http.post<SuccessResponseApi<Purchase>>('/purchases/add-to-cart', body)
    } catch (error) {
      console.warn('⚠️ [addToCart] API not available, using mock data')
      const mockPurchase: Purchase = {
        _id: `mock-purchase-${Date.now()}`,
        buy_count: body.buy_count,
        price: mockProducts[0].price,
        price_before_discount: mockProducts[0].price_before_discount,
        status: -1,
        user: 'mock-user-id',
        product: { ...mockProducts[0], _id: body.product_id },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return { data: { message: 'Thêm sản phẩm vào giỏ hàng thành công', data: mockPurchase } }
    }
  },
  // lấy ra danh sách các status của purchase, getPurchaseList thì trả về array các purchases
  getPurchases: async (params: { status: PurchaseListStatus }) => {
    try {
      return await http.get<SuccessResponseApi<Purchase[]>>('/purchases', {
        params
      })
    } catch (error) {
      console.warn('⚠️ [getPurchases] API not available, using mock data')

      let filteredPurchases: Purchase[]

      if (params.status === 0) {
        // Status 0 (all): trả về tất cả trừ status -1 (giỏ hàng)
        filteredPurchases = allMockPurchases.filter((p) => p.status !== -1)
      } else {
        // Các status khác: filter theo đúng status
        filteredPurchases = allMockPurchases.filter((p) => p.status === params.status)
      }

      return { data: { message: 'Lấy danh sách đơn hàng thành công', data: filteredPurchases } }
    }
  },
  // buy-product, body là mảng các object
  buyPurchases: async (body: { product_id: string; buy_count: number }[]) => {
    try {
      return await http.post<SuccessResponseApi<Purchase[]>>('/purchases/buy-products', body)
    } catch (error) {
      console.warn('⚠️ [buyPurchases] API not available, using mock data')
      const boughtPurchases = mockPurchases.map((purchase) => ({
        ...purchase,
        status: 1 as const
      }))
      return { data: { message: 'Mua hàng thành công', data: boughtPurchases } }
    }
  },
  updatePurchase: async (body: { product_id: string; buy_count: number }) => {
    try {
      return await http.put<SuccessResponseApi<Purchase>>('/purchases/update-purchase', body)
    } catch (error) {
      console.warn('⚠️ [updatePurchase] API not available, using mock data')
      const updatedPurchase: Purchase = {
        ...mockPurchases[0],
        buy_count: body.buy_count,
        product: { ...mockPurchases[0].product, _id: body.product_id },
        updatedAt: new Date().toISOString()
      }
      return { data: { message: 'Cập nhật đơn hàng thành công', data: updatedPurchase } }
    }
  },
  deletePurchase: async (purchaseIds: string[]) => {
    try {
      return await http.delete<SuccessResponseApi<{ deleted_count: number }>>('/purchases', {
        data: purchaseIds // data nhận vào là một sản phẩm cần xóa hoặc nhiều sản phẩm
      })
    } catch (error) {
      console.warn('⚠️ [deletePurchase] API not available, using mock data')
      return { data: { message: 'Xóa đơn hàng thành công', data: { deleted_count: purchaseIds.length } } }
    }
  }
}

export default purchaseApi
