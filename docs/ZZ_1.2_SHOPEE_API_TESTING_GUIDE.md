# HƯỚNG DẪN TESTING CHO SHOPEE-API

## Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Cài Đặt và Cấu Hình](#cài-đặt-và-cấu-hình)
3. [Cấu Trúc Testing](#cấu-trúc-testing)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [E2E Testing](#e2e-testing)
7. [Socket Testing](#socket-testing)
8. [Testing Best Practices](#testing-best-practices)
9. [Coverage và CI/CD](#coverage-và-cicd)
10. [FAQ](#faq)

---

## Giới Thiệu

### Tổng Quan
Shopee-api là một RESTful API được xây dựng với Express.js và TypeScript, sử dụng MongoDB làm database. Testing framework sử dụng Jest với các công nghệ hỗ trợ:

- **Jest**: Testing framework chính
- **ts-jest**: TypeScript support cho Jest
- **Supertest**: HTTP assertions cho integration tests
- **MongoDB Memory Server**: In-memory MongoDB cho isolated testing
- **Socket.IO Client**: Testing WebSocket connections

### Mục Tiêu Testing
- Đảm bảo API endpoints hoạt động đúng với các HTTP methods
- Verify business logic trong services và repositories
- Test database operations với real MongoDB (in-memory)
- Validate authentication và authorization
- Test WebSocket events và real-time features
- Maintain code coverage > 80%

### Các Loại Tests
1. **Unit Tests**: Test controllers, services, repositories, middleware độc lập
2. **Integration Tests**: Test API endpoints với real Express app và in-memory DB
3. **E2E Tests**: Test complete user flows từ đầu đến cuối
4. **Socket Tests**: Test WebSocket handlers và events

---

## Cài Đặt và Cấu Hình

### Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.8",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16",
    "mongodb-memory-server": "^9.1.3",
    "socket.io-client": "^4.5.4"
  }
}
```

### Cài Đặt

```bash
# Cài đặt dependencies
pnpm install

# Chạy tất cả tests
pnpm test

# Chạy unit tests only
pnpm test:unit

# Chạy integration tests only
pnpm test:integration

# Chạy e2e tests only
pnpm test:e2e

# Chạy socket tests only
pnpm test:socket

# Chạy tests với coverage
pnpm test:coverage

# Chạy tests trong watch mode
pnpm test:watch
```

### Cấu Hình Jest (jest.config.js)

```javascript
const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@types/(.*)$': '<rootDir>/src/@types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@schemas/(.*)$': '<rootDir>/src/schemas/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  clearMocks: true,
  verbose: true,
}

module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts',
  ],

  projects: [
    // Unit tests
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: [
        '**/__tests__/controllers/**/*.test.ts',
        '**/__tests__/services/**/*.test.ts',
        '**/__tests__/middleware/**/*.test.ts',
        '**/__tests__/utils/**/*.test.ts',
        '**/__tests__/schemas/**/*.test.ts',
        '**/__tests__/repositories/**/*.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 10000,
    },

    // Integration tests
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/setup.ts'],
      testTimeout: 30000,
    },

    // E2E tests
    {
      ...sharedConfig,
      displayName: 'e2e',
      testMatch: ['**/__tests__/e2e/**/*.test.ts'],
      testTimeout: 60000,
    },

    // Socket tests
    {
      ...sharedConfig,
      displayName: 'socket',
      testMatch: ['**/__tests__/socket/**/*.test.ts'],
      testTimeout: 15000,
    },
  ],
}
```

**Giải thích cấu hình:**

- **projects**: Tách tests thành 4 categories riêng biệt
- **moduleNameMapper**: Path aliases mapping (@ imports)
- **testTimeout**: Timeout khác nhau cho mỗi loại test
- **setupFilesAfterEnv**: Setup files chạy trước mỗi test suite

### Cấu Hình Setup File (src/__tests__/setup.ts)

```typescript
import { Request, Response } from 'express'

