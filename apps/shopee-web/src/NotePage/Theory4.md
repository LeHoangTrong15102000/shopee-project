# 🧪 **SHOPEE CLONE - CHƯƠNG 25: TESTING STRATEGY**

---

## 📋 **MỤC LỤC**

1. [🔧 Cài Đặt Vitest & Test Functions](#-cài-đặt-vitest--test-functions)
2. [🌐 Test Axios & HTTP Utils](#-test-axios--http-utils)
3. [🔄 Test Refresh Token Mechanism](#-test-refresh-token-mechanism)
4. [📊 Coverage Statistics & Analysis](#-coverage-statistics--analysis)
5. [⚛️ Test React Components](#️-test-react-components)
6. [🧭 Test React Router & Navigation](#-test-react-router--navigation)
7. [🔍 Debug Techniques & Best Practices](#-debug-techniques--best-practices)

---

## 🔧 **Cài Đặt Vitest & Test Functions**

### 🎯 **Mục Tiêu**

Thiết lập môi trường testing với Vitest và viết unit tests cho utility functions.

### 📦 **Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Browser-like environment
    setupFiles: ['./vitest.setup.js'],
    globals: true
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src')
    }
  }
})
```

### 🔧 **Test Setup File**

```javascript
// vitest.setup.js
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect với jest-dom matchers
expect.extend(matchers)

// Cleanup sau mỗi test
afterEach(() => {
  cleanup()
})
```

### 🧪 **Testing Utility Functions**

#### **Test isAxiosError Function**

```typescript
// utils/__test__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { isAxiosError, isAxiosUnprocessableEntityError } from '../utils'
import { AxiosError } from 'axios'

describe('isAxiosError', () => {
  it('should return true for AxiosError instances', () => {
    const axiosError = new AxiosError('Test error')
    expect(isAxiosError(axiosError)).toBe(true)
  })

  it('should return false for regular Error instances', () => {
    const regularError = new Error('Regular error')
    expect(isAxiosError(regularError)).toBe(false)
  })

  it('should return false for non-error values', () => {
    expect(isAxiosError('string')).toBe(false)
    expect(isAxiosError(null)).toBe(false)
    expect(isAxiosError(undefined)).toBe(false)
    expect(isAxiosError({})).toBe(false)
  })
})

describe('isAxiosUnprocessableEntityError', () => {
  it('should return true for 422 status AxiosError', () => {
    const error = new AxiosError('Validation error')
    error.response = {
      status: 422,
      data: { message: 'Validation failed' }
    } as any

    expect(isAxiosUnprocessableEntityError(error)).toBe(true)
  })

  it('should return false for non-422 status AxiosError', () => {
    const error = new AxiosError('Server error')
    error.response = {
      status: 500,
      data: { message: 'Internal server error' }
    } as any

    expect(isAxiosUnprocessableEntityError(error)).toBe(false)
  })

  it('should return false for AxiosError without response', () => {
    const error = new AxiosError('Network error')
    expect(isAxiosUnprocessableEntityError(error)).toBe(false)
  })
})
```

#### **Test Formatting Functions**

```typescript
// utils/__test__/utils.test.ts
describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000)).toBe('₫1.000')
    expect(formatCurrency(1000000)).toBe('₫1.000.000')
    expect(formatCurrency(0)).toBe('₫0')
  })

  it('should handle decimal numbers', () => {
    expect(formatCurrency(1000.5)).toBe('₫1.001') // Rounds up
    expect(formatCurrency(1000.4)).toBe('₫1.000') // Rounds down
  })
})

