# Hướng Dẫn Testing Toàn Diện — Shopee Admin

> Tài liệu hướng dẫn từ A-Z: setup, cấu trúc, kỹ thuật, và best practices cho việc testing hệ thống shopee-admin sử dụng **Vitest** + **React Testing Library** + **MSW (Mock Service Worker)**.

---

## Mục Lục

1. [Tại Sao Dùng Vitest Thay Vì Jest?](#1-tại-sao-dùng-vitest-thay-vì-jest)
2. [Setup Từ Đầu](#2-setup-từ-đầu)
3. [Cấu Trúc Thư Mục Test](#3-cấu-trúc-thư-mục-test)
4. [Nguyên Tắc Vàng Khi Viết Test](#4-nguyên-tắc-vàng-khi-viết-test)
5. [Flow Test Cho Utility Function](#5-flow-test-cho-utility-function)
6. [Flow Test Cho Custom Hook](#6-flow-test-cho-custom-hook)
7. [Flow Test Cho Component](#7-flow-test-cho-component)
8. [Mock Service Worker (MSW) — API Mocking](#8-mock-service-worker-msw--api-mocking)
9. [Snapshot Testing](#9-snapshot-testing)
10. [Integration Testing](#10-integration-testing)
11. [Test Helpers & Wrapper](#11-test-helpers--wrapper)
12. [Coverage & CI](#12-coverage--ci)
13. [Checklist Trước Khi Merge](#13-checklist-trước-khi-merge)

---

## 1. Tại Sao Dùng Vitest Thay Vì Jest?

Project shopee-admin dùng **Vite** làm bundler. Vitest là test runner native cho Vite:

| Tiêu chí                    | Jest                                     | Vitest                            |
| --------------------------- | ---------------------------------------- | --------------------------------- |
| Tương thích Vite            | Cần cấu hình phức tạp (babel, transform) | Native, zero-config               |
| Tốc độ                      | Chậm (transform qua babel)               | Nhanh gấp 2-5x (dùng esbuild/SWC) |
| ESM support                 | Hạn chế, cần workaround                  | Native ESM                        |
| `import.meta.env`           | Không hỗ trợ trực tiếp                   | Hỗ trợ native                     |
| Path alias (`src/*`, `@/*`) | Cần `moduleNameMapper`                   | Tự đọc từ `vite.config.ts`        |
| API tương thích             | —                                        | 99% tương thích Jest API          |
| Hot Module Reload           | Không                                    | Có (watch mode)                   |

> **Kết luận**: Với Vite project, dùng Vitest là lựa chọn tối ưu. API gần như giống Jest nên không cần học lại.

---

## 2. Setup Từ Đầu

### 2.1. Cài đặt dependencies

```bash
cd apps/shopee-admin

# Core testing
pnpm add -D vitest @vitest/coverage-v8 jsdom

# React Testing Library
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# MSW cho API mocking
pnpm add -D msw
```

### 2.2. Cấu hình Vitest trong `vite.config.ts`

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  const baseConfig = {
    plugins: [tailwindcss(), react()],
    server: { port: 4001, host: true },
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
        '@': path.resolve(__dirname, './src'),
      },
    },
  }

  if (isTest) {
    return {
      ...baseConfig,
      test: {
        globals: true, // Dùng describe/it/expect không cần import
        environment: 'jsdom', // Giả lập DOM
        setupFiles: ['./vitest.setup.ts'],
        css: true, // Parse CSS (tránh lỗi import CSS)
        testTimeout: 30000,
        include: [
          'src/**/*.test.{ts,tsx}', // Unit tests
          'test/**/*.test.{ts,tsx}', // Integration tests
        ],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html', 'lcov'],
          reportsDirectory: './coverage',
          include: ['src/**/*.{ts,tsx}'],
          exclude: [
            'src/**/*.test.{ts,tsx}',
            'src/components/ui/**', // shadcn components — không cần test
            'src/types/**',
            'src/vite-env.d.ts',
            'src/main.tsx',
          ],
          thresholds: {
            lines: 70,
            functions: 70,
            branches: 60,
            statements: 70,
          },
        },
      },
    }
  }

  return baseConfig
})
```

### 2.3. File setup: `vitest.setup.ts`

```ts
/// <reference types="vitest" />
import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './src/msw/handlers'

// ═══════════════════════════════════════════
// 1. MOCK BROWSER APIs
// ═══════════════════════════════════════════

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value?.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// matchMedia mock (cần cho responsive hooks, theme)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// scrollTo mock
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  callback: Function
  constructor(callback: Function) {
    this.callback = callback
  }
  observe() {
    return null
  }
  unobserve() {
    return null
  }
  disconnect() {
    return null
  }
  takeRecords() {
    return []
  }
} as any

// ResizeObserver mock (cần cho nhiều UI components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// ═══════════════════════════════════════════
// 2. MSW SERVER
// ═══════════════════════════════════════════

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterAll(() => server.close())

afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

// Export server để test có thể override handlers
export { server }
```

### 2.4. Thêm scripts vào `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 2.5. Thêm TypeScript types

Trong `tsconfig.json`, thêm vitest types:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

---

## 3. Cấu Trúc Thư Mục Test

```
apps/shopee-admin/
├── src/
│   ├── apis/
│   │   └── products.api.ts
│   ├── components/
│   │   ├── shared/
│   │   │   ├── StatCard.tsx
│   │   │   └── StatCard.test.tsx          ← Co-located test
│   │   └── ui/                            ← KHÔNG test (shadcn)
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   └── useProducts.test.ts            ← Co-located test
│   ├── utils/
│   │   ├── format.ts
│   │   └── format.test.ts                 ← Co-located test
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── auth.store.test.ts             ← Co-located test
│   ├── pages/
│   │   └── Login/
│   │       ├── LoginPage.tsx
│   │       └── LoginPage.test.tsx         ← Co-located test
│   └── msw/
│       ├── handlers.ts                    ← Export tất cả handlers
│       ├── auth.msw.ts                    ← Auth API handlers
│       ├── products.msw.ts               ← Products API handlers
│       └── data/                          ← Mock data
│           ├── products.mock.ts
│           └── users.mock.ts
├── test/
│   └── integration/                       ← Integration tests
│       └── login-flow.test.tsx
├── vitest.setup.ts
└── vite.config.ts
```

**Nguyên tắc**: Test file đặt cạnh file source (co-located). Dễ tìm, dễ maintain.

---

## 4. Nguyên Tắc Vàng Khi Viết Test

### 4.1. Mô hình AAA (Arrange - Act - Assert)

Mỗi test case PHẢI tuân theo 3 bước:

```ts
it('should format currency correctly', () => {
  // Arrange — chuẩn bị dữ liệu
  const price = 150000

  // Act — thực hiện hành động
  const result = formatCurrency(price)

  // Assert — kiểm tra kết quả
  expect(result).toBe('₫150.000')
})
```

### 4.2. Thứ tự test trong một `describe()` block

```
describe('TênFunction / TênComponent')
  ├── 1. Render / Khởi tạo cơ bản (happy path)
  │     → "renders correctly" / "returns expected value"
  │
  ├── 2. Props / Parameters khác nhau
  │     → Test từng prop/param quan trọng
  │
  ├── 3. User interactions (nếu là component)
  │     → Click, type, submit, hover...
  │
  ├── 4. State changes
  │     → Loading → Success → Error
  │
  ├── 5. Edge cases
  │     → Empty, null, undefined, boundary values
  │
  └── 6. Error cases
        → API fail, invalid input, network error
```

### 4.3. Quy tắc đặt tên test

```ts
// ✅ TỐT — mô tả behavior, không mô tả implementation
it('should show error message when login fails')
it('should redirect to dashboard after successful login')
it('should disable submit button while loading')

// ❌ XẤU — mô tả implementation detail
it('should call setState with false')
it('should set isLoading to true')
it('should call axios.post')
```

### 4.4. Nguyên tắc Testing Trophy

```
        ╱╲
       ╱  ╲        E2E Tests (ít nhất, chậm nhất)
      ╱────╲
     ╱      ╲
    ╱ Integr. ╲    Integration Tests (nhiều nhất, ROI cao nhất)
   ╱────────────╲
  ╱   Component  ╲  Component Tests
 ╱────────────────╲
╱   Unit (utils)   ╲ Unit Tests (nhanh nhất, đơn giản nhất)
╲══════════════════╱
```

**Ưu tiên**: Integration > Component > Unit > E2E

---

## 5. Flow Test Cho Utility Function

Utility function là loại đơn giản nhất — pure function, không side effect.

### 5.1. Ví dụ: Test `formatCurrency`

File: `src/utils/format.ts`

```ts
export function formatCurrency(value: number | string): string {
  return `₫${Number(value).toLocaleString('vi-VN')}`
}
```

File: `src/utils/format.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './format'

describe('formatCurrency', () => {
  // 1. Happy path — giá trị bình thường
  it('should format number with Vietnamese currency symbol', () => {
    expect(formatCurrency(150000)).toBe('₫150.000')
  })

  // 2. Các loại input khác nhau
  it('should handle string input', () => {
    expect(formatCurrency('250000')).toBe('₫250.000')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('₫0')
  })

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000000)).toBe('₫1.000.000.000')
  })

  // 3. Edge cases
  it('should handle decimal numbers', () => {
    const result = formatCurrency(99.99)
    expect(result).toContain('₫')
  })

  it('should handle negative numbers', () => {
    const result = formatCurrency(-50000)
    expect(result).toContain('-')
    expect(result).toContain('₫')
  })

  // 4. Error cases
  it('should handle NaN input gracefully', () => {
    const result = formatCurrency(NaN)
    expect(result).toBe('₫NaN')
  })
})
```

### 5.2. Ví dụ: Test `cn` (class merge utility)

File: `src/lib/utils.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('should merge tailwind classes correctly', () => {
    // tailwind-merge: class sau override class trước
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })
})
```

### 5.3. Flow tổng quát cho utility function

```
┌─────────────────────────────────────────────────┐
│           FLOW TEST UTILITY FUNCTION            │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Import function cần test                    │
│  2. describe('functionName')                    │
│  3. Happy path — input bình thường              │
│  4. Các loại input khác nhau (string, number)   │
│  5. Boundary values (0, MAX, MIN)               │
│  6. Edge cases (empty, null, undefined)          │
│  7. Error cases (invalid input)                 │
│                                                 │
│  ⚠️ KHÔNG mock gì cả — test pure logic         │
│  ⚠️ Mỗi test case CHỈ test 1 behavior          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 6. Flow Test Cho Custom Hook

Custom hooks trong shopee-admin chủ yếu wrap TanStack Query. Cần setup QueryClient wrapper.

### 6.1. Test Helper: `createQueryWrapper`

File: `src/test-utils/index.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Tạo QueryClient cho test — KHÔNG retry, KHÔNG cache
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Wrapper cho renderHook
export function createQueryWrapper() {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Wrapper đầy đủ cho render component (có Router + Query)
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function renderWithProviders(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  const {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
```

### 6.2. Ví dụ: Test `useProducts` hook

File: `src/hooks/useProducts.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProducts, useDeleteProduct } from './useProducts'
import { createQueryWrapper } from 'src/test-utils'
import { server } from '../../vitest.setup'
import { http, HttpResponse } from 'msw'

describe('useProducts', () => {
  // 1. Happy path — fetch thành công
  it('should fetch products for given page', async () => {
    const { result } = renderHook(() => useProducts(0), {
      wrapper: createQueryWrapper(),
    })

    // Ban đầu: loading
    expect(result.current.isLoading).toBe(true)

    // Chờ data load xong
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify data structure
    expect(result.current.data).toBeDefined()
    expect(result.current.data?.products).toBeInstanceOf(Array)
  })

  // 2. Loading state
  it('should be in loading state initially', () => {
    const { result } = renderHook(() => useProducts(0), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  // 3. Error state — API trả lỗi
  it('should handle API error', async () => {
    // Override handler cho test này
    server.use(
      http.get('*/admin/products', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )

    const { result } = renderHook(() => useProducts(0), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  // 4. Pagination — page khác nhau
  it('should pass correct page parameter', async () => {
    const { result } = renderHook(() => useProducts(2), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})

describe('useDeleteProduct', () => {
  it('should delete product and show success toast', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteProduct(onSuccess), {
      wrapper: createQueryWrapper(),
    })

    // Act
    result.current.mutate('product-id-123')

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should show error toast when delete fails', async () => {
    server.use(
      http.delete('*/admin/products/*', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate('invalid-id')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
```

### 6.3. Flow tổng quát cho custom hook

```
┌─────────────────────────────────────────────────┐
│           FLOW TEST CUSTOM HOOK                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Import hook + createQueryWrapper            │
│  2. describe('hookName')                        │
│  3. Happy path — data fetch thành công          │
│  4. Loading state — kiểm tra isLoading          │
│  5. Error state — override MSW handler          │
│  6. Parameters khác nhau                        │
│  7. Mutation hooks:                             │
│     - Success callback                          │
│     - Error callback                            │
│     - Cache invalidation                        │
│                                                 │
│  ⚠️ LUÔN dùng wrapper với QueryClient           │
│  ⚠️ Dùng waitFor() cho async operations         │
│  ⚠️ Override MSW handlers cho error cases       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 7. Flow Test Cho Component

Component test là phần quan trọng nhất. Test behavior từ góc nhìn user, KHÔNG test implementation.

### 7.1. Ví dụ: Test `StatCard` (Simple Component)

File: `src/components/shared/StatCard.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'
import { formatCurrency } from 'src/utils/format'

describe('StatCard', () => {
  // 1. Render cơ bản — happy path
  it('should render label and value', () => {
    render(<StatCard label="Total Revenue" value={1500000} />)

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('1500000')).toBeInTheDocument()
  })

  // 2. Props khác nhau
  it('should apply formatter to value', () => {
    render(<StatCard label="Revenue" value={150000} formatter={formatCurrency} />)

    expect(screen.getByText(/₫150/)).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    render(<StatCard label="Users" value={100} icon={<span data-testid="test-icon">icon</span>} />)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  // 3. Trend display
  it('should show positive trend with green color', () => {
    render(<StatCard label="Orders" value={50} trend={12.5} />)

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('should show negative trend with red color', () => {
    render(<StatCard label="Orders" value={50} trend={-5.3} />)

    expect(screen.getByText('-5.3%')).toBeInTheDocument()
  })

  // 4. Edge cases
  it('should not show trend when trend is 0', () => {
    render(<StatCard label="Orders" value={50} trend={0} />)

    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('should not show trend when trend is undefined', () => {
    render(<StatCard label="Orders" value={50} />)

    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})
```

### 7.2. Ví dụ: Test `ConfirmDialog` (Interactive Component)

File: `src/components/shared/ConfirmDialog.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  }

  // 1. Render cơ bản
  it('should render with default title and description', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  // 2. Custom props
  it('should render custom title and description', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Delete Product?"
        description="This will permanently delete the product."
      />,
    )

    expect(screen.getByText('Delete Product?')).toBeInTheDocument()
    expect(screen.getByText('This will permanently delete the product.')).toBeInTheDocument()
  })

  // 3. User interactions
  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  // 4. Loading state
  it('should show loading text and disable confirm when isLoading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />)

    const confirmBtn = screen.getByText('Loading...')
    expect(confirmBtn).toBeInTheDocument()
    expect(confirmBtn.closest('button')).toBeDisabled()
  })

  // 5. Không render khi closed
  it('should not render content when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })
})
```

### 7.3. Ví dụ: Test `LoginPage` (Page Component với Form + API)

File: `src/pages/Login/LoginPage.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { renderWithProviders } from 'src/test-utils'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' }),
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  // 1. Render cơ bản
  it('should render login form', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByText('Shopee Admin')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  // 2. Form validation
  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should show error for short password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'admin@shopee.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })
  })

  // 3. Successful login
  it('should navigate to dashboard after successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'admin@shopee.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  // 4. Failed login — API error
  it('should show error message when credentials are invalid', async () => {
    server.use(
      http.post('*/login', () => {
        return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'wrong@email.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i)
    })
  })

  // 5. Loading state
  it('should disable submit button while loading', async () => {
    // Delay response để catch loading state
    server.use(
      http.post('*/login', async () => {
        await new Promise((r) => setTimeout(r, 100))
        return HttpResponse.json({
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            user: { _id: '1', email: 'admin@shopee.com', roles: ['Admin'] },
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'admin@shopee.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Button should be disabled during loading
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })

  // 6. Non-admin user rejection
  it('should reject non-admin users', async () => {
    server.use(
      http.post('*/login', () => {
        return HttpResponse.json({
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            user: { _id: '1', email: 'user@shopee.com', roles: ['User'] },
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@shopee.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Should NOT navigate
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
```

### 7.4. Flow tổng quát cho component test

```
┌─────────────────────────────────────────────────┐
│           FLOW TEST COMPONENT                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Import component + renderWithProviders      │
│  2. describe('ComponentName')                   │
│  3. Render cơ bản — elements hiển thị đúng      │
│  4. Props khác nhau — test từng prop            │
│  5. User interactions:                          │
│     - userEvent.setup() (KHÔNG dùng fireEvent)  │
│     - click, type, clear, selectOptions...      │
│  6. Async states:                               │
│     - Loading → screen.getByRole('status')      │
│     - Success → data hiển thị đúng              │
│     - Error → error message hiển thị            │
│  7. Form validation (nếu có form)               │
│  8. Edge cases:                                 │
│     - Empty data                                │
│     - Long text overflow                        │
│     - Missing optional props                    │
│                                                 │
│  ⚠️ LUÔN dùng userEvent thay vì fireEvent       │
│  ⚠️ Query by role/label, KHÔNG by class/id      │
│  ⚠️ Dùng renderWithProviders cho page components│
│                                                 │
└─────────────────────────────────────────────────┘
```

### 7.5. Bảng Query Priority (React Testing Library)

Khi tìm element trong test, ưu tiên theo thứ tự:

| Priority | Query                  | Khi nào dùng                                   |
| -------- | ---------------------- | ---------------------------------------------- |
| 1        | `getByRole`            | Mọi interactive element (button, input, link)  |
| 2        | `getByLabelText`       | Form inputs có label                           |
| 3        | `getByPlaceholderText` | Input không có label                           |
| 4        | `getByText`            | Text content hiển thị                          |
| 5        | `getByDisplayValue`    | Input đã có value                              |
| 6        | `getByAltText`         | Images                                         |
| 7        | `getByTitle`           | Title attribute                                |
| 8        | `getByTestId`          | **Cuối cùng** — chỉ khi không có cách nào khác |

```ts
// ✅ TỐT
screen.getByRole('button', { name: /sign in/i })
screen.getByLabelText('Email')
screen.getByText('Total Revenue')

// ❌ XẤU
screen.getByTestId('submit-btn')
document.querySelector('.btn-primary')
```

---

## 8. Mock Service Worker (MSW) — API Mocking

MSW intercept network requests ở tầng service worker, giống hệt real API. Đây là cách mock API tốt nhất hiện tại.

### 8.1. Tại sao MSW thay vì mock axios?

```
┌─────────────────────────────────────────────────┐
│         SO SÁNH CÁCH MOCK API                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  vi.mock('axios')          MSW                  │
│  ─────────────────    ─────────────────         │
│  Mock ở module level   Mock ở network level     │
│  Brittle, dễ vỡ       Stable, realistic        │
│  Không test interceptor Test full HTTP stack    │
│  Khó maintain          Reusable handlers        │
│  Chỉ test happy path   Test mọi HTTP status    │
│                                                 │
│  ❌ Không khuyến khích  ✅ Best practice         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 8.2. Cấu trúc MSW handlers

File: `src/msw/data/products.mock.ts`

```ts
import type { Product, Category } from 'src/types'

export const mockCategories: Category[] = [
  { _id: 'cat-1', name: 'Điện thoại' },
  { _id: 'cat-2', name: 'Laptop' },
  { _id: 'cat-3', name: 'Phụ kiện' },
]

export const mockProducts: Product[] = [
  {
    _id: 'prod-1',
    name: 'iPhone 15 Pro Max',
    image: 'https://example.com/iphone.jpg',
    images: [],
    description: 'Flagship phone',
    category: mockCategories[0],
    price: 29990000,
    rating: 4.8,
    price_before_discount: 34990000,
    quantity: 100,
    sold: 500,
    view: 10000,
    location: 'Hồ Chí Minh',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    _id: 'prod-2',
    name: 'MacBook Air M3',
    image: 'https://example.com/macbook.jpg',
    images: [],
    description: 'Lightweight laptop',
    category: mockCategories[1],
    price: 27990000,
    rating: 4.9,
    price_before_discount: 32990000,
    quantity: 50,
    sold: 200,
    view: 5000,
    location: 'Hà Nội',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]
```

File: `src/msw/products.msw.ts`

```ts
import { http, HttpResponse } from 'msw'
import { mockProducts } from './data/products.mock'

const API_BASE = 'http://localhost:3000'

export const productHandlers = [
  // GET /admin/products — danh sách products
  http.get(`${API_BASE}/admin/products`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 10

    const start = (page - 1) * limit
    const paginatedProducts = mockProducts.slice(start, start + limit)

    return HttpResponse.json({
      message: 'Success',
      data: {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          page_size: paginatedProducts.length,
          total: mockProducts.length,
          total_pages: Math.ceil(mockProducts.length / limit),
        },
      },
    })
  }),

  // GET /admin/products/:id — chi tiết product
  http.get(`${API_BASE}/admin/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p._id === params.id)
    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Success', data: product })
  }),

  // POST /admin/products — tạo product
  http.post(`${API_BASE}/admin/products`, async ({ request }) => {
    const body = await request.json()
    const newProduct = {
      _id: `prod-${Date.now()}`,
      ...body,
      rating: 0,
      sold: 0,
      view: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ message: 'Product created', data: newProduct }, { status: 201 })
  }),

  // DELETE /admin/products/:id
  http.delete(`${API_BASE}/admin/products/:id`, ({ params }) => {
    const exists = mockProducts.find((p) => p._id === params.id)
    if (!exists) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Product deleted' })
  }),
]
```

File: `src/msw/auth.msw.ts`

```ts
import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:3000'

export const authHandlers = [
  http.post(`${API_BASE}/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    // Simulate invalid credentials
    if (body.email === 'wrong@email.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    return HttpResponse.json({
      message: 'Login success',
      data: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          _id: 'user-1',
          email: body.email,
          name: 'Admin User',
          roles: ['Admin'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    })
  }),

  http.post(`${API_BASE}/logout`, () => {
    return HttpResponse.json({ message: 'Logout success' })
  }),

  http.post(`${API_BASE}/refresh-access-token`, () => {
    return HttpResponse.json({
      data: { access_token: 'new-mock-access-token' },
    })
  }),
]
```

File: `src/msw/handlers.ts` — Tổng hợp tất cả handlers

```ts
import { authHandlers } from './auth.msw'
import { productHandlers } from './products.msw'
// import { categoryHandlers } from './categories.msw'
// import { orderHandlers } from './orders.msw'
// ... thêm handlers khác

export const handlers = [
  ...authHandlers,
  ...productHandlers,
  // ...categoryHandlers,
  // ...orderHandlers,
]
```

### 8.3. Override handlers trong test cụ thể

```ts
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'

it('should show error when API returns 500', async () => {
  // Override CHỈ cho test này — tự reset sau mỗi test (afterEach)
  server.use(
    http.get('*/admin/products', () => {
      return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }),
  )

  // ... test logic
})

it('should handle empty product list', async () => {
  server.use(
    http.get('*/admin/products', () => {
      return HttpResponse.json({
        message: 'Success',
        data: {
          products: [],
          pagination: { page: 1, limit: 10, page_size: 0, total: 0 },
        },
      })
    }),
  )

  // ... test logic
})

it('should handle network error', async () => {
  server.use(
    http.get('*/admin/products', () => {
      return HttpResponse.error() // Simulate network failure
    }),
  )

  // ... test logic
})
```

### 8.4. MSW Best Practices

```
┌─────────────────────────────────────────────────┐
│           MSW BEST PRACTICES                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✅ DO:                                         │
│  • Default handlers trả về happy path           │
│  • Override trong test cụ thể cho error cases   │
│  • Mock data sát với real API response          │
│  • Dùng wildcard (*) cho base URL               │
│  • Test cả 4xx và 5xx errors                    │
│  • Test network failure (HttpResponse.error())  │
│                                                 │
│  ❌ DON'T:                                      │
│  • Đừng mock quá nhiều logic trong handler      │
│  • Đừng share mutable state giữa handlers       │
│  • Đừng quên reset handlers (afterEach)         │
│  • Đừng hardcode URL — dùng constant            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 9. Snapshot Testing

Snapshot testing capture output của component và so sánh với lần chạy trước.

### 9.1. Khi nào NÊN dùng snapshot?

| Nên dùng                                    | Không nên dùng                          |
| ------------------------------------------- | --------------------------------------- |
| UI components ít thay đổi (StatCard, Badge) | Components thay đổi thường xuyên        |
| Kiểm tra structure tổng thể                 | Components có dynamic data (timestamps) |
| Detect unintended UI changes                | Components phức tạp (DataTable)         |
| Shared/reusable components                  | Page-level components                   |

### 9.2. Ví dụ: Snapshot test cho `EmptyState`

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('should match snapshot with default props', () => {
    const { container } = render(<EmptyState />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should match snapshot with custom props', () => {
    const { container } = render(
      <EmptyState
        title="No products"
        description="Add your first product to get started."
        action={{ label: 'Add Product', onClick: () => {} }}
      />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
```

### 9.3. Inline Snapshot (khuyến khích hơn)

Inline snapshot lưu trực tiếp trong file test — dễ review hơn:

```tsx
it('should render error icon and message', () => {
  const { container } = render(<ErrorState message="Network error" />)

  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      aria-live="assertive"
      class="flex flex-col items-center justify-center py-12 text-center"
      role="alert"
    >
      ...
    </div>
  `)
})
```

### 9.4. Snapshot Best Practices

```
⚠️ QUAN TRỌNG:
• Snapshot KHÔNG thay thế behavior test — nó BỔ SUNG
• Luôn viết behavior test TRƯỚC, snapshot test SAU
• Review snapshot changes cẩn thận khi update
• Dùng toMatchInlineSnapshot() cho small components
• Dùng toMatchSnapshot() cho larger structures
• Cập nhật snapshot: vitest run --update
```

---

## 10. Integration Testing

Integration test kiểm tra nhiều components/modules hoạt động cùng nhau.

### 10.1. Ví dụ: Test Login Flow (End-to-End trong browser)

File: `test/integration/login-flow.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from 'src/pages/Login/LoginPage'
import { renderWithProviders } from 'src/test-utils'
import { server } from '../../vitest.setup'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' }),
  }
})

describe('Login Flow Integration', () => {
  it('should complete full login flow: validate → submit → redirect', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    // Step 1: Thử submit form trống → validation errors
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })

    // Step 2: Nhập email hợp lệ nhưng password ngắn
    await user.type(screen.getByLabelText('Email'), 'admin@shopee.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })

    // Step 3: Sửa password → submit thành công
    await user.clear(screen.getByLabelText('Password'))
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Step 4: Verify redirect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })

    // Step 5: Verify token được lưu
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token')
  })

  it('should handle login failure → retry → success flow', async () => {
    const user = userEvent.setup()
    let attemptCount = 0

    server.use(
      http.post('*/login', () => {
        attemptCount++
        if (attemptCount === 1) {
          return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }
        return HttpResponse.json({
          message: 'Success',
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            user: { _id: '1', email: 'admin@shopee.com', roles: ['Admin'] },
          },
        })
      }),
    )

    renderWithProviders(<LoginPage />)

    // Attempt 1: Fail
    await user.type(screen.getByLabelText('Email'), 'admin@shopee.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Attempt 2: Success
    await user.clear(screen.getByLabelText('Password'))
    await user.type(screen.getByLabelText('Password'), 'correctpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
})
```

### 10.2. Ví dụ: Test Zustand Store

File: `src/stores/auth.store.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import type { User } from 'src/types'

const mockUser: User = {
  _id: 'user-1',
  email: 'admin@shopee.com',
  name: 'Admin',
  roles: ['Admin'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      accessToken: '',
      refreshToken: '',
      user: null,
      isAuthenticated: false,
    })
    localStorage.clear()
  })

  it('should start with unauthenticated state', () => {
    const state = useAuthStore.getState()

    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBe('')
  })

  it('should login and update state + localStorage', () => {
    useAuthStore.getState().login('access-token', 'refresh-token', mockUser)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
    expect(state.accessToken).toBe('access-token')
    expect(localStorage.getItem('accessToken')).toBe('access-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
  })

  it('should logout and clear state + localStorage', () => {
    // Login first
    useAuthStore.getState().login('token', 'refresh', mockUser)

    // Then logout
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('should update tokens via setTokens', () => {
    useAuthStore.getState().setTokens('new-access', 'new-refresh')

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('new-access')
    expect(state.refreshToken).toBe('new-refresh')
  })
})
```

### 10.3. Khi nào viết Integration Test?

```
┌─────────────────────────────────────────────────┐
│     KHI NÀO CẦN INTEGRATION TEST?              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✅ User flows quan trọng:                      │
│     • Login → Dashboard                         │
│     • CRUD Product (Create → List → Edit)       │
│     • Search → Filter → Paginate                │
│                                                 │
│  ✅ Nhiều modules tương tác:                     │
│     • Form submit → API call → Toast → Redirect │
│     • Store update → UI re-render               │
│                                                 │
│  ❌ KHÔNG cần integration test cho:              │
│     • Pure UI components (dùng component test)  │
│     • Utility functions (dùng unit test)        │
│     • Third-party library behavior              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 11. Test Helpers & Wrapper

### 11.1. Custom render với tất cả providers

Đã định nghĩa ở Section 6.1 (`src/test-utils/index.tsx`). Đây là file quan trọng nhất — mọi component test đều dùng.

### 11.2. Mock data factories

File: `src/test-utils/factories.ts`

```ts
import type { Product, User, Category, Order } from 'src/types'

let idCounter = 0

export function createMockProduct(overrides?: Partial<Product>): Product {
  idCounter++
  return {
    _id: `prod-${idCounter}`,
    name: `Test Product ${idCounter}`,
    image: 'https://example.com/image.jpg',
    images: [],
    description: 'Test description',
    category: { _id: 'cat-1', name: 'Test Category' },
    price: 100000,
    rating: 4.5,
    price_before_discount: 120000,
    quantity: 50,
    sold: 10,
    view: 100,
    location: 'Hồ Chí Minh',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockUser(overrides?: Partial<User>): User {
  idCounter++
  return {
    _id: `user-${idCounter}`,
    email: `user${idCounter}@test.com`,
    name: `Test User ${idCounter}`,
    roles: ['User'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// Tạo danh sách mock data
export function createMockProducts(count: number): Product[] {
  return Array.from({ length: count }, () => createMockProduct())
}
```

Sử dụng trong test:

```ts
import { createMockProduct, createMockProducts } from 'src/test-utils/factories'

it('should render product list', () => {
  const products = createMockProducts(5)
  // ... render with products
})

it('should handle product with no description', () => {
  const product = createMockProduct({ description: undefined })
  // ... render with product
})
```

---

## 12. Coverage & CI

### 12.1. Chạy coverage

```bash
pnpm test:coverage
```

Output sẽ hiển thị:

```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   72.5  |   65.3   |   70.1  |   72.5  |
 utils/format.ts    |   100   |   100    |   100   |   100   |
 hooks/useProducts  |   85.7  |   75.0   |   100   |   85.7  |
 stores/auth.store  |   90.0  |   80.0   |   100   |   90.0  |
--------------------|---------|----------|---------|---------|
```

### 12.2. Coverage thresholds khuyến nghị

| Giai đoạn | Lines | Functions | Branches | Statements |
| --------- | ----- | --------- | -------- | ---------- |
| Bắt đầu   | 50%   | 50%       | 40%      | 50%        |
| Ổn định   | 70%   | 70%       | 60%      | 70%        |
| Mature    | 80%   | 80%       | 70%      | 80%        |

### 12.3. Những gì KHÔNG cần coverage

- `src/components/ui/**` — shadcn components (third-party)
- `src/types/**` — chỉ là type definitions
- `src/main.tsx` — entry point
- `src/vite-env.d.ts` — type declarations

### 12.4. Scripts cho CI

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=junit --outputFile=test-results/junit.xml"
  }
}
```

---

## 13. Checklist Trước Khi Merge

Mỗi PR có test mới phải pass checklist này:

- [ ] Test chạy pass: `pnpm test:run`
- [ ] Coverage không giảm: `pnpm test:coverage`
- [ ] Mỗi test case chỉ test 1 behavior
- [ ] Dùng `userEvent` thay vì `fireEvent`
- [ ] Query elements bằng role/label, không bằng class/testid
- [ ] Async operations dùng `waitFor()`
- [ ] MSW handlers cho mọi API endpoint được gọi
- [ ] Error cases được test (API 4xx, 5xx, network error)
- [ ] Edge cases được test (empty data, null, boundary values)
- [ ] Không có `console.log` trong test files
- [ ] Test names mô tả behavior, không mô tả implementation

---

## Tổng Kết: Thứ Tự Triển Khai

```
Phase 1: Setup (1 ngày)
├── Cài dependencies
├── Cấu hình vitest trong vite.config.ts
├── Tạo vitest.setup.ts
├── Tạo src/test-utils/index.tsx
└── Tạo src/test-utils/factories.ts

Phase 2: Unit Tests (2-3 ngày)
├── src/utils/format.test.ts
├── src/lib/utils.test.ts
└── src/stores/auth.store.test.ts

Phase 3: MSW Setup + Hook Tests (2-3 ngày)
├── src/msw/data/*.mock.ts
├── src/msw/*.msw.ts
├── src/msw/handlers.ts
├── src/hooks/useProducts.test.ts
├── src/hooks/useCategories.test.ts
└── src/hooks/useProductForm.test.ts

Phase 4: Component Tests (3-5 ngày)
├── src/components/shared/StatCard.test.tsx
├── src/components/shared/ConfirmDialog.test.tsx
├── src/components/shared/ErrorState.test.tsx
├── src/components/shared/EmptyState.test.tsx
├── src/components/shared/LoadingState.test.tsx
├── src/components/shared/DataTable.test.tsx
└── src/pages/Login/LoginPage.test.tsx

Phase 5: Integration Tests (2-3 ngày)
├── test/integration/login-flow.test.tsx
├── test/integration/product-crud.test.tsx
└── test/integration/category-management.test.tsx

Phase 6: Coverage & CI (1 ngày)
├── Đạt coverage thresholds
├── Setup CI pipeline
└── Viết documentation
```

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   "Write tests. Not too many. Mostly            │
│    integration."                                │
│                        — Guillermo Rauch        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 14. FAQ — Câu Hỏi Thường Gặp

### Q: Tại sao không dùng Jest?

**A**: Project dùng Vite. Jest cần cấu hình babel transforms, `moduleNameMapper` cho path aliases, và không hỗ trợ `import.meta.env`. Vitest native với Vite, zero-config, nhanh hơn 10-20x trong watch mode, và API 99% tương thích Jest.

### Q: Khi nào dùng `getBy` vs `queryBy` vs `findBy`?

**A**:

- `getByRole(...)` — element PHẢI tồn tại, throw error nếu không tìm thấy → dùng cho assertions "có tồn tại"
- `queryByText(...)` — trả về `null` nếu không tìm thấy → dùng cho assertions "KHÔNG tồn tại" (`expect(...).not.toBeInTheDocument()`)
- `findByText(...)` — trả về Promise, chờ element xuất hiện → dùng cho async rendering (sau API call, sau state update)

### Q: Tại sao dùng `userEvent` thay vì `fireEvent`?

**A**: `fireEvent` dispatch raw DOM events. `userEvent` simulate hành vi thật của user (focus → keydown → keypress → input → keyup). Nó bắt được nhiều bug hơn, ví dụ: button bị disabled nhưng `fireEvent.click` vẫn trigger, còn `userEvent.click` thì không.

### Q: Có cần test shadcn/ui components không?

**A**: Không. Đây là third-party components đã được test upstream. Chỉ test khi bạn customize behavior của chúng. Coverage config đã exclude `src/components/ui/**`.

### Q: MSW handler bị lỗi "unhandled request" — làm sao fix?

**A**: Kiểm tra URL trong handler có khớp với URL mà axios gọi không. Lưu ý `API_BASE_URL` trong `src/utils/http.ts` — mặc định là `http://localhost:3000/`. Handler phải match chính xác URL đó. Dùng wildcard `*/admin/products` khi override trong test cụ thể.

### Q: Test bị flaky (lúc pass lúc fail) — nguyên nhân phổ biến?

**A**:

1. Quên `retry: false` trong test QueryClient → TanStack Query retry 3 lần
2. Quên `waitFor()` cho async assertions
3. Shared state giữa tests (Zustand store, localStorage) → luôn reset trong `beforeEach`
4. MSW handler không reset → `afterEach` phải gọi `server.resetHandlers()`

### Q: Nên test private functions không?

**A**: Không. Test behavior thông qua public API. Nếu một private function quan trọng đến mức cần test riêng, có thể nó nên được extract thành utility function.

---

## 15. Tài Liệu Tham Khảo

| Tài liệu                                 | Link                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Vitest Documentation                     | https://vitest.dev                                                     |
| React Testing Library                    | https://testing-library.com/docs/react-testing-library/intro           |
| MSW v2 Documentation                     | https://mswjs.io/docs                                                  |
| Testing Library Query Priority           | https://testing-library.com/docs/queries/about#priority                |
| Kent C. Dodds — Common Mistakes with RTL | https://kentcdodds.com/blog/common-mistakes-with-react-testing-library |
| TanStack Query — Testing Guide           | https://tanstack.com/query/latest/docs/react/guides/testing            |
| Zustand — Testing Stores                 | https://zustand.docs.pmnd.rs/guides/testing                            |

---

## Kết Luận

Testing không phải là viết code thêm cho vui — nó là **bảo hiểm** cho codebase. Mỗi test case là một lời cam kết rằng feature đó hoạt động đúng, và sẽ tiếp tục hoạt động đúng khi code thay đổi.

Với shopee-admin, chiến lược testing tập trung vào:

1. **Vitest** — native Vite, nhanh, zero-config
2. **MSW** — mock API ở network level, realistic, reusable
3. **React Testing Library** — test behavior từ góc nhìn user, không test implementation
4. **Co-located tests** — test file cạnh source file, dễ tìm dễ maintain
5. **Progressive coverage** — bắt đầu 70%, tăng dần khi codebase mature

Bắt đầu từ những thứ đơn giản nhất (utility functions), xây dựng dần lên (hooks → components → integration), và luôn nhớ: **test behavior, không test implementation**.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Một test tốt trả lời câu hỏi:                │
│   "Nếu code này bị sửa sai, test nào sẽ fail?" │
│                                                 │
│   Nếu không test nào fail → bạn thiếu test.     │
│   Nếu 50 tests fail → bạn test quá chi tiết.   │
│                                                 │
└─────────────────────────────────────────────────┘
```
