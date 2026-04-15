/**
 * Swagger Schemas
 * Định nghĩa schemas cho tất cả models trong API
 */

// Schema cho User
const UserSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'ID của user', example: '64a1b2c3d4e5f6789012345' },
    email: { type: 'string', format: 'email', description: 'Email', example: 'user@example.com' },
    name: { type: 'string', description: 'Tên người dùng', example: 'Nguyễn Văn A' },
    date_of_birth: { type: 'string', format: 'date-time', description: 'Ngày sinh (ISO 8601)' },
    address: { type: 'string', description: 'Địa chỉ', example: 'Hà Nội, Việt Nam' },
    phone: { type: 'string', description: 'Số điện thoại', example: '0901234567' },
    roles: {
      type: 'array',
      items: { type: 'string', enum: ['User', 'Admin'] },
      description: 'Vai trò của user',
      example: ['User'],
    },
    avatar: {
      type: 'string',
      description: 'URL avatar',
      example: 'https://example.com/avatar.jpg',
    },
    createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
    updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' },
  },
}

// Schema cho Product
const ProductSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'ID sản phẩm', example: '64a1b2c3d4e5f6789012345' },
    name: { type: 'string', description: 'Tên sản phẩm', example: 'Áo thun nam' },
    image: { type: 'string', description: 'Ảnh chính', example: 'https://example.com/image.jpg' },
    images: {
      type: 'array',
      items: { type: 'string' },
      description: 'Danh sách ảnh phụ',
    },
    description: { type: 'string', description: 'Mô tả sản phẩm' },
    category: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
      },
      description: 'Danh mục sản phẩm',
    },
    price: { type: 'number', description: 'Giá bán', example: 150000 },
    price_before_discount: { type: 'number', description: 'Giá gốc', example: 200000 },
    quantity: { type: 'integer', description: 'Số lượng tồn kho', example: 100 },
    sold: { type: 'integer', description: 'Số lượng đã bán', example: 50 },
    view: { type: 'integer', description: 'Lượt xem', example: 1000 },
    rating: { type: 'number', description: 'Đánh giá trung bình (1-5)', example: 4.5 },
    location: { type: 'string', description: 'Địa điểm bán', example: 'TP. Hồ Chí Minh' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

// Schema cho Category
const CategorySchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'ID danh mục', example: '64a1b2c3d4e5f6789012345' },
    name: { type: 'string', description: 'Tên danh mục', example: 'Áo thun' },
  },
}

// Schema cho Purchase
const PurchaseSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'ID đơn hàng' },
    user: { type: 'string', description: 'ID người dùng' },
    product: { $ref: '#/components/schemas/Product' },
    buy_count: { type: 'integer', description: 'Số lượng mua', example: 2 },
    price: { type: 'number', description: 'Giá tại thời điểm mua', example: 150000 },
    price_before_discount: { type: 'number', description: 'Giá gốc', example: 200000 },
    status: {
      type: 'integer',
      description:
        'Trạng thái: -1=Giỏ hàng, 1=Chờ xác nhận, 2=Chờ lấy hàng, 3=Đang giao, 4=Đã giao, 5=Đã hủy',
      enum: [-1, 1, 2, 3, 4, 5],
      example: 1,
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

// Schema cho Review
const ReviewSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'ID đánh giá' },
    user: { $ref: '#/components/schemas/User' },
    product: { type: 'string', description: 'ID sản phẩm' },
    purchase: { type: 'string', description: 'ID đơn hàng' },
    rating: { type: 'integer', minimum: 1, maximum: 5, description: 'Số sao (1-5)', example: 5 },
    comment: { type: 'string', description: 'Nội dung đánh giá', example: 'Sản phẩm rất tốt!' },
    images: { type: 'array', items: { type: 'string' }, description: 'Ảnh đánh giá' },
    helpful_count: { type: 'integer', description: 'Số lượt thấy hữu ích', example: 10 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

// Schema cho Conversation (Chatbot)
const ConversationSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'ID cuộc trò chuyện' },
    user: { type: 'string', description: 'ID người dùng' },
    title: { type: 'string', description: 'Tiêu đề', example: 'Cuộc trò chuyện mới' },
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID tin nhắn' },
          role: { type: 'string', enum: ['user', 'assistant'], description: 'Vai trò' },
          content: { type: 'string', description: 'Nội dung tin nhắn' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    status: { type: 'string', enum: ['active', 'archived'], description: 'Trạng thái' },
    lastActivity: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

// Schema cho Pagination
const PaginationSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', description: 'Trang hiện tại', example: 1 },
    limit: { type: 'integer', description: 'Số item mỗi trang', example: 10 },
    page_size: { type: 'integer', description: 'Tổng số trang', example: 5 },
  },
}