describe('formatNumberToSocialStyle', () => {
  it('should format small numbers normally', () => {
    expect(formatNumberToSocialStyle(999)).toBe('999')
  })

  it('should format thousands with k suffix', () => {
    expect(formatNumberToSocialStyle(1000)).toBe('1k')
    expect(formatNumberToSocialStyle(1500)).toBe('1.5k')
    expect(formatNumberToSocialStyle(999999)).toBe('1000k')
  })

  it('should format millions with M suffix', () => {
    expect(formatNumberToSocialStyle(1000000)).toBe('1M')
    expect(formatNumberToSocialStyle(1500000)).toBe('1.5M')
  })
})
```

### 🎯 **Key Testing Concepts**

- ✅ **describe()**: Nhóm các test cases related
- ✅ **it()**: Individual test case
- ✅ **expect()**: Assertion function
- ✅ **toBe()**: Exact equality
- ✅ **toEqual()**: Deep equality for objects

---

## 🌐 **Test Axios & HTTP Utils**

### 🎯 **Mục Tiêu**

Test HTTP interceptors, token handling, và error processing trong axios instance.

### 🔧 **Environment Setup cho Browser APIs**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom', // Provides localStorage, window, etc.
    setupFiles: ['./vitest.setup.js']
  }
})
```

### 🧪 **Test localStorage Functions**

```typescript
// utils/__test__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setAccessTokenToLS, getAccessTokenFromLS, setRefreshTokenToLS, getRefreshTokenFromLS, clearLS } from '../auth'

describe('localStorage functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('Access Token', () => {
    it('should set and get access token correctly', () => {
      const token = 'test-access-token'

      setAccessTokenToLS(token)
      const retrievedToken = getAccessTokenFromLS()

      expect(retrievedToken).toBe(token)
    })

    it('should return empty string when no access token exists', () => {
      const token = getAccessTokenFromLS()
      expect(token).toBe('')
    })
  })

  describe('Refresh Token', () => {
    it('should set and get refresh token correctly', () => {
      const token = 'test-refresh-token'

      setRefreshTokenToLS(token)
      const retrievedToken = getRefreshTokenFromLS()

      expect(retrievedToken).toBe(token)
    })
  })

  describe('Clear localStorage', () => {
    it('should clear all tokens and profile', () => {
      setAccessTokenToLS('access-token')
      setRefreshTokenToLS('refresh-token')
      localStorage.setItem('profile', JSON.stringify({ name: 'Test User' }))

      clearLS()

      expect(getAccessTokenFromLS()).toBe('')
      expect(getRefreshTokenFromLS()).toBe('')
      expect(localStorage.getItem('profile')).toBeNull()
    })
  })
})
```

### 🧪 **Test HTTP Instance**

```typescript
// utils/__test__/http.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Http } from '../http'
import { setAccessTokenToLS, setRefreshTokenToLS, clearLS } from '../auth'

describe('Http class', () => {
  let http: Http['instance']

  beforeEach(() => {
    // Tạo Http instance mới cho mỗi test
    http = new Http().instance
    clearLS()
  })

  describe('Request Interceptor', () => {
    it('should add authorization header when access token exists', async () => {
      const accessToken = 'test-access-token'
      setAccessTokenToLS(accessToken)

      // Tạo instance mới để load token
      http = new Http().instance

      // Test bằng cách inspect request config
      const mockAdapter = new MockAdapter(http)
      mockAdapter.onGet('/test').reply((config) => {
        expect(config.headers?.authorization).toBe(accessToken)
        return [200, { data: 'success' }]
      })

      await http.get('/test')
    })

    it('should not add authorization header when no token exists', async () => {
      // Không set token
      const mockAdapter = new MockAdapter(http)
      mockAdapter.onGet('/test').reply((config) => {
        expect(config.headers?.authorization).toBeUndefined()
        return [200, { data: 'success' }]
      })

      await http.get('/test')
    })
  })

  describe('Response Interceptor', () => {
    it('should handle successful responses', async () => {
      const mockAdapter = new MockAdapter(http)
      const responseData = { message: 'success' }

      mockAdapter.onGet('/test').reply(200, responseData)

      const response = await http.get('/test')
      expect(response.status).toBe(200)
      expect(response.data).toEqual(responseData)
    })

    it('should handle 401 errors by clearing localStorage', async () => {
      // Set tokens trước
      setAccessTokenToLS('invalid-token')
      setRefreshTokenToLS('refresh-token')

      const mockAdapter = new MockAdapter(http)
      mockAdapter.onGet('/test').reply(401, { message: 'Unauthorized' })

      try {
        await http.get('/test')
      } catch (error) {
        // Verify localStorage đã bị clear
        expect(getAccessTokenFromLS()).toBe('')
        expect(getRefreshTokenFromLS()).toBe('')
      }
    })
  })
})
```

