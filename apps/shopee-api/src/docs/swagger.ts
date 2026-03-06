/**
 * Swagger/OpenAPI Configuration
 * Cấu hình Swagger cho API E-commerce
 */

import { swaggerSchemas } from './schemas'
import { paths } from './paths'

// Thông tin cơ bản về API
const swaggerInfo = {
  title: 'E-commerce API',
  version: '1.0.0',
  description: `
    API Backend cho hệ thống E-commerce với đầy đủ tính năng:
    - Quản lý sản phẩm và danh mục
    - Đăng ký, đăng nhập, xác thực JWT
    - Quản lý đơn hàng và giỏ hàng
    - Hệ thống đánh giá sản phẩm
    - Chatbot AI hỗ trợ khách hàng
    - Quản trị viên (Admin)
  `,
  contact: {
    name: 'API Support',
    email: 'support@ecommerce.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
}

// Cấu hình servers
const servers = [
  {
    url: 'http://localhost:4000',
    description: 'Development server',
  },
  {
    url: 'https://api-ecom.duthanhduoc.com',
    description: 'Production server',
  },
]

// Cấu hình security schemes (Bearer token)
const securitySchemes = {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Nhập access token (không cần prefix "Bearer ")',
  },
}

// Định nghĩa tags cho các nhóm API
const tags = [
  {
    name: 'Auth',
    description: 'API xác thực: đăng ký, đăng nhập, đăng xuất, refresh token',
  },
  {
    name: 'Products',
    description: 'API quản lý sản phẩm: danh sách, chi tiết, tìm kiếm',
  },
  {
    name: 'Categories',
    description: 'API quản lý danh mục sản phẩm',
  },
  {
    name: 'Purchases',
    description: 'API quản lý đơn hàng và giỏ hàng',
  },
  {
    name: 'Reviews',
    description: 'API đánh giá sản phẩm: tạo, sửa, xóa, like, comment',
  },
  {
    name: 'Conversations',
    description: 'API chatbot AI: tạo cuộc trò chuyện, gửi tin nhắn',
  },
  {
    name: 'Admin',
    description: 'API dành cho quản trị viên',
  },
  {
    name: 'User',
    description: 'API quản lý thông tin người dùng',
  },
]

// OpenAPI Specification hoàn chỉnh
export const swaggerDocument = {
  openapi: '3.0.3',
  info: swaggerInfo,
  servers,
  tags,
  paths,
  components: {
    securitySchemes,
    schemas: swaggerSchemas,
  },
}

// HTML template cho Swagger UI
export const swaggerUIHtml = (specUrl: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-commerce API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true
      });
    };
  </script>
</body>
</html>
`