// Request Body Schemas

// Schema cho Register Request
const RegisterRequestSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Email đăng ký',
      example: 'user@example.com',
    },
    password: {
      type: 'string',
      minLength: 6,
      description: 'Mật khẩu (tối thiểu 6 ký tự)',
      example: 'password123',
    },
  },
}

// Schema cho Login Request
const LoginRequestSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Email đăng nhập',
      example: 'user@example.com',
    },
    password: { type: 'string', description: 'Mật khẩu', example: 'password123' },
  },
}

// Schema cho Refresh Token Request
const RefreshTokenRequestSchema = {
  type: 'object',
  required: ['refresh_token'],
  properties: {
    refresh_token: { type: 'string', description: 'Refresh token' },
  },
}

// Schema cho Add Product Request (Admin)
const AddProductRequestSchema = {
  type: 'object',
  required: ['name', 'image', 'price', 'quantity'],
  properties: {
    name: { type: 'string', description: 'Tên sản phẩm', example: 'Áo thun nam' },
    image: { type: 'string', description: 'URL ảnh chính' },
    images: { type: 'array', items: { type: 'string' }, description: 'Danh sách URL ảnh phụ' },
    description: { type: 'string', description: 'Mô tả sản phẩm' },
    category: { type: 'string', description: 'ID danh mục' },
    price: { type: 'number', description: 'Giá bán', example: 150000 },
    price_before_discount: { type: 'number', description: 'Giá gốc', example: 200000 },
    quantity: { type: 'integer', description: 'Số lượng', example: 100 },
    location: { type: 'string', description: 'Địa điểm bán', example: 'TP. Hồ Chí Minh' },
  },
}

// Response Schemas

// Schema cho Success Response
const SuccessResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'Thông báo thành công' },
    data: { type: 'object', description: 'Dữ liệu trả về' },
  },
}

// Schema cho Auth Response
const AuthResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Đăng nhập thành công' },
    data: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'Access token (có prefix Bearer)' },
        expires: { type: 'integer', description: 'Thời gian hết hạn access token (giây)' },
        refresh_token: { type: 'string', description: 'Refresh token' },
        expires_refresh_token: {
          type: 'integer',
          description: 'Thời gian hết hạn refresh token (giây)',
        },
        user: { $ref: '#/components/schemas/User' },
      },
    },
  },
}

// Schema cho Product List Response
const ProductListResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Lấy các sản phẩm thành công' },
    data: {
      type: 'object',
      properties: {
        products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        pagination: { $ref: '#/components/schemas/Pagination' },
      },
    },
  },
}

// Error Schemas

// Schema cho Error Response
const ErrorResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'Thông báo lỗi', example: 'Lỗi xảy ra' },
    data: {
      type: 'object',
      description: 'Chi tiết lỗi (nếu có)',
      additionalProperties: { type: 'string' },
    },
  },
}

// Schema cho Validation Error
const ValidationErrorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Lỗi validation' },
    data: {
      type: 'object',
      additionalProperties: { type: 'string' },
      example: { email: 'Email không hợp lệ', password: 'Mật khẩu phải có ít nhất 6 ký tự' },
    },
  },
}

// Schema cho Unauthorized Error
const UnauthorizedErrorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Token không hợp lệ hoặc đã hết hạn' },
  },
}

// Export tất cả schemas
export const swaggerSchemas = {
  // Models
  User: UserSchema,
  Product: ProductSchema,
  Category: CategorySchema,
  Purchase: PurchaseSchema,
  Review: ReviewSchema,
  Conversation: ConversationSchema,
  Pagination: PaginationSchema,
  // Request Bodies
  RegisterRequest: RegisterRequestSchema,
  LoginRequest: LoginRequestSchema,
  RefreshTokenRequest: RefreshTokenRequestSchema,
  AddProductRequest: AddProductRequestSchema,
  // Responses
  SuccessResponse: SuccessResponseSchema,
  AuthResponse: AuthResponseSchema,
  ProductListResponse: ProductListResponseSchema,
  // Errors
  ErrorResponse: ErrorResponseSchema,
  ValidationError: ValidationErrorSchema,
  UnauthorizedError: UnauthorizedErrorSchema,
}