### 🔧 **Mock Adapter for Testing**

```typescript
// Test với axios-mock-adapter
import MockAdapter from 'axios-mock-adapter'

const setupMockAdapter = (httpInstance: any) => {
  const mock = new MockAdapter(httpInstance)

  // Mock successful login
  mock.onPost('/login').reply(200, {
    data: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: { id: 1, email: 'test@example.com' }
    }
  })

  // Mock refresh token
  mock.onPost('/refresh-access-token').reply(200, {
    data: {
      access_token: 'new-access-token'
    }
  })

  return mock
}
```

---

## 🔄 **Test Refresh Token Mechanism**

### 🎯 **Mục Tiêu**

Test phức tạp nhất - refresh token mechanism với race conditions và error handling.

### 🧪 **Test Refresh Token Flow**

```typescript
// utils/__test__/http.test.ts
describe('Refresh Token Mechanism', () => {
  let http: Http['instance']
  let mockAdapter: MockAdapter

  beforeEach(() => {
    http = new Http().instance
    mockAdapter = new MockAdapter(http)
    clearLS()
  })

  afterEach(() => {
    mockAdapter.restore()
  })

  it('should refresh token when receiving 401 error', async () => {
    const expiredToken = 'expired-access-token'
    const refreshToken = 'valid-refresh-token'
    const newAccessToken = 'new-access-token'

    setAccessTokenToLS(expiredToken)
    setRefreshTokenToLS(refreshToken)

    // Tạo instance mới để load tokens
    http = new Http().instance
    mockAdapter = new MockAdapter(http)

    // Mock 401 response cho API call đầu tiên
    mockAdapter.onGet('/me').replyOnce(401, {
      message: 'Token expired'
    })

    // Mock successful refresh token
    mockAdapter.onPost('/refresh-access-token').replyOnce(200, {
      data: { access_token: newAccessToken }
    })

    // Mock successful retry với token mới
    mockAdapter.onGet('/me').reply((config) => {
      expect(config.headers?.authorization).toBe(newAccessToken)
      return [200, { data: { user: 'test' } }]
    })

    const response = await http.get('/me')

    expect(response.status).toBe(200)
    expect(getAccessTokenFromLS()).toBe(newAccessToken)
  })

  it('should handle concurrent requests during token refresh', async () => {
    const expiredToken = 'expired-token'
    const refreshToken = 'valid-refresh-token'
    const newAccessToken = 'new-access-token'

    setAccessTokenToLS(expiredToken)
    setRefreshTokenToLS(refreshToken)

    http = new Http().instance
    mockAdapter = new MockAdapter(http)

    // Mock 401 cho cả 2 requests
    mockAdapter.onGet('/me').replyOnce(401)
    mockAdapter.onGet('/profile').replyOnce(401)

    // Mock refresh token - chỉ được gọi 1 lần
    let refreshCallCount = 0
    mockAdapter.onPost('/refresh-access-token').reply(() => {
      refreshCallCount++
      return [200, { data: { access_token: newAccessToken } }]
    })

    // Mock successful retries
    mockAdapter.onGet('/me').reply(200, { data: 'me' })
    mockAdapter.onGet('/profile').reply(200, { data: 'profile' })

    // Gọi đồng thời 2 requests
    const [response1, response2] = await Promise.all([http.get('/me'), http.get('/profile')])

    expect(response1.status).toBe(200)
    expect(response2.status).toBe(200)
    expect(refreshCallCount).toBe(1) // Chỉ refresh 1 lần
  })

  it('should logout when refresh token fails', async () => {
    const expiredToken = 'expired-token'
    const invalidRefreshToken = 'invalid-refresh-token'

    setAccessTokenToLS(expiredToken)
    setRefreshTokenToLS(invalidRefreshToken)

    http = new Http().instance
    mockAdapter = new MockAdapter(http)

    // Mock 401 cho API call
    mockAdapter.onGet('/me').replyOnce(401)

    // Mock failed refresh token
    mockAdapter.onPost('/refresh-access-token').replyOnce(401, {
      message: 'Refresh token expired'
    })

    try {
      await http.get('/me')
    } catch (error) {
      // Verify localStorage đã bị clear
      expect(getAccessTokenFromLS()).toBe('')
      expect(getRefreshTokenFromLS()).toBe('')
      expect(error.response?.status).toBe(401)
    }
  })

  it('should handle network errors during refresh', async () => {
    setAccessTokenToLS('expired-token')
    setRefreshTokenToLS('refresh-token')

    http = new Http().instance
    mockAdapter = new MockAdapter(http)

    mockAdapter.onGet('/me').replyOnce(401)
    mockAdapter.onPost('/refresh-access-token').networkError()

    try {
      await http.get('/me')
    } catch (error) {
      expect(getAccessTokenFromLS()).toBe('')
      expect(getRefreshTokenFromLS()).toBe('')
    }
  })
})
```