// Mock MongoDB connection
jest.mock('@database/database', () => ({
  connectMongoDB: jest.fn(),
}))

// Mock config
jest.mock('@constants/config', () => ({
  config: {
    SECRET_KEY: 'test-secret-key',
    EXPIRE_ACCESS_TOKEN: 900,
    EXPIRE_REFRESH_TOKEN: 8640000,
  },
  FOLDER_UPLOAD: 'upload',
  FOLDERS: {
    PRODUCT: 'product',
    AVATAR: 'avatar',
  },
  ROUTE_IMAGE: 'images',
}))

// Mock Request helper
interface MockRequestOptions {
  body?: Record<string, unknown>
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  headers?: Record<string, string>
  jwtDecoded?: {
    id: string
    email: string
    roles: string[]
    created_at: string
  }
}

export const createMockRequest = (options: MockRequestOptions = {}): Partial<Request> => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    jwtDecoded: options.jwtDecoded,
  } as Partial<Request>
}

// Mock Response helper
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// Mock NextFunction
export const createMockNext = () => jest.fn()

// Cleanup
beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.resetAllMocks()
})
```

### Database Setup Helper (src/__tests__/helpers/db-setup.ts)

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer: MongoMemoryServer | null = null

// Start MongoMemoryServer and connect mongoose
export const connectTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
}

// Drop all collections
export const clearTestDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

// Disconnect mongoose and stop MongoMemoryServer
export const disconnectTestDB = async (): Promise<void> => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}
```

---

## Cấu Trúc Testing

### Tổ Chức Files

```
apps/shopee-api/
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── services/
│   │   └── auth.service.ts
│   ├── repositories/
│   │   └── user.repository.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   └── __tests__/
│       ├── setup.ts                      # Global setup
│       ├── helpers/
│       │   ├── db-setup.ts               # Database helpers
│       │   ├── auth-helper.ts            # Auth token helpers
│       │   └── create-test-app.ts        # Express app factory
│       ├── controllers/
│       │   └── auth.controller.test.ts   # Unit test
│       ├── services/
│       │   └── auth.service.test.ts      # Unit test
│       ├── repositories/
│       │   └── user.repository.test.ts   # Unit test
│       ├── middleware/
│       │   └── auth.middleware.test.ts   # Unit test
│       ├── integration/
│       │   ├── setup.ts                  # Integration setup
│       │   └── auth.test.ts              # Integration test
│       ├── e2e/
│       │   └── checkout-flow.test.ts     # E2E test
│       └── socket/
│           └── chat.test.ts              # Socket test
└── jest.config.js
```

### Naming Conventions

- **Unit tests**: `*.test.ts` trong `__tests__/controllers|services|repositories|middleware`
- **Integration tests**: `*.test.ts` trong `__tests__/integration`
- **E2E tests**: `*.test.ts` trong `__tests__/e2e`
- **Socket tests**: `*.test.ts` trong `__tests__/socket`
- **Helpers**: `*-helper.ts` hoặc `*-setup.ts`

---

## Unit Testing

### Testing Controllers

Controllers handle HTTP requests và responses. Unit tests verify controller logic với mocked services.

