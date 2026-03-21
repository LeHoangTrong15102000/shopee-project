# HƯỚNG DẪN TESTING CHO SHOPEE-WEB

## Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Cài Đặt và Cấu Hình](#cài-đặt-và-cấu-hình)
3. [Cấu Trúc Testing](#cấu-trúc-testing)
4. [Testing Components](#testing-components)
5. [Testing Hooks](#testing-hooks)
6. [Testing Utils và Helpers](#testing-utils-và-helpers)
7. [Integration Testing](#integration-testing)
8. [Mock Service Worker (MSW)](#mock-service-worker-msw)
9. [Testing i18n](#testing-i18n)
10. [Coverage và CI/CD](#coverage-và-cicd)
11. [Best Practices](#best-practices)
12. [FAQ](#faq)

---

## Giới Thiệu

### Tổng Quan
Shopee-web là một ứng dụng React được xây dựng với Vite, sử dụng các công nghệ hiện đại như:
- **Vite**: Build tool và dev server
- **Vitest**: Testing framework (tương thích với Jest API)
- **React Testing Library**: Testing library cho React components
- **MSW (Mock Service Worker)**: API mocking
- **jsdom**: DOM environment cho tests

### Mục Tiêu Testing
- Đảm bảo components hoạt động đúng với các props và states khác nhau
- Kiểm tra user interactions và event handling
- Verify API integration với mocked responses
- Maintain code coverage > 80%
- Prevent regressions khi refactor code

### Các Loại Tests
1. **Unit Tests**: Test các functions, hooks, utilities độc lập
2. **Component Tests**: Test React components với RTL
3. **Integration Tests**: Test tương tác giữa nhiều components/modules
4. **E2E Tests**: Test user flows hoàn chỉnh (sử dụng Playwright - nếu có)

---

## Cài Đặt và Cấu Hình

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "msw": "^2.7.0"
  }
}
```

### Cài Đặt

```bash
# Cài đặt dependencies
pnpm install

# Chạy tests
pnpm test

# Chạy tests với UI
pnpm test:ui

# Chạy tests với coverage
pnpm test:coverage
```

### Cấu Hình Vitest (vite.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  const baseConfig = {
    plugins: [react()],
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
        '@shopee/shared-types': path.resolve(__dirname, '../../libs/shared-types/src'),
        '@shopee/shared-utils': path.resolve(__dirname, '../../libs/shared-utils/src'),
        '@shopee/shared-constants': path.resolve(__dirname, '../../libs/shared-constants/src'),
      }
    }
  }

  if (isTest) {
    return {
      ...baseConfig,
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        css: true,
        testTimeout: 60000,
        hookTimeout: 60000,
        pool: 'forks',
        maxWorkers: process.env.CI ? 1 : 2,
        execArgv: ['--max-old-space-size=8192'],
        include: [
          'src/**/*.test.{ts,tsx}',
          'test/**/*.test.{ts,tsx}'
        ],
        reporters: ['default', 'junit'],
        outputFile: {
          junit: './test-results/junit-report.xml'
        },
        coverage: {
          provider: 'v8',
          reporter: ['json', 'json-summary', 'text-summary'],
          reportsDirectory: './coverage',
          include: ['src/**/*.{ts,tsx}'],
          exclude: [
            'src/**/*.test.{ts,tsx}',
            'src/msw/**',
            'src/types/**',
            'src/locales/**'
          ],
          thresholds: {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80
          }
        }
      }
    }
  }

  return baseConfig
})
```

**Giải thích cấu hình:**

- `globals: true`: Cho phép sử dụng `describe`, `it`, `expect` mà không cần import
- `environment: 'jsdom'`: Sử dụng jsdom để simulate browser environment
- `setupFiles`: File setup chạy trước mỗi test suite
- `pool: 'forks'`: Chạy tests trong separate processes (tránh memory leaks)
- `maxWorkers`: Giới hạn số workers (CI: 1, local: 2)
- `execArgv`: Tăng heap memory cho worker processes
- `coverage.thresholds`: Yêu cầu coverage tối thiểu 80%

### Cấu Hình Setup File (vitest.setup.js)

```javascript
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Import MSW handlers
import authRequests from './src/msw/auth.msw'
import productRequests from './src/msw/product.msw'
import userRequests from './src/msw/user.msw'
import cartRequests from './src/msw/cart.msw'

// Setup MSW server
const server = setupServer(
  ...authRequests,
  ...productRequests,
  ...userRequests,
  ...cartRequests
)

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value?.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
  takeRecords() { return [] }
}

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'vi'
    }
  }),
  Trans: ({ children }) => children
}))

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})
```

**Giải thích setup:**

- **MSW Server**: Mock tất cả API requests
- **localStorage Mock**: Simulate browser storage
- **matchMedia Mock**: Required cho responsive hooks
- **IntersectionObserver Mock**: Required cho lazy loading components
- **i18next Mock**: Mock translation function
- **cleanup()**: Clean up DOM sau mỗi test
- **resetHandlers()**: Reset MSW handlers về default state

---

## Cấu Trúc Testing

### Tổ Chức Files

```
apps/shopee-web/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx          # Component test
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useDebounce.test.tsx         # Hook test
│   ├── utils/
│   │   ├── http.ts
│   │   ├── http.test.ts                 # Utility test
│   │   └── testUtils.tsx                # Test helpers
│   ├── msw/
│   │   ├── auth.msw.ts                  # MSW handlers
│   │   ├── product.msw.ts
│   │   └── cart.msw.ts
│   └── pages/
│       └── ProductDetail/
│           ├── ProductDetail.tsx
│           └── ProductDetail.test.tsx   # Page test
├── test/
│   └── integration/
│       ├── navigation.test.tsx          # Integration test
│       └── search-filter.test.tsx
└── vitest.setup.js
```

### Naming Conventions

- **Unit tests**: `*.test.ts` hoặc `*.test.tsx`
- **Integration tests**: `test/integration/*.test.tsx`
- **MSW handlers**: `*.msw.ts`
- **Test utilities**: `testUtils.tsx`

### Test File Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear storage, etc.
  })

  // Test cases
  describe('rendering', () => {
    it('should render correctly with default props', () => {
      // Arrange
      render(<ComponentName />)

      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('should handle click event', async () => {
      // Arrange
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<ComponentName onClick={handleClick} />)

      // Act
      await user.click(screen.getByRole('button'))

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('API integration', () => {
    it('should fetch and display data', async () => {
      // Arrange
      render(<ComponentName />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Data from API')).toBeInTheDocument()
      })
    })
  })
})
```

---

## Testing Components

### Basic Component Test

```typescript
// src/components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})
```

### Component với Props phức tạp

```typescript
// src/components/ProductCard/ProductCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'
import { createMockProduct } from 'src/utils/testUtils'

describe('ProductCard Component', () => {
  const mockProduct = createMockProduct({
    name: 'Áo thun nam',
    price: 250000,
    price_before_discount: 350000,
    rating: 4.5,
    sold: 1500
  })

  it('displays product information correctly', () => {
    render(<ProductCard product={mockProduct} />)

    expect(screen.getByText('Áo thun nam')).toBeInTheDocument()
    expect(screen.getByText('₫250.000')).toBeInTheDocument()
    expect(screen.getByText('₫350.000')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('Đã bán 1500')).toBeInTheDocument()
  })

  it('calculates discount percentage correctly', () => {
    render(<ProductCard product={mockProduct} />)

    // (350000 - 250000) / 350000 * 100 = 28.57%
    expect(screen.getByText('-29%')).toBeInTheDocument()
  })

  it('renders product image with correct src', () => {
    render(<ProductCard product={mockProduct} />)

    const image = screen.getByRole('img', { name: mockProduct.name })
    expect(image).toHaveAttribute('src', mockProduct.image)
  })
})
```

### Component với Context

```typescript
// src/components/UserProfile/UserProfile.test.tsx
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from 'src/utils/testUtils'
import { screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'
import { AppContext } from 'src/contexts/app.context'

describe('UserProfile Component', () => {
  it('displays user information when authenticated', () => {
    const mockUser = {
      _id: 'user-1',
      email: 'test@shopee.vn',
      name: 'Nguyễn Văn Test',
      avatar: 'https://example.com/avatar.jpg'
    }

    renderWithProviders(
      <AppContext.Provider value={{ isAuthenticated: true, profile: mockUser }}>
        <UserProfile />
      </AppContext.Provider>
    )

    expect(screen.getByText('Nguyễn Văn Test')).toBeInTheDocument()
    expect(screen.getByText('test@shopee.vn')).toBeInTheDocument()
  })

  it('shows login prompt when not authenticated', () => {
    renderWithProviders(
      <AppContext.Provider value={{ isAuthenticated: false, profile: null }}>
        <UserProfile />
      </AppContext.Provider>
    )

    expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
  })
})
```

### Component với API Calls

```typescript
// src/components/ProductList/ProductList.test.tsx
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from 'src/utils/testUtils'
import { screen, waitFor } from '@testing-library/react'
import { ProductList } from './ProductList'

describe('ProductList Component', () => {
  it('displays loading state initially', () => {
    renderWithProviders(<ProductList />)
    expect(screen.getByText('Đang tải...')).toBeInTheDocument()
  })

  it('displays products after successful fetch', async () => {
    renderWithProviders(<ProductList />)

    await waitFor(() => {
      expect(screen.getByText('Áo thun nam')).toBeInTheDocument()
      expect(screen.getByText('Quần jean nữ')).toBeInTheDocument()
    })
  })

  it('displays error message when fetch fails', async () => {
    // Override MSW handler to return error
    const { server } = await import('vitest.setup')
    server.use(
      http.get('*/products', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      })
    )

    renderWithProviders(<ProductList />)

    await waitFor(() => {
      expect(screen.getByText('Có lỗi xảy ra')).toBeInTheDocument()
    })
  })
})
```

---

## Testing Hooks

### Basic Hook Test

```typescript
// src/hooks/useDebounce.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // Still old value

    // Fast-forward time
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })

  it('cancels previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })
    vi.advanceTimersByTime(300)

    rerender({ value: 'third' })
    vi.advanceTimersByTime(300)

    expect(result.current).toBe('first')

    vi.advanceTimersByTime(200)

    await waitFor(() => {
      expect(result.current).toBe('third')
    })
  })
})
```

### Hook với API Calls

```typescript
// src/hooks/useProduct.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProduct } from './useProduct'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useProduct Hook', () => {
  it('fetches product data successfully', async () => {
    const { result } = renderHook(() => useProduct('product-1'), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      _id: 'product-1',
      name: 'Áo thun nam',
      price: 250000
    })
  })

  it('handles error when product not found', async () => {
    const { result } = renderHook(() => useProduct('invalid-id'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
```

---

## Testing Utils và Helpers

### Testing Utility Functions

```typescript
// src/utils/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, calculateDiscount } from './format'

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('formats number to Vietnamese currency', () => {
      expect(formatCurrency(250000)).toBe('₫250.000')
      expect(formatCurrency(1000000)).toBe('₫1.000.000')
      expect(formatCurrency(0)).toBe('₫0')
    })

    it('handles decimal numbers', () => {
      expect(formatCurrency(250000.5)).toBe('₫250.001')
    })
  })

  describe('formatDate', () => {
    it('formats ISO date to Vietnamese format', () => {
      const date = '2024-01-15T10:30:00.000Z'
      expect(formatDate(date)).toBe('15/01/2024')
    })

    it('handles invalid date', () => {
      expect(formatDate('invalid')).toBe('Invalid Date')
    })
  })

  describe('calculateDiscount', () => {
    it('calculates discount percentage correctly', () => {
      expect(calculateDiscount(350000, 250000)).toBe(29)
      expect(calculateDiscount(100000, 80000)).toBe(20)
    })

    it('returns 0 when no discount', () => {
      expect(calculateDiscount(100000, 100000)).toBe(0)
    })

    it('handles edge cases', () => {
      expect(calculateDiscount(0, 0)).toBe(0)
      expect(calculateDiscount(100, 0)).toBe(100)
    })
  })
})
```

### Testing HTTP Client

```typescript
// src/utils/http.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http } from './http'
import axios from 'axios'

vi.mock('axios')

describe('HTTP Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds authorization header when token exists', async () => {
    localStorage.setItem('access_token', 'test-token')

    await http.get('/api/user/profile')

    expect(axios.get).toHaveBeenCalledWith(
      '/api/user/profile',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    )
  })

  it('refreshes token on 401 error', async () => {
    const mockRefreshToken = vi.fn().mockResolvedValue({
      data: { access_token: 'new-token' }
    })

    axios.post.mockImplementation(mockRefreshToken)
    axios.get.mockRejectedValueOnce({ response: { status: 401 } })

    await http.get('/api/user/profile')

    expect(mockRefreshToken).toHaveBeenCalledWith('/api/auth/refresh-token')
  })
})
```

---

## Integration Testing

### Testing Navigation Flow

```typescript
// test/integration/navigation.test.tsx
import { describe, it, expect } from 'vitest'
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Navigation Integration', () => {
  it('navigates from home to product detail', async () => {
    const { user } = renderWithRouter({ route: '/' })

    await waitForPageLoad('/')

    // Click on first product
    const productLink = screen.getByRole('link', { name: /Áo thun nam/i })
    await user.click(productLink)

    await waitForPageLoad('/product/product-1')

    expect(screen.getByRole('heading', { name: 'Áo thun nam' })).toBeInTheDocument()
  })

  it('navigates to cart and checkout', async () => {
    const { user } = renderWithRouter({ route: '/product/product-1' })

    await waitForPageLoad()

    // Add to cart
    const addToCartButton = screen.getByRole('button', { name: 'Thêm vào giỏ hàng' })
    await user.click(addToCartButton)

    // Navigate to cart
    const cartLink = screen.getByRole('link', { name: /Giỏ hàng/i })
    await user.click(cartLink)

    await waitForPageLoad('/cart')

    expect(screen.getByText('Giỏ hàng của bạn')).toBeInTheDocument()
  })
})
```

### Testing Search and Filter

```typescript
// test/integration/search-filter.test.tsx
import { describe, it, expect } from 'vitest'
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Search and Filter Integration', () => {
  it('searches for products and displays results', async () => {
    const { user } = renderWithRouter({ route: '/' })

    await waitForPageLoad()

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm')
    await user.type(searchInput, 'áo thun')

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('Áo thun nam')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('filters products by category', async () => {
    const { user } = renderWithRouter({ route: '/products' })

    await waitForPageLoad()

    // Select category
    const categoryFilter = screen.getByRole('button', { name: 'Thời trang nam' })
    await user.click(categoryFilter)

    await waitFor(() => {
      const products = screen.getAllByTestId('product-card')
      expect(products.length).toBeGreaterThan(0)
    })
  })

  it('filters products by price range', async () => {
    const { user } = renderWithRouter({ route: '/products' })

    await waitForPageLoad()

    // Set price range
    const minPriceInput = screen.getByLabelText('Giá tối thiểu')
    const maxPriceInput = screen.getByLabelText('Giá tối đa')

    await user.clear(minPriceInput)
    await user.type(minPriceInput, '100000')

    await user.clear(maxPriceInput)
    await user.type(maxPriceInput, '500000')

    const applyButton = screen.getByRole('button', { name: 'Áp dụng' })
    await user.click(applyButton)

    await waitFor(() => {
      const prices = screen.getAllByTestId('product-price')
      prices.forEach(price => {
        const value = parseInt(price.textContent.replace(/\D/g, ''))
        expect(value).toBeGreaterThanOrEqual(100000)
        expect(value).toBeLessThanOrEqual(500000)
      })
    })
  })
})
```

### Testing Authentication Flow

```typescript
// test/integration/auth.test.tsx
import { describe, it, expect } from 'vitest'
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Authentication Integration', () => {
  it('logs in successfully with valid credentials', async () => {
    const { user } = renderWithRouter({ route: '/login' })

    await waitForPageLoad()

    // Fill in login form
    await user.type(screen.getByLabelText('Email'), 'test@shopee.vn')
    await user.type(screen.getByLabelText('Mật khẩu'), 'password123')

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    // Wait for redirect to home
    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })

    // Verify user is logged in
    expect(screen.getByText('Nguyễn Văn Test')).toBeInTheDocument()
  })

  it('shows error message with invalid credentials', async () => {
    const { user } = renderWithRouter({ route: '/login' })

    await waitForPageLoad()

    await user.type(screen.getByLabelText('Email'), 'wrong@shopee.vn')
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrongpassword')

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu không đúng')).toBeInTheDocument()
    })
  })

  it('redirects to login when accessing protected route', async () => {
    renderWithRouter({ route: '/user/profile' })

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
    })
  })
})
```

---


## Mock Service Worker (MSW)

### Giới Thiệu MSW

MSW (Mock Service Worker) là một công cụ mạnh mẽ để mock API requests ở network level. Thay vì mock axios hoặc fetch directly, MSW intercept requests ở service worker layer, giúp tests gần với production hơn.

**Ưu điểm:**
- Mock ở network level, không cần mock axios/fetch
- Reusable handlers cho cả tests và development
- Type-safe với TypeScript
- Dễ dàng override handlers cho specific test cases

### Cấu Trúc MSW Handlers

```
src/msw/
├── auth.msw.ts          # Authentication endpoints
├── product.msw.ts       # Product endpoints
├── cart.msw.ts          # Cart endpoints
├── checkout.msw.ts      # Checkout endpoints
├── order.msw.ts         # Order endpoints
├── user.msw.ts          # User profile endpoints
├── wishlist.msw.ts      # Wishlist endpoints
├── notification.msw.ts  # Notification endpoints
└── address.msw.ts       # Address endpoints
```

### Tạo MSW Handlers

```typescript
// src/msw/product.msw.ts
import { http, HttpResponse } from 'msw'