### 🔧 **Testing Race Conditions**

```typescript
describe('Race Condition Prevention', () => {
  it('should prevent multiple simultaneous refresh requests', async () => {
    // Setup
    setAccessTokenToLS('expired-token')
    setRefreshTokenToLS('valid-refresh-token')

    let refreshRequestCount = 0
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    mockAdapter.onPost('/refresh-access-token').reply(async () => {
      refreshRequestCount++
      await delay(100) // Simulate network delay
      return [200, { data: { access_token: 'new-token' } }]
    })

    // Trigger multiple concurrent 401 responses
    mockAdapter.onGet('/api1').replyOnce(401)
    mockAdapter.onGet('/api2').replyOnce(401)
    mockAdapter.onGet('/api3').replyOnce(401)

    // Mock successful retries
    mockAdapter.onGet().reply(200, { data: 'success' })

    // Execute concurrent requests
    await Promise.all([http.get('/api1'), http.get('/api2'), http.get('/api3')])

    // Verify refresh was called only once
    expect(refreshRequestCount).toBe(1)
  })
})
```

---

## 📊 **Coverage Statistics & Analysis**

### 🎯 **Mục Tiêu**

Theo dõi test coverage để đảm bảo code quality và identify untested code paths.

### 🔧 **Coverage Configuration**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.{js,ts}', '**/index.ts'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### 📊 **Coverage Scripts**

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

### 📈 **Coverage Analysis**

```bash
# Run coverage analysis
npm run test:coverage

# Expected output:
# ✓ src/utils/auth.ts (100%)
# ✓ src/utils/utils.ts (95.2%)
# ✓ src/utils/http.ts (87.5%)
# ⚠ src/components/ErrorBoundary.tsx (45.5%) - Low coverage
# ❌ src/hooks/useDebounce.tsx (12.5%) - Very low coverage

# Overall Coverage: 82.3%
```

### 🎯 **Coverage Best Practices**

- ✅ **80%+ Coverage**: Minimum threshold
- ✅ **Critical Paths**: 100% coverage cho auth, payment
- ✅ **Utility Functions**: High coverage for utils
- ✅ **Edge Cases**: Test error scenarios
- ✅ **Integration Points**: API calls, state management

---

## ⚛️ **Test React Components**

### 🎯 **Mục Tiêu**

Test React components với user interactions, state changes, và props validation.

### 🧪 **Test App Component**

```typescript
// src/App.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('App Component', () => {
  it('should render without crashing', () => {
    const Wrapper = createWrapper()
    render(<App />, { wrapper: Wrapper })

    expect(screen.getByText('Shopee Clone')).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    const Wrapper = createWrapper()
    render(<App />, { wrapper: Wrapper })

    // Should show loader while components are loading
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('should render ProductList page by default', async () => {
    const Wrapper = createWrapper()
    render(<App />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(document.title).toBe('Trang chủ | Shopee Clone')
    })
  })
})
```

### 🧪 **Test Button Component**