```typescript
// src/__tests__/controllers/auth.controller.test.ts
import { authController } from '@controllers/auth.controller'
import { authService } from '@services/auth.service'
import { createMockRequest, createMockResponse, createMockNext } from '../setup'

// Mock service
jest.mock('@services/auth.service')

describe('Auth Controller', () => {
  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-1',
        email: 'test@shopee.vn',
        name: 'Test User',
        roles: ['User']
      }

      const mockTokens = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      }

      ;(authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        ...mockTokens
      })

      const req = createMockRequest({
        body: {
          email: 'test@shopee.vn',
          password: 'password123'
        }
      })
      const res = createMockResponse()
      const next = createMockNext()

      // Act
      await authController.login(req as any, res as any, next)

      // Assert
      expect(authService.login).toHaveBeenCalledWith('test@shopee.vn', 'password123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Đăng nhập thành công',
        data: {
          user: mockUser,
          access_token: mockTokens.access_token,
          refresh_token: mockTokens.refresh_token
        }
      })
    })

    it('should return 401 when credentials are invalid', async () => {
      // Arrange
      ;(authService.login as jest.Mock).mockRejectedValue(
        new Error('Email hoặc mật khẩu không đúng')
      )

      const req = createMockRequest({
        body: {
          email: 'wrong@shopee.vn',
          password: 'wrongpassword'
        }
      })
      const res = createMockResponse()
      const next = createMockNext()

      // Act
      await authController.login(req as any, res as any, next)

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('register', () => {
    it('should create new user and return tokens', async () => {
      // Arrange
      const mockNewUser = {
        _id: 'new-user-1',
        email: 'newuser@shopee.vn',
        name: 'New User',
        roles: ['User']
      }

      ;(authService.register as jest.Mock).mockResolvedValue({
        user: mockNewUser,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      })

      const req = createMockRequest({
        body: {
          email: 'newuser@shopee.vn',
          password: 'password123',
          name: 'New User'
        }
      })
      const res = createMockResponse()
      const next = createMockNext()

      // Act
      await authController.register(req as any, res as any, next)

      // Assert
      expect(authService.register).toHaveBeenCalledWith({
        email: 'newuser@shopee.vn',
        password: 'password123',
        name: 'New User'
      })
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })
})
```

### Testing Services

Services contain business logic. Unit tests verify service methods với mocked repositories.

```typescript
// src/__tests__/services/auth.service.test.ts
import { authService } from '@services/auth.service'
import { userRepository } from '@repositories/user.repository'
import { hashPassword, comparePassword } from '@utils/crypto'
import { signToken } from '@utils/jwt'

// Mock dependencies
jest.mock('@repositories/user.repository')
jest.mock('@utils/crypto')
jest.mock('@utils/jwt')

describe('Auth Service', () => {
  describe('login', () => {
    it('should return user and tokens when credentials are valid', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-1',
        email: 'test@shopee.vn',
        password: 'hashed-password',
        name: 'Test User',
        roles: ['User']
      }

      ;(userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser)
      ;(comparePassword as jest.Mock).mockResolvedValue(true)
      ;(signToken as jest.Mock).mockReturnValue('mock-token')

      // Act
      const result = await authService.login('test@shopee.vn', 'password123')

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@shopee.vn')
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed-password')
      expect(signToken).toHaveBeenCalledTimes(2) // access + refresh tokens
      expect(result).toEqual({
        user: expect.objectContaining({
          _id: 'user-1',
          email: 'test@shopee.vn'
        }),
        access_token: 'mock-token',
        refresh_token: 'mock-token'
      })
    })

    it('should throw error when user not found', async () => {
      // Arrange
      ;(userRepository.findByEmail as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(authService.login('notfound@shopee.vn', 'password123'))
        .rejects
        .toThrow('Email hoặc mật khẩu không đúng')
    })

    it('should throw error when password is incorrect', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-1',
        email: 'test@shopee.vn',
        password: 'hashed-password'
      }

      ;(userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser)
      ;(comparePassword as jest.Mock).mockResolvedValue(false)

      // Act & Assert
      await expect(authService.login('test@shopee.vn', 'wrongpassword'))
        .rejects
        .toThrow('Email hoặc mật khẩu không đúng')
    })
  })

  describe('register', () => {
    it('should create new user with hashed password', async () => {
      // Arrange
      ;(userRepository.findByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
      ;(userRepository.create as jest.Mock).mockResolvedValue({
        _id: 'new-user-1',
        email: 'newuser@shopee.vn',
        name: 'New User',
        roles: ['User']
      })
      ;(signToken as jest.Mock).mockReturnValue('mock-token')

      // Act
      const result = await authService.register({
        email: 'newuser@shopee.vn',
        password: 'password123',
        name: 'New User'
      })

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('password123')
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'newuser@shopee.vn',
        password: 'hashed-password',
        name: 'New User',
        roles: ['User']
      })
      expect(result.user.email).toBe('newuser@shopee.vn')
    })

    it('should throw error when email already exists', async () => {
      // Arrange
      ;(userRepository.findByEmail as jest.Mock).mockResolvedValue({
        _id: 'existing-user',
        email: 'existing@shopee.vn'
      })

      // Act & Assert
      await expect(authService.register({
        email: 'existing@shopee.vn',
        password: 'password123',
        name: 'Test'
      })).rejects.toThrow('Email đã tồn tại')
    })
  })
})
```

