/**
 * Auth API Paths
 * Documentation cho các endpoint xác thực
 */

export const authPaths = {
  // POST /register - Đăng ký tài khoản mới
  '/register': {
    post: {
      tags: ['Auth'],
      summary: 'Đăng ký tài khoản mới',
      description: 'Tạo tài khoản người dùng mới với email và password. Trả về access token và refresh token.',
      operationId: 'register',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
            example: {
              email: 'user@example.com',
              password: 'password123',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Đăng ký thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
              example: {
                message: 'Đăng ký thành công',
                data: {
                  access_token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  expires: 86400,
                  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  expires_refresh_token: 604800,
                  user: {
                    _id: '64a1b2c3d4e5f6789012345',
                    email: 'user@example.com',
                    roles: ['User'],
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z',
                  },
                },
              },
            },
          },
        },
        '422': {
          description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
              example: {
                message: 'Lỗi',
                data: { email: 'Email đã tồn tại' },
              },
            },
          },
        },
      },
    },
  },

  // POST /login - Đăng nhập
  '/login': {
    post: {
      tags: ['Auth'],
      summary: 'Đăng nhập',
      description: 'Đăng nhập với email và password. Trả về access token và refresh token.',
      operationId: 'login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            example: {
              email: 'user@example.com',
              password: 'password123',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Đăng nhập thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
              example: {
                message: 'Đăng nhập thành công',
                data: {
                  access_token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  expires: 86400,
                  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  expires_refresh_token: 604800,
                  user: {
                    _id: '64a1b2c3d4e5f6789012345',
                    email: 'user@example.com',
                    name: 'Nguyễn Văn A',
                    roles: ['User'],
                  },
                },
              },
            },
          },
        },
        '422': {
          description: 'Email hoặc password không đúng',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
              example: {
                message: 'Lỗi',
                data: { password: 'Email hoặc password không đúng' },
              },
            },
          },
        },
      },
    },
  },

  // POST /logout - Đăng xuất
  '/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Đăng xuất',
      description: 'Đăng xuất và xóa access token hiện tại. Yêu cầu Bearer token trong header.',
      operationId: 'logout',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Đăng xuất thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
              example: { message: 'Đăng xuất thành công' },
            },
          },
        },
        '401': {
          description: 'Token không hợp lệ hoặc đã hết hạn',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnauthorizedError' },
            },
          },
        },
      },
    },
  },

  // POST /refresh-access-token - Làm mới access token
  '/refresh-access-token': {
    post: {
      tags: ['Auth'],
      summary: 'Làm mới access token',
      description: 'Sử dụng refresh token để lấy access token mới khi access token cũ hết hạn.',
      operationId: 'refreshToken',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            example: { refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Refresh token thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Refresh Token thành công' },
                  data: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Refresh token không hợp lệ hoặc đã hết hạn',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnauthorizedError' },
              example: { message: 'Refresh Token không tồn tại' },
            },
          },
        },
      },
    },
  },
}