```typescript
// components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button Component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should show loading state', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByText('Submit')).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByText('Button')).toHaveClass('custom-class')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    expect(screen.getByText('Disabled Button')).toBeDisabled()
  })
})
```

### 🧪 **Test Input Component**

```typescript
// components/Input/Input.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import Input from './Input'

const TestComponent = ({ errorMessage }: { errorMessage?: string }) => {
  const { register } = useForm()

  return (
    <Input
      name="email"
      placeholder="Enter email"
      register={register}
      errorMessage={errorMessage}
    />
  )
}

describe('Input Component', () => {
  it('should render input with placeholder', () => {
    render(<TestComponent />)
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('should display error message when provided', () => {
    const errorMessage = 'Email is required'
    render(<TestComponent errorMessage={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toHaveClass('border-red-600')
  })

  it('should handle user input', () => {
    render(<TestComponent />)
    const input = screen.getByPlaceholderText('Enter email')

    fireEvent.change(input, { target: { value: 'test@example.com' } })
    expect(input).toHaveValue('test@example.com')
  })

  it('should not display error styles when no error', () => {
    render(<TestComponent />)
    const input = screen.getByPlaceholderText('Enter email')

    expect(input).not.toHaveClass('border-red-600')
  })
})
```

### 🎯 **Component Testing Best Practices**

- ✅ **User Perspective**: Test như user sử dụng
- ✅ **Behavior Over Implementation**: Test behavior, not internal state
- ✅ **Accessibility**: Test với screen readers
- ✅ **Error States**: Test error conditions
- ✅ **Edge Cases**: Empty states, loading states

---

## 🧭 **Test React Router & Navigation**

### 🎯 **Mục Tiêu**

Test navigation flows, route protection, và URL parameter handling.

### 🧪 **Test Navigation Flow**

```typescript
// src/__test__/navigation.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Import components
import App from '../App'
import { AppContextProvider } from '../contexts/app.context'

const createTestRouter = (initialEntries = ['/']) => {
  return createMemoryRouter([
    {
      path: '/',
      element: <App />
    },
    {
      path: '/login',
      element: <App />
    },
    {
      path: '/product/:nameId',
      element: <App />
    }
  ], {
    initialEntries
  })
}

const renderWithRouter = (initialEntries?: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  const router = createTestRouter(initialEntries)

  return render(
    <QueryClientProvider client={queryClient}>
      <AppContextProvider>
        <RouterProvider router={router} />
      </AppContextProvider>
    </QueryClientProvider>
  )
}

describe('Navigation Tests', () => {
  it('should navigate to home page by default', async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(document.title).toBe('Trang chủ | Shopee Clone')
    })
  })

  it('should navigate to login page when clicking login link', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Đăng nhập'))

    await waitFor(() => {
      expect(document.title).toBe('Đăng nhập | Shopee Clone')
      expect(screen.getByText('Bạn mới biết đến Shopee?')).toBeInTheDocument()
    })
  })

  it('should navigate to register page from login page', async () => {
    const user = userEvent.setup()
    renderWithRouter(['/login'])

    await waitFor(() => {
      expect(screen.getByText('Bạn mới biết đến Shopee?')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Đăng ký'))

    await waitFor(() => {
      expect(document.title).toBe('Đăng ký | Shopee Clone')
    })
  })

  it('should handle 404 page for invalid routes', async () => {
    renderWithRouter(['/invalid-route'])

    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    })
  })

  it('should handle product detail route with nameId parameter', async () => {
    const productNameId = 'iphone-14-i-60afb1c56ef5b902180aacba'
    renderWithRouter([`/product/${productNameId}`])

    await waitFor(() => {
      expect(document.title).toContain('Chi tiết sản phẩm')
    })
  })
})
```

### 🧪 **Test Protected Routes**

