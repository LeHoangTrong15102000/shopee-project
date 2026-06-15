/**
 * Centralized messages cho toàn bộ API
 * Dễ dàng maintain và hỗ trợ i18n sau này
 *
 * Cấu trúc:
 * - Mỗi module có object riêng (AUTH_MESSAGES, PRODUCT_MESSAGES, etc.)
 * - Mỗi object chứa Success messages và Error messages
 * - Sử dụng `as const` để có type safety
 */

// ==================== ERROR CODES ====================
// Mã lỗi dùng để identify lỗi trong logs và debugging
export const ERROR_CODES = {
  // Auth errors (1xxx)
  AUTH_EMAIL_EXISTS: 'E1001',
  AUTH_INVALID_CREDENTIALS: 'E1002',
  AUTH_TOKEN_NOT_SENT: 'E1003',
  AUTH_TOKEN_NOT_EXISTS: 'E1004',
  AUTH_TOKEN_EXPIRED: 'E1005',
  AUTH_TOKEN_INVALID: 'E1006',
  AUTH_REFRESH_TOKEN_NOT_EXISTS: 'E1007',
  AUTH_UNAUTHORIZED: 'E1008',
  AUTH_FORBIDDEN: 'E1009',

  // User errors (2xxx)
  USER_NOT_FOUND: 'E2001',
  USER_EMAIL_EXISTS: 'E2002',

  // Product errors (3xxx)
  PRODUCT_NOT_FOUND: 'E3001',
  PRODUCT_QUANTITY_EXCEEDED: 'E3002',

  // Purchase errors (4xxx)
  PURCHASE_NOT_FOUND: 'E4001',
  PURCHASE_PRODUCT_NOT_FOUND: 'E4002',

  // Category errors (5xxx)
  CATEGORY_NOT_FOUND: 'E5001',
  CATEGORY_NAME_EXISTS: 'E5002',

  // Review errors (6xxx)
  REVIEW_NOT_FOUND: 'E6001',
  REVIEW_ALREADY_EXISTS: 'E6002',

  // Wishlist errors (7xxx)
  WISHLIST_NOT_FOUND: 'E7001',
  WISHLIST_ALREADY_EXISTS: 'E7002',

  // Common errors (9xxx)
  VALIDATION_ERROR: 'E9001',
  INTERNAL_SERVER_ERROR: 'E9002',
  BAD_REQUEST: 'E9003',
  NOT_FOUND: 'E9004',
  UPLOAD_MOVE_FAILED: 'E9005',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// ==================== AUTH MESSAGES ====================
export const AUTH_MESSAGES = {
  // Success
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  REFRESH_TOKEN_SUCCESS: 'Refresh Token thành công',
  GOOGLE_LOGIN_SUCCESS: 'Đăng nhập Google thành công',

  // Errors
  EMAIL_EXISTS: 'Email đã tồn tại',
  INVALID_CREDENTIALS: 'Email hoặc password không đúng',
  TOKEN_NOT_SENT: 'Token không được gửi',
  TOKEN_NOT_EXISTS: 'Không tồn tại token',
  TOKEN_EXPIRED: 'Token đã hết hạn',
  TOKEN_INVALID: 'Token không hợp lệ',
  REFRESH_TOKEN_NOT_EXISTS: 'Refresh Token không tồn tại',
  UNAUTHORIZED: 'Bạn không có quyền truy cập',
  FORBIDDEN: 'Bạn không có quyền thực hiện hành động này',
  GOOGLE_TOKEN_REQUIRED: 'Google ID token là bắt buộc',
  GOOGLE_TOKEN_INVALID: 'Google ID token không hợp lệ',
} as const

// ==================== USER MESSAGES ====================
export const USER_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Tạo người dùng thành công',
  UPDATE_SUCCESS: 'Cập nhật thông tin thành công',
  DELETE_SUCCESS: 'Xóa thành công',
  GET_SUCCESS: 'Lấy thông tin thành công',
  UPLOAD_AVATAR_SUCCESS: 'Upload ảnh đại diện thành công',

  // Errors
  NOT_FOUND: 'Không tìm thấy người dùng',
  EMAIL_EXISTS: 'Email đã tồn tại',
} as const

// ==================== PRODUCT MESSAGES ====================
export const PRODUCT_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Tạo sản phẩm thành công',
  UPDATE_SUCCESS: 'Cập nhật sản phẩm thành công',
  DELETE_SUCCESS: 'Xóa sản phẩm thành công',
  GET_SUCCESS: 'Lấy sản phẩm thành công',
  GET_LIST_SUCCESS: 'Lấy danh sách sản phẩm thành công',

  // Errors
  NOT_FOUND: 'Không tìm thấy sản phẩm',
  QUANTITY_EXCEEDED: 'Số lượng vượt quá số lượng sản phẩm',
  BUY_QUANTITY_EXCEEDED: 'Số lượng mua vượt quá số lượng sản phẩm',
} as const

// ==================== PURCHASE MESSAGES ====================
export const PURCHASE_MESSAGES = {
  // Success
  ADD_TO_CART_SUCCESS: 'Thêm sản phẩm vào giỏ hàng thành công',
  UPDATE_SUCCESS: 'Cập nhật đơn thành công',
  BUY_SUCCESS: 'Mua thành công',
  GET_SUCCESS: 'Lấy đơn mua thành công',
  DELETE_SUCCESS: (count: number) => `Xoá ${count} đơn thành công`,

  // Errors
  NOT_FOUND: 'Không tìm thấy đơn',
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
} as const