### Testing Repositories

Repositories handle database operations. Unit tests verify repository methods với mocked Mongoose models.

```typescript
// src/__tests__/repositories/user.repository.test.ts
import { userRepository } from '@repositories/user.repository'
import { User } from '@database/models/user.model'

// Mock Mongoose model
jest.mock('@database/models/user.model')

describe('User Repository', () => {
  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-1',
        email: 'test@shopee.vn',
        name: 'Test User'
      }

      ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)

      // Act
      const result = await userRepository.findByEmail('test@shopee.vn')

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@shopee.vn' })
      expect(result).toEqual(mockUser)
    })

    it('should return null when email does not exist', async () => {
      // Arrange
      ;(User.findOne as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await userRepository.findByEmail('notfound@shopee.vn')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create and return new user', async () => {
      // Arrange
      const userData = {
        email: 'newuser@shopee.vn',
        password: 'hashed-password',
        name: 'New User',
        roles: ['User']
      }

      const mockCreatedUser = {
        _id: 'new-user-1',
        ...userData,
        save: jest.fn().mockResolvedValue(true)
      }

      ;(User as any).mockImplementation(() => mockCreatedUser)

      // Act
      const result = await userRepository.create(userData)

      // Assert
      expect(result).toEqual(expect.objectContaining({
        email: 'newuser@shopee.vn',
        name: 'New User'
      }))
    })
  })

  describe('findById', () => {
    it('should return user when id exists', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-1',
        email: 'test@shopee.vn'
      }

      ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

      // Act
      const result = await userRepository.findById('user-1')

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user-1')
      expect(result).toEqual(mockUser)
    })
  })

  describe('update', () => {
    it('should update and return updated user', async () => {
      // Arrange
      const updateData = { name: 'Updated Name' }
      const mockUpdatedUser = {
        _id: 'user-1',
        email: 'test@shopee.vn',
        name: 'Updated Name'
      }

      ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser)

      // Act
      const result = await userRepository.update('user-1', updateData)

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        updateData,
        { new: true }
      )
      expect(result.name).toBe('Updated Name')
    })
  })
})
```

### Testing Middleware

```typescript
// src/__tests__/middleware/auth.middleware.test.ts
import { authMiddleware } from '@middleware/auth.middleware'
import { verifyToken } from '@utils/jwt'
import { createMockRequest, createMockResponse, createMockNext } from '../setup'

jest.mock('@utils/jwt')

describe('Auth Middleware', () => {
  it('should call next() when token is valid', async () => {
    // Arrange
    const mockDecoded = {
      id: 'user-1',
      email: 'test@shopee.vn',
      roles: ['User']
    }

    ;(verifyToken as jest.Mock).mockReturnValue(mockDecoded)

    const req = createMockRequest({
      headers: {
        authorization: 'Bearer valid-token'
      }
    })
    const res = createMockResponse()
    const next = createMockNext()

    // Act
    await authMiddleware(req as any, res as any, next)

    // Assert
    expect(verifyToken).toHaveBeenCalledWith('valid-token')
    expect(req.jwtDecoded).toEqual(mockDecoded)
    expect(next).toHaveBeenCalled()
  })

  it('should return 401 when token is missing', async () => {
    // Arrange
    const req = createMockRequest({
      headers: {}
    })
    const res = createMockResponse()
    const next = createMockNext()

    // Act
    await authMiddleware(req as any, res as any, next)

    // Assert
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized'
    })
  })

  it('should return 401 when token is invalid', async () => {
    // Arrange
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const req = createMockRequest({
      headers: {
        authorization: 'Bearer invalid-token'
      }
    })
    const res = createMockResponse()
    const next = createMockNext()

    // Act
    await authMiddleware(req as any, res as any, next)

    // Assert
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
```