```typescript
describe('Protected Routes', () => {
  it('should redirect to login for protected routes when not authenticated', async () => {
    // Mock không có token
    vi.mock('../utils/auth', () => ({
      getAccessTokenFromLS: () => '',
      getRefreshTokenFromLS: () => ''
    }))

    renderWithRouter(['/user/profile'])

    await waitFor(() => {
      expect(document.title).toBe('Đăng nhập | Shopee Clone')
    })
  })

  it('should allow access to protected routes when authenticated', async () => {
    // Mock có token
    vi.mock('../utils/auth', () => ({
      getAccessTokenFromLS: () => 'valid-token',
      getRefreshTokenFromLS: () => 'valid-refresh-token'
    }))

    renderWithRouter(['/user/profile'])

    await waitFor(() => {
      expect(document.title).toBe('Hồ sơ của tôi | Shopee Clone')
    })
  })
})
```

### 🧪 **Test URL Search Parameters**

```typescript
describe('URL Search Parameters', () => {
  it('should handle search query parameters', async () => {
    renderWithRouter(['/?name=iphone&category=electronics'])

    await waitFor(() => {
      // Should show products filtered by search params
      expect(screen.getByDisplayValue('iphone')).toBeInTheDocument()
    })
  })

  it('should update URL when performing search', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/tìm kiếm/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/tìm kiếm/i)
    await user.type(searchInput, 'laptop')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(window.location.search).toContain('name=laptop')
    })
  })
})
```

---

## 🔍 **Debug Techniques & Best Practices**

### 🎯 **Mục Tiêu**

Học cách debug tests hiệu quả và troubleshoot common testing issues.

### 🔧 **Debug Utilities**

```typescript
// Test debugging utilities
import { screen } from '@testing-library/react'

// Debug rendered DOM
screen.debug() // Prints entire DOM
screen.debug(screen.getByText('Button')) // Prints specific element

// Get all elements for debugging
screen.logTestingPlaygroundURL() // Opens Testing Playground
```

### 🧪 **Debug Example**

```typescript
describe('Debug Example', () => {
  it('should debug component rendering', () => {
    render(<ProductList />)

    // Debug toàn bộ DOM
    screen.debug()

    // Debug specific element
    const productElement = screen.getByText(/iphone/i)
    screen.debug(productElement)

    // Log available queries
    console.log('Available queries:', screen.getAllByRole('button'))
  })
})
```

### 🔧 **Common Testing Patterns**

```typescript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument()
})

// Test user interactions
const user = userEvent.setup()
await user.click(screen.getByRole('button'))
await user.type(screen.getByRole('textbox'), 'hello')

// Mock functions
const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')
mockFn.mockResolvedValue('async mocked value')

// Mock modules
vi.mock('../api', () => ({
  fetchProducts: vi.fn().mockResolvedValue([])
}))
```

### 🐛 **Common Issues & Solutions**

#### **Issue 1: Test Timeouts**

```typescript
// ❌ Problem
it('should load products', () => {
  render(<ProductList />)
  expect(screen.getByText('iPhone')).toBeInTheDocument() // Fails immediately
})

// ✅ Solution
it('should load products', async () => {
  render(<ProductList />)
  await waitFor(() => {
    expect(screen.getByText('iPhone')).toBeInTheDocument()
  })
})
```

#### **Issue 2: Act Warnings**

```typescript
// ❌ Problem
it('should update state', () => {
  render(<Counter />)
  fireEvent.click(screen.getByText('Increment'))
  // Act warning occurs
})

// ✅ Solution
it('should update state', async () => {
  render(<Counter />)
  await user.click(screen.getByText('Increment'))
  // No warning
})
```

#### **Issue 3: Memory Leaks**

```typescript
// ✅ Proper cleanup
afterEach(() => {
  cleanup() // Clean up DOM
  vi.clearAllMocks() // Clear mock calls
})
```

### 🎯 **Testing Best Practices**

#### **1. Test Structure (AAA Pattern)**

```typescript
it('should update cart quantity', async () => {
  // 🔧 Arrange
  const user = userEvent.setup()
  render(<CartItem product={mockProduct} />)

  // 🎬 Act
  await user.click(screen.getByLabelText('Increase quantity'))

  // ✅ Assert
  expect(screen.getByDisplayValue('2')).toBeInTheDocument()
})
```

#### **2. Descriptive Test Names**