const API_URL = 'https://api-ecom.duthanhduoc.com'

const productRequests = [
  // Get products list
  http.get(`${API_URL}/products`, ({ request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '20'

    return HttpResponse.json({
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products: [
          {
            _id: 'product-1',
            name: 'Áo thun nam cotton cao cấp',
            price: 250000,
            price_before_discount: 350000,
            quantity: 100,
            sold: 1500,
            rating: 4.5,
            image: 'https://picsum.photos/seed/product1/200',
            category: { _id: 'cat-1', name: 'Thời trang nam' }
          }
        ],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          page_size: 10
        }
      }
    })
  }),

  // Get product detail
  http.get(`${API_URL}/products/:id`, ({ params }) => {
    const { id } = params

    if (id === 'invalid-id') {
      return HttpResponse.json(
        { message: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      message: 'Lấy sản phẩm thành công',
      data: {
        _id: id,
        name: 'Áo thun nam cotton cao cấp',
        price: 250000,
        price_before_discount: 350000,
        description: 'Áo thun nam chất liệu cotton 100%'
      }
    })
  })
]

export default productRequests
```

---

## Coverage và CI/CD

### Chạy Coverage Locally

```bash
# Run tests with coverage
pnpm test:coverage

# View coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

### Coverage Configuration

Coverage được cấu hình trong `vite.config.ts` với thresholds 80% cho tất cả metrics.