// ==================== CATEGORY MESSAGES ====================
export const CATEGORY_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Tạo danh mục thành công',
  UPDATE_SUCCESS: 'Cập nhật danh mục thành công',
  DELETE_SUCCESS: 'Xóa danh mục thành công',
  GET_SUCCESS: 'Lấy danh mục thành công',
  GET_LIST_SUCCESS: 'Lấy danh sách danh mục thành công',

  // Errors
  NOT_FOUND: 'Không tìm thấy danh mục',
  NAME_EXISTS: 'Tên danh mục đã tồn tại',
} as const

// ==================== REVIEW MESSAGES ====================
export const REVIEW_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Tạo đánh giá thành công',
  UPDATE_SUCCESS: 'Cập nhật đánh giá thành công',
  DELETE_SUCCESS: 'Xóa đánh giá thành công',
  GET_SUCCESS: 'Lấy đánh giá thành công',

  // Errors
  NOT_FOUND: 'Không tìm thấy đánh giá',
  ALREADY_REVIEWED: 'Bạn đã đánh giá sản phẩm này',
} as const

// ==================== WISHLIST MESSAGES ====================
export const WISHLIST_MESSAGES = {
  // Success
  ADD_SUCCESS: 'Thêm vào danh sách yêu thích thành công',
  REMOVE_SUCCESS: 'Xóa khỏi danh sách yêu thích thành công',
  GET_SUCCESS: 'Lấy danh sách yêu thích thành công',

  // Errors
  NOT_FOUND: 'Không tìm thấy trong danh sách yêu thích',
  ALREADY_EXISTS: 'Sản phẩm đã có trong danh sách yêu thích',
} as const

// ==================== COMMON MESSAGES ====================
export const COMMON_MESSAGES = {
  // Success
  SUCCESS: 'Thành công',
  CREATED: 'Tạo thành công',
  UPDATED: 'Cập nhật thành công',
  DELETED: 'Xóa thành công',

  // Errors
  ERROR: 'Lỗi',
  NOT_FOUND: 'Không tìm thấy',
  BAD_REQUEST: 'Yêu cầu không hợp lệ',
  INTERNAL_SERVER_ERROR: 'Lỗi hệ thống',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  INVALID_ID: 'ID không hợp lệ',
} as const

// ==================== VALIDATION MESSAGES ====================
export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} là bắt buộc`,
  MIN_LENGTH: (field: string, min: number) => `${field} phải có ít nhất ${min} ký tự`,
  MAX_LENGTH: (field: string, max: number) => `${field} không được vượt quá ${max} ký tự`,
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_PHONE: 'Số điện thoại không hợp lệ',
  INVALID_DATE: 'Ngày không hợp lệ',
  POSITIVE_NUMBER: (field: string) => `${field} phải là số dương`,
  MIN_VALUE: (field: string, min: number) => `${field} phải lớn hơn hoặc bằng ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} phải nhỏ hơn hoặc bằng ${max}`,
  INVALID_OBJECT_ID: 'ID không hợp lệ',
  ARRAY_NOT_EMPTY: (field: string) => `${field} không được rỗng`,
  INVALID_ENUM: (field: string, values: string[]) =>
    `${field} phải là một trong: ${values.join(', ')}`,
} as const

// ==================== CONVERSATION/CHATBOT MESSAGES ====================
export const CONVERSATION_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Tạo cuộc hội thoại thành công',
  GET_SUCCESS: 'Lấy cuộc hội thoại thành công',
  GET_LIST_SUCCESS: 'Lấy danh sách cuộc hội thoại thành công',
  UPDATE_SUCCESS: 'Cập nhật cuộc hội thoại thành công',
  DELETE_SUCCESS: 'Xóa cuộc hội thoại thành công',
  SEND_MESSAGE_SUCCESS: 'Gửi tin nhắn thành công',

  // Errors
  NOT_FOUND: 'Không tìm thấy cuộc hội thoại',
  CHATBOT_ERROR: 'Lỗi khi xử lý chatbot',
  STREAMING_ERROR: 'Lỗi khi streaming response',
} as const

// ==================== UPLOAD MESSAGES ====================
export const UPLOAD_MESSAGES = {
  // Success
  UPLOAD_SUCCESS: 'Upload thành công',
  UPLOAD_AVATAR_SUCCESS: 'Upload ảnh đại diện thành công',
  UPLOAD_PRODUCT_IMAGE_SUCCESS: 'Upload ảnh sản phẩm thành công',

  // Errors
  FILE_NOT_FOUND: 'Không tìm thấy file',
  FILE_TOO_LARGE: 'File quá lớn',
  INVALID_FILE_TYPE: 'Loại file không hợp lệ',
  UPLOAD_FAILED: 'Upload thất bại',
} as const

// ==================== SECURITY MESSAGES ====================
export const SECURITY_MESSAGES = {
  RATE_LIMIT_EXCEEDED: 'Quá nhiều request, vui lòng thử lại sau',
  SUSPICIOUS_ACTIVITY: 'Phát hiện hoạt động đáng ngờ',
  INVALID_CONTENT_TYPE: 'Content-Type không hợp lệ',
  REQUEST_TOO_LARGE: 'Request quá lớn',
} as const