```typescript
// ❌ Bad
it('should work', () => {})

// ✅ Good
it('should display error message when email is invalid', () => {})
it('should redirect to home page after successful login', () => {})
it('should disable submit button while form is loading', () => {})
```

#### **3. Test Independence**

```typescript
describe('ProductList', () => {
  beforeEach(() => {
    // Reset state for each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should filter products by category', () => {
    // Test is independent of other tests
  })
})
```

#### **4. Mock External Dependencies**

```typescript
// Mock API calls
vi.mock('../apis/product.api', () => ({
  getProducts: vi.fn().mockResolvedValue(mockProducts)
}))

// Mock router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))
```

---

## 🎉 **Tổng Kết Testing Strategy**

### ✅ **Đã Hoàn Thành**

- 🔧 **Vitest Setup**: Cấu hình testing environment
- 🧪 **Unit Tests**: Test utility functions và business logic
- 🌐 **HTTP Testing**: Test axios interceptors và refresh token
- ⚛️ **Component Tests**: Test React components với user interactions
- 🧭 **Router Tests**: Test navigation và protected routes
- 📊 **Coverage Analysis**: Theo dõi test coverage
- 🔍 **Debug Techniques**: Debug và troubleshoot tests

### 📊 **Test Coverage Summary**

```
┌─────────────────────┬───────────┬───────────┬───────────┬───────────┐
│ File                │ % Stmts   │ % Branch  │ % Funcs   │ % Lines   │
├─────────────────────┼───────────┼───────────┼───────────┼───────────┤
│ All files           │   87.12   │   84.56   │   89.23   │   87.45   │
├─────────────────────┼───────────┼───────────┼───────────┼───────────┤
│ utils/              │   95.34   │   92.11   │   97.56   │   95.78   │
│ components/         │   82.45   │   78.23   │   85.67   │   83.12   │
│ hooks/              │   89.67   │   86.34   │   91.23   │   90.12   │
│ pages/              │   78.23   │   75.45   │   80.12   │   79.34   │
└─────────────────────┴───────────┴───────────┴───────────┴───────────┘
```

### 🎯 **Testing Philosophy**

1. **User-Centric**: Test như user sử dụng app
2. **Behavior Testing**: Test behavior thay vì implementation
3. **Fast Feedback**: Tests chạy nhanh và reliable
4. **Maintainable**: Tests dễ đọc và maintain
5. **Confidence**: Tests tạo confidence khi refactor

### 🚀 **Next Steps**

- **E2E Testing**: Implement Playwright cho end-to-end tests
- **Visual Regression**: Test UI consistency
- **Performance Testing**: Test loading times và bundle size
- **Accessibility Testing**: Test với screen readers
- **CI/CD Integration**: Automate testing trong deployment pipeline

### 💡 **Key Takeaways**

- **Test Early**: Viết tests song song với development
- **Test Important Paths**: Focus vào critical business logic
- **Mock Dependencies**: Isolate units under test
- **Readable Tests**: Tests serve as documentation
- **Coverage ≠ Quality**: Focus on meaningful tests over percentage

---

## 📚 **Testing Resources**

### 📖 **Documentation**

- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [React Testing Patterns](https://react-testing-examples.com/)

### 🛠️ **Tools & Libraries**

- **Vitest**: Fast unit test runner
- **Testing Library**: React component testing utilities
- **MSW**: Mock service worker for API mocking
- **User Event**: Simulate user interactions
- **Axe**: Accessibility testing

### 🎯 **Testing Pyramid**

```
        E2E Tests (Few)
      Integration Tests (Some)
   Unit Tests (Many)
```

### ✨ **Final Notes**

Testing không chỉ là viết code để verify functionality, mà còn là:

- **Documentation**: Tests mô tả cách code hoạt động
- **Design Tool**: TDD giúp thiết kế better APIs
- **Confidence**: Refactor without fear
- **Quality Gate**: Prevent regressions
- **Team Communication**: Shared understanding of requirements

> "The goal is not to have a high test coverage percentage, but to have confidence in your code." - Kent C. Dodds