---


## Integration Testing

Integration tests verify API endpoints với real Express app và in-memory MongoDB.

### Setup Integration Tests

```typescript
// src/__tests__/integration/setup.ts
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'

beforeAll(async () => {
  await connectTestDB()
})

beforeEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
})
```

### Testing Auth Endpoints

```typescript
// src/__tests__/integration/auth.test.ts
import request from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { User } from '@database/models/user.model'

const app = createTestApp()

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@shopee.vn',
          password: 'password123',
          name: 'New User'
        })

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('access_token')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@shopee.vn',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('access_token')
    })
  })
})
```

---

## E2E Testing

E2E tests verify complete user flows.

```typescript
// src/__tests__/e2e/checkout-flow.test.ts
import request from 'supertest'
import { createTestApp } from '../helpers/create-test-app'

const app = createTestApp()

describe('Checkout Flow E2E', () => {
  it('should complete full checkout flow', async () => {
    // Step 1: Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'buyer@shopee.vn',
        password: 'password123'
      })

    const accessToken = loginResponse.body.data.access_token

    // Step 2: Add to cart
    const addToCartResponse = await request(app)
      .post('/api/purchases/add-to-cart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        product_id: 'product-1',
        buy_count: 2
      })

    expect(addToCartResponse.status).toBe(200)
  })
})
```

---

## Socket Testing

Testing WebSocket connections.

```typescript
// src/__tests__/socket/chat.test.ts
import { io as ioClient, Socket } from 'socket.io-client'

describe('Chat Socket Tests', () => {
  let clientSocket: Socket

  it('should emit message to room', (done) => {
    clientSocket.emit('send-message', {
      room: 'room-1',
      message: 'Hello'
    })

    clientSocket.on('receive-message', (data) => {
      expect(data.message).toBe('Hello')
      done()
    })
  })
})
```

---

## Testing Best Practices

### 1. AAA Pattern

```typescript
it('should create product', async () => {
  // Arrange
  const productData = { name: 'Test', price: 100000 }

  // Act
  const response = await request(app)
    .post('/api/products')
    .send(productData)

  // Assert
  expect(response.status).toBe(201)
})
```

### 2. Test Isolation

```typescript
beforeEach(async () => {
  await clearTestDB()
  jest.clearAllMocks()
})
```

---

## Coverage và CI/CD

### Chạy Coverage

```bash
pnpm test:coverage
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test API

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: pnpm test:coverage
```

---

## FAQ

### 1. Tại sao tests chạy chậm?

Sử dụng MongoDB Memory Server và increase testTimeout.

### 2. Làm sao debug tests?

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 3. Làm sao test file uploads?

```typescript
await request(app)
  .post('/api/upload')
  .attach('image', Buffer.from('data'), 'file.jpg')
```

---

## Kết Luận

Testing là quan trọng cho API development. Với Jest, Supertest, và MongoDB Memory Server, chúng ta có thể viết tests reliable và maintainable.

**Key Takeaways:**
- Sử dụng Jest cho unit, integration, e2e tests
- Sử dụng Supertest để test HTTP endpoints
- Sử dụng MongoDB Memory Server cho isolated testing
- Maintain high coverage (80%+)

**Resources:**
- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**Tác giả:** Shopee Development Team  
**Ngày cập nhật:** 2026-03-21  
**Version:** 1.0.0