---

## Best Practices

### 1. Test Organization

**✅ DO:**
```typescript
describe('ProductCard', () => {
  describe('rendering', () => {
    it('displays product name', () => {})
  })

  describe('user interactions', () => {
    it('handles add to cart click', () => {})
  })
})
```

### 2. Arrange-Act-Assert Pattern

**✅ DO:**
```typescript
it('adds product to cart', async () => {
  // Arrange
  const user = userEvent.setup()
  render(<ProductDetail />)

  // Act
  await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }))

  // Assert
  expect(screen.getByText('Thêm vào giỏ hàng thành công')).toBeInTheDocument()
})
```

### 3. Use Testing Library Queries Correctly

**Priority order:**
1. `getByRole` - Most accessible
2. `getByLabelText` - For form fields
3. `getByPlaceholderText` - For inputs
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

---

## FAQ

### 1. Tại sao tests chạy chậm?

**Giải pháp:**
- Sử dụng `pool: 'forks'` thay vì `threads`
- Tăng `maxWorkers` nếu máy có nhiều cores
- Tăng `execArgv: ['--max-old-space-size=8192']`

### 2. Làm sao để debug tests?

```typescript
// Use screen.debug()
screen.debug()

// Use Vitest UI
pnpm test:ui
```

### 3. MSW handlers không work?

**Giải pháp:**
- Check URL matching
- Verify `server.listen({ onUnhandledRequest: 'error' })`
- Use `server.use()` để override handlers

---

## Kết Luận

Testing là một phần quan trọng trong development process. Với Vitest, React Testing Library, và MSW, chúng ta có thể viết tests nhanh, reliable, và maintainable.

**Key Takeaways:**
- Sử dụng Vitest cho fast test execution
- Sử dụng React Testing Library để test user behavior
- Sử dụng MSW để mock API requests ở network level
- Focus on testing user-facing behavior
- Maintain high coverage (80%+)

**Resources:**
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)

---

**Tác giả:** Shopee Development Team  
**Ngày cập nhật:** 2026-03-21  
**Version:** 1.0.0
