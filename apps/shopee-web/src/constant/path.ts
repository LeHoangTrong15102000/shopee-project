// Đường dẫn này chỉ có thể đọc thôi, đánh tránh trong quá trình code gõ sai
const path = {
  home: '/',
  products: '/products',
  user: '/user',
  profile: '/user/profile',
  changePassword: '/user/password',
  historyPurchases: '/user/purchase',
  orderList: '/user/order',
  myVouchers: '/user/voucher',
  addressBook: '/user/address', // Trang quản lý địa chỉ giao hàng
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  logout: '/logout',
  categories: '/categories',
  productDetail: ':nameId', // sửa lại thành nameId cho nó đồng bộ với logic productDetail, tuy không để dấu '/' nhưng nó vẫn hiểu là có dấu /
  cart: '/cart', // dường dẫn trên UI do chúng ta tự tạo ra để phù hợp
  checkout: '/checkout', // Trang thanh toán
  wishlist: '/wishlist', // Trang danh sách yêu thích
  compare: '/compare', // Trang so sánh sản phẩm
  orderDetail: '/user/order/:orderId', // Chi tiết đơn hàng
  voucherCollection: '/vouchers', // Trang thu thập voucher
  dailyCheckIn: '/user/daily-checkin', // Trang điểm danh hàng ngày
  notifications: '/user/notification', // Trang thông báo
  conversations: '/user/conversations', // Trang lịch sử hội thoại
  priceAlerts: '/user/price-alerts' // Trang thông báo giá
} as const

export default path
