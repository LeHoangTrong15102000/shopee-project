/**
 * Products API Paths
 * Documentation cho các endpoint sản phẩm
 */

export const productsPaths = {
  // GET /products - Lấy danh sách sản phẩm
  '/products': {
    get: {
      tags: ['Products'],
      summary: 'Lấy danh sách sản phẩm',
      description:
        'Lấy danh sách sản phẩm với phân trang, lọc theo danh mục, sắp xếp theo giá/rating/sold.',
      operationId: 'getProducts',
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Số trang (mặc định: 1)',
          schema: { type: 'integer', default: 1, minimum: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Số sản phẩm mỗi trang (mặc định: 10)',
          schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
        },
        {
          name: 'category',
          in: 'query',
          description: 'ID danh mục để lọc',
          schema: { type: 'string' },
        },
        {
          name: 'exclude',
          in: 'query',
          description: 'ID sản phẩm cần loại trừ',
          schema: { type: 'string' },
        },
        {
          name: 'sort_by',
          in: 'query',
          description: 'Sắp xếp theo trường',
          schema: { type: 'string', enum: ['createdAt', 'view', 'sold', 'price'] },
        },
        {
          name: 'order',
          in: 'query',
          description: 'Thứ tự sắp xếp',
          schema: { type: 'string', enum: ['asc', 'desc'] },
        },
        {
          name: 'rating_filter',
          in: 'query',
          description: 'Lọc theo rating tối thiểu',
          schema: { type: 'integer', minimum: 1, maximum: 5 },
        },
        {
          name: 'price_min',
          in: 'query',
          description: 'Giá tối thiểu',
          schema: { type: 'number' },
        },
        {
          name: 'price_max',
          in: 'query',
          description: 'Giá tối đa',
          schema: { type: 'number' },
        },
        {
          name: 'name',
          in: 'query',
          description: 'Tìm kiếm theo tên sản phẩm',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Lấy danh sách sản phẩm thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductListResponse' },
            },
          },
        },
      },
    },
  },

  // GET /products/{id} - Lấy chi tiết sản phẩm
  '/products/{product_id}': {
    get: {
      tags: ['Products'],
      summary: 'Lấy chi tiết sản phẩm',
      description: 'Lấy thông tin chi tiết của một sản phẩm theo ID.',
      operationId: 'getProduct',
      parameters: [
        {
          name: 'product_id',
          in: 'path',
          required: true,
          description: 'ID của sản phẩm',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Lấy sản phẩm thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Lấy sản phẩm thành công' },
                  data: { $ref: '#/components/schemas/Product' },
                },
              },
            },
          },
        },
        '404': {
          description: 'Không tìm thấy sản phẩm',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { message: 'Không tìm thấy sản phẩm' },
            },
          },
        },
      },
    },
  },

  // Admin endpoints
  // POST /admin/products - Tạo sản phẩm mới (Admin)
  '/admin/products': {
    post: {
      tags: ['Admin', 'Products'],
      summary: 'Tạo sản phẩm mới (Admin)',
      description: 'Tạo sản phẩm mới. Yêu cầu quyền Admin.',
      operationId: 'addProduct',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AddProductRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Tạo sản phẩm thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Tạo sản phẩm thành công' },
                  data: { $ref: '#/components/schemas/Product' },
                },
              },
            },
          },
        },
        '401': {
          description: 'Chưa xác thực',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UnauthorizedError' } },
          },
        },
        '403': {
          description: 'Không có quyền Admin',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        '422': {
          description: 'Dữ liệu không hợp lệ',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } },
          },
        },
      },
    },
  },

  // PUT /admin/products/{id} - Cập nhật sản phẩm (Admin)
  '/admin/products/{product_id}': {
    put: {
      tags: ['Admin', 'Products'],
      summary: 'Cập nhật sản phẩm (Admin)',
      description: 'Cập nhật thông tin sản phẩm. Yêu cầu quyền Admin.',
      operationId: 'updateProduct',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'product_id',
          in: 'path',
          required: true,
          description: 'ID của sản phẩm cần cập nhật',
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AddProductRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Cập nhật sản phẩm thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Cập nhật sản phẩm thành công' },
                  data: { $ref: '#/components/schemas/Product' },
                },
              },
            },
          },
        },
        '401': {
          description: 'Chưa xác thực',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UnauthorizedError' } },
          },
        },
        '403': {
          description: 'Không có quyền Admin',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        '404': {
          description: 'Không tìm thấy sản phẩm',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        '422': {
          description: 'Dữ liệu không hợp lệ',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } },
          },
        },
      },
    },
    delete: {
      tags: ['Admin', 'Products'],
      summary: 'Xóa sản phẩm (Admin)',
      description: 'Xóa một sản phẩm theo ID. Yêu cầu quyền Admin.',
      operationId: 'deleteProduct',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'product_id',
          in: 'path',
          required: true,
          description: 'ID của sản phẩm cần xóa',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Xóa sản phẩm thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Xóa sản phẩm thành công' },
                },
              },
            },
          },
        },
        '401': {
          description: 'Chưa xác thực',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UnauthorizedError' } },
          },
        },
        '403': {
          description: 'Không có quyền Admin',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        '404': {
          description: 'Không tìm thấy sản phẩm',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
    },
  },
}
