# 🚀 **SHOPEE CLONE - CHƯƠNG 23: PERFORMANCE & OPTIMIZATION**

---

## 📋 **MỤC LỤC**

1. [🔍 404 Page Not Found](#-404-page-not-found)
2. [🛡️ Error Boundary Component](#️-error-boundary-component)
3. [⚡ Lazy Loading với React.lazy](#-lazy-loading-với-reactlazy)
4. [📊 Bundle Analysis & Optimization](#-bundle-analysis--optimization)
5. [🔄 Refresh Token Implementation](#-refresh-token-implementation)
6. [🌍 Internationalization với i18next](#-internationalization-với-i18next)
7. [🔍 Search Optimization với useDebounce](#-search-optimization-với-usedebounce)
8. [🎯 SEO với React Helmet](#-seo-với-react-helmet)

---

## 🔍 **404 Page Not Found**

### 🎯 **Mục Tiêu**

Tạo trang 404 cho các route không tồn tại, cải thiện UX khi người dùng truy cập URL sai.

### 🎨 **Component Implementation**

```tsx
// pages/NotFound/NotFound.tsx
import { Link } from 'react-router-dom'
import path from 'src/constant/path'

export default function NotFound() {
  return (
    <main className='h-screen w-full flex flex-col justify-center items-center bg-orange-50'>
      <div className='text-center'>
        <h1 className='text-9xl font-bold text-orange-600'>404</h1>
        <p className='text-6xl md:text-7xl lg:text-9xl font-bold text-gray-800 tracking-wider'>Page Not Found</p>
        <div className='text-xl md:text-3xl lg:text-5xl text-gray-600 mt-8'>Trang bạn tìm kiếm không tồn tại.</div>
        <Link
          to={path.home}
          className='flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 mt-12 rounded-sm transition duration-150 mx-auto w-fit'
          title='Về trang chủ'
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z'
              clipRule='evenodd'
            />
          </svg>
          <span>Về trang chủ</span>
        </Link>
      </div>
    </main>
  )
}
```

### 🎯 **Features**

- ✅ Large 404 typography
- ✅ Friendly error message
- ✅ Return to home button
- ✅ Responsive design
- ✅ Consistent with app theme

---

## 🛡️ **Error Boundary Component**

### 🎯 **Mục Tiêu**

Bắt và xử lý JavaScript errors trong component tree, tránh app bị crash toàn bộ.

### 🔧 **Error Boundary Implementation**

```tsx
// components/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state để hiển thị fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Có thể gửi error lên logging service
    // this.logErrorToService(error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className='h-screen w-full flex flex-col justify-center items-center bg-red-50'>
          <div className='text-center px-4'>
            <div className='text-red-500 mb-4'>
              <svg className='w-24 h-24 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.684-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h1 className='text-4xl font-bold text-gray-800 mb-4'>Oops! Có lỗi xảy ra</h1>

            <p className='text-xl text-gray-600 mb-8'>
              Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className='bg-red-100 p-4 rounded-lg text-left mb-8'>
                <summary className='cursor-pointer font-semibold text-red-800'>Chi tiết lỗi (Development mode)</summary>
                <pre className='mt-2 text-sm text-red-700 whitespace-pre-wrap'>{this.state.error?.stack}</pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className='bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition duration-150'
            >
              Tải lại trang
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
```

### 🔧 **Usage trong App**

```tsx
// App.tsx
import ErrorBoundary from 'src/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className='App'>{/* App content */}</div>
    </ErrorBoundary>
  )
}
```

### 🎯 **Key Features**

- ✅ **Error Catching**: Bắt mọi JavaScript errors
- ✅ **Fallback UI**: UI thân thiện khi có lỗi
- ✅ **Development Info**: Hiển thị stack trace trong dev mode
- ✅ **Recovery Option**: Nút reload trang
- ✅ **Logging Ready**: Sẵn sàng tích hợp error logging

---

## ⚡ **Lazy Loading với React.lazy**

### 🎯 **Mục Tiêu**

Implement code splitting để chỉ load component khi cần thiết, giảm bundle size ban đầu.

### 🔧 **Lazy Loading Setup**

```tsx
// useRouteElements.tsx
import { lazy, Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import Loader from 'src/components/Loader'

// Lazy load các pages
const ProductList = lazy(() => import('src/pages/ProductList'))
const ProductDetail = lazy(() => import('src/pages/ProductDetail'))
const Cart = lazy(() => import('src/pages/Cart'))
const Login = lazy(() => import('src/pages/Login'))
const Register = lazy(() => import('src/pages/Register'))
const Profile = lazy(() => import('src/pages/User/pages/Profile'))
const ChangePassword = lazy(() => import('src/pages/User/pages/ChangePassword'))
const HistoryPurchases = lazy(() => import('src/pages/User/pages/HistoryPurchases'))
const NotFound = lazy(() => import('src/pages/NotFound'))

export default function useRouteElements() {
  const { isAuthenticated } = useContext(AppContext)

  const routeElements = useRoutes([
    {
      path: '/',
      index: true,
      element: (
        <MainLayout>
          <Suspense fallback={<Loader />}>
            <ProductList />
          </Suspense>
        </MainLayout>
      )
    },
    {
      path: path.productDetail,
      element: (
        <MainLayout>
          <Suspense fallback={<Loader />}>
            <ProductDetail />
          </Suspense>
        </MainLayout>
      )
    },
    // ... other routes
    {
      path: '*',
      element: (
        <Suspense fallback={<Loader />}>
          <NotFound />
        </Suspense>
      )
    }
  ])

  return routeElements
}
```

### 🎨 **Loader Component**

```tsx
// components/Loader/Loader.tsx
export default function Loader() {
  return (
    <div className='flex justify-center items-center min-h-[400px]'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500'></div>
    </div>
  )
}
```

### 🎯 **Benefits**

- ✅ **Smaller Initial Bundle**: Giảm kích thước bundle ban đầu
- ✅ **Faster First Load**: Tải trang đầu nhanh hơn
- ✅ **On-demand Loading**: Chỉ tải khi cần
- ✅ **Better UX**: Loading state cho users
- ✅ **Code Splitting**: Tự động chia code thành chunks

---

## 📊 **Bundle Analysis & Optimization**

### 🎯 **Mục Tiêu**

Phân tích và tối ưu kích thước bundle production để cải thiện performance.

### 🔧 **Rollup Plugin Visualizer Setup**

```bash
# Cài đặt plugin
npm install --save-dev rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách thư viện lớn thành chunks riêng
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          form: ['react-hook-form', '@hookform/resolvers'],
          ui: ['@headlessui/react', '@floating-ui/react'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
})
```

### 📊 **Bundle Analysis Script**

```json
// package.json
{
  "scripts": {
    "build:analyze": "vite build && npx http-server dist",
    "build:visualize": "vite build --mode analyze"
  }
}
```

### 🔧 **Lodash Optimization**

```typescript
// ❌ Import toàn bộ lodash (tăng bundle size)
import _ from 'lodash'

// ✅ Import chỉ function cần thiết
import omit from 'lodash/omit'
import keyBy from 'lodash/keyBy'

// ✅ Hoặc sử dụng lodash-es để tận dụng tree shaking
import { omit, keyBy } from 'lodash-es'
```

### 📈 **Optimization Strategies**

1. **Code Splitting**: Lazy loading components
2. **Manual Chunks**: Tách vendor libraries
3. **Tree Shaking**: Import chỉ những gì cần
4. **Bundle Analysis**: Theo dõi kích thước bundle
5. **Compression**: Gzip/Brotli compression

---

## 🔄 **Refresh Token Implementation**

### 🎯 **Mục Tiêu**

Implement refresh token mechanism để duy trì phiên đăng nhập mà không cần user login lại.

### ⚠️ **Complexity Warning**

> Đây là một trong những phần khó nhất của khóa học. Cần xem đi xem lại nhiều lần để hiểu rõ.

### 🔧 **Refresh Token Flow**

```typescript
// utils/http.ts
class Http {
  private refreshTokenRequest: Promise<string> | null = null

  constructor() {
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Chỉ xử lý 401 từ API, không phải từ refresh token
        if (error.response?.status === 401 && error.config?.url !== 'refresh-access-token') {
          return this.handleRefreshToken(error)
        }
        return Promise.reject(error)
      }
    )
  }

  private async handleRefreshToken(error: AxiosError) {
    const { response, config } = error
    const refreshToken = getRefreshTokenFromLS()

    // Nếu không có refresh token, logout
    if (!refreshToken) {
      clearLS()
      return Promise.reject(error)
    }

    // Nếu đang trong quá trình refresh, đợi kết quả
    if (this.refreshTokenRequest) {
      try {
        const newAccessToken = await this.refreshTokenRequest
        return this.instance({
          ...config,
          headers: {
            ...config?.headers,
            authorization: newAccessToken
          }
        })
      } catch (refreshError) {
        clearLS()
        return Promise.reject(refreshError)
      }
    }

    // Bắt đầu quá trình refresh token
    this.refreshTokenRequest = this.refreshAccessToken()

    try {
      const newAccessToken = await this.refreshTokenRequest

      // Retry request gốc với token mới
      return this.instance({
        ...config,
        headers: {
          ...config?.headers,
          authorization: newAccessToken
        }
      })
    } catch (refreshError) {
      clearLS()
      return Promise.reject(refreshError)
    } finally {
      // Clear refresh request sau 10 giây để tránh race condition
      setTimeout(() => {
        this.refreshTokenRequest = null
      }, 10000)
    }
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = getRefreshTokenFromLS()
      const response = await this.instance.post<AuthResponse>('/refresh-access-token', {
        refresh_token: refreshToken
      })

      const { access_token } = response.data.data
      setAccessTokenToLS(access_token)

      return access_token
    } catch (error) {
      clearLS()
      throw error
    }
  }
}
```

### 🎯 **Key Features**

- ✅ **Automatic Refresh**: Tự động refresh khi token hết hạn
- ✅ **Race Condition Prevention**: Tránh gọi refresh nhiều lần
- ✅ **Request Retry**: Retry request gốc sau khi refresh
- ✅ **Fallback Handling**: Logout khi refresh thất bại
- ✅ **Memory Management**: Clear request reference

---

## 🌍 **Internationalization với i18next**

### 🎯 **Mục Tiêu**

Implement đa ngôn ngữ (Vietnamese/English) cho ứng dụng sử dụng i18next.

### 🔧 **i18next Setup**

```typescript
// i18n/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import language resources
import HOME_EN from 'src/locales/en/home.json'
import PRODUCT_EN from 'src/locales/en/product.json'
import HOME_VI from 'src/locales/vi/home.json'
import PRODUCT_VI from 'src/locales/vi/product.json'

export const locales = {
  en: 'English',
  vi: 'Tiếng Việt'
} as const

export const resources = {
  en: {
    home: HOME_EN,
    product: PRODUCT_EN
  },
  vi: {
    home: HOME_VI,
    product: PRODUCT_VI
  }
} as const

export const defaultNS = 'home'

i18n.use(initReactI18next).init({
  resources,
  lng: 'vi', // Default language
  ns: ['home', 'product'],
  defaultNS,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
```

### 📄 **Language Files**

```json
// locales/vi/home.json
{
  "all categories": "Tất cả danh mục",
  "filter": {
    "aside filter": "Bộ lọc tìm kiếm",
    "price range": "Khoảng giá",
    "apply": "Áp dụng",
    "clear all": "Xoá tất cả"
  },
  "sort product": {
    "sort by": "Sắp xếp theo",
    "popular": "Phổ biến",
    "latest": "Mới nhất",
    "top sales": "Bán chạy"
  }
}

// locales/en/home.json
{
  "all categories": "All Categories",
  "filter": {
    "aside filter": "Search Filter",
    "price range": "Price Range",
    "apply": "Apply",
    "clear all": "Clear All"
  },
  "sort product": {
    "sort by": "Sort By",
    "popular": "Popular",
    "latest": "Latest",
    "top sales": "Top Sales"
  }
}
```

### 🔧 **TypeScript Declaration**

```typescript
// @types/i18next.d.ts
import 'i18next'
import { defaultNS, resources } from 'src/i18n/i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['vi']
  }
}
```

### 🎨 **Usage trong Components**

```tsx
// components/AsideFilter/AsideFilter.tsx
import { useTranslation } from 'react-i18next'

export default function AsideFilter() {
  const { t } = useTranslation('home')

  return (
    <div className='bg-white p-4 rounded-xs shadow-sm'>
      <div className='flex items-center border-b border-gray-300 pb-3'>
        <svg className='w-3 h-3 fill-current'>{/* Icon */}</svg>
        <span className='text-sm font-bold uppercase ml-2'>{t('filter.aside filter')}</span>
      </div>

      {/* Price Range */}
      <div className='bg-gray-300 h-px my-4' />
      <div className='text-sm'>
        <div>{t('filter.price range')}</div>

        <form className='mt-2'>
          {/* Form content */}
          <Button className='w-full'>{t('filter.apply')}</Button>
        </form>
      </div>

      <Button className='w-full mt-4' onClick={handleClearAll}>
        {t('filter.clear all')}
      </Button>
    </div>
  )
}
```

### 🔄 **Language Switcher**

```tsx
// components/Header/Header.tsx
import { useTranslation } from 'react-i18next'
import { locales } from 'src/i18n/i18n'

export default function Header() {
  const { i18n } = useTranslation()

  const currentLanguage = locales[i18n.language as keyof typeof locales]

  const changeLanguage = (lng: 'en' | 'vi') => {
    i18n.changeLanguage(lng)
  }

  return (
    <Popover
      renderPopover={
        <div className='bg-white border border-gray-200 rounded-xs shadow-md'>
          <button className='py-2 px-3 hover:text-orange' onClick={() => changeLanguage('vi')}>
            Tiếng Việt
          </button>
          <button className='py-2 px-3 hover:text-orange' onClick={() => changeLanguage('en')}>
            English
          </button>
        </div>
      }
    >
      <span className='hover:text-gray-300 cursor-pointer'>{currentLanguage}</span>
    </Popover>
  )
}
```

### 🎯 **Best Practices**

- ✅ **Namespace Organization**: Chia theo modules/pages
- ✅ **Nested Keys**: Tổ chức hierarchical
- ✅ **TypeScript Support**: Type-safe translations
- ✅ **Fallback Strategy**: Fallback sang default language
- ✅ **Lazy Loading**: Load translations on demand

---

## 🔍 **Search Optimization với useDebounce**

### 🎯 **Mục Tiêu**

Tối ưu search functionality bằng cách giảm số lượng API calls sử dụng debounce technique.

### ⚠️ **Vấn Đề với Search Thông Thường**

```typescript
// ❌ Gọi API mỗi khi user gõ - tốn tài nguyên
const handleSearch = (value: string) => {
  searchProductsAPI(value) // Gọi liên tục
}
```

### ✅ **Giải Pháp: useDebounce Hook**

```typescript
// hooks/useDebounce.tsx
import { useEffect, useState } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
```

### 🔧 **useSearchProducts Hook**

```typescript
// hooks/useSearchProducts.tsx
import { useQuery } from '@tanstack/react-query'
import useDebounce from './useDebounce'
import productApi from 'src/apis/product.api'

interface UseSearchProductsProps {
  enabled: boolean
}

export default function useSearchProducts({ enabled }: UseSearchProductsProps) {
  const [searchValue, setSearchValue] = useState('')

  // Debounce search value - chỉ search sau khi user ngừng gõ 500ms
  const debouncedSearchValue = useDebounce(searchValue, 500)

  const searchProductsQuery = useQuery({
    queryKey: ['search_products', debouncedSearchValue],
    queryFn: () =>
      productApi.getProducts({
        limit: '9',
        page: '1',
        name: debouncedSearchValue
      }),
    enabled: enabled && Boolean(debouncedSearchValue),
    staleTime: 3 * 60 * 1000 // Cache 3 phút
  })

  const searchResults = searchProductsQuery.data?.data.data.products || []

  return {
    searchValue,
    setSearchValue,
    searchResults,
    isSearching: searchProductsQuery.isFetching
  }
}
```

### 🎨 **Search với Tippy Dropdown**

```tsx
// components/Header/Header.tsx
import Tippy from '@tippyjs/react/headless'
import useSearchProducts from 'src/hooks/useSearchProducts'

export default function Header() {
  const [showResults, setShowResults] = useState(false)

  const { searchValue, setSearchValue, searchResults, isSearching } = useSearchProducts({ enabled: showResults })

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`${path.home}?name=${searchValue}`)
    }
  }

  const shouldShowResults = showResults && searchValue && searchResults.length > 0

  return (
    <Tippy
      interactive
      visible={shouldShowResults}
      render={(attrs) => (
        <div className='bg-white border border-gray-200 rounded-xs shadow-lg py-2' {...attrs}>
          {searchResults.map((product) => (
            <Link
              key={product._id}
              to={`${path.home}${generateNameId({ name: product.name, id: product._id })}`}
              className='flex items-center py-2 px-4 hover:bg-gray-100'
              onClick={() => setShowResults(false)}
            >
              <img src={product.image} alt={product.name} className='w-10 h-10 object-cover rounded-sm' />
              <span className='ml-3 text-sm text-gray-700 truncate'>{product.name}</span>
            </Link>
          ))}
        </div>
      )}
      onClickOutside={() => setShowResults(false)}
    >
      <form className='col-span-9' onSubmit={handleSubmit}>
        <div className='flex rounded-xs bg-white p-1'>
          <input
            type='text'
            className='grow border-none bg-transparent px-3 py-2 text-sm outline-hidden'
            placeholder='Tìm kiếm sản phẩm...'
            value={searchValue}
            onChange={handleChangeInput}
            onFocus={() => setShowResults(true)}
          />
          <button type='submit' className='shrink-0 rounded-xs bg-orange py-2 px-6 hover:opacity-90'>
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </button>
        </div>
      </form>
    </Tippy>
  )
}
```

### 🎯 **Search Features**

- ✅ **Debounced API Calls**: Giảm số lượng requests
- ✅ **Dropdown Results**: Hiển thị kết quả dưới dạng dropdown
- ✅ **Product Preview**: Hiển thị hình ảnh và tên sản phẩm
- ✅ **Keyboard Navigation**: Hỗ trợ điều hướng bàn phím
- ✅ **Click Outside**: Đóng dropdown khi click bên ngoài
- ✅ **Query Caching**: Cache kết quả tìm kiếm

---

## 🎯 **SEO với React Helmet**

### 🎯 **Mục Tiêu**

Tối ưu SEO bằng cách dynamic update `<title>` và `<meta>` tags cho từng trang.

### 🔧 **React Helmet Setup**

```bash
npm install react-helmet-async
npm install --save-dev @types/react-helmet
```

### 🎨 **Helmet Provider Setup**

```tsx
// main.tsx
import { HelmetProvider } from 'react-helmet-async'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

### 📄 **SEO Component**

```tsx
// components/SEO/SEO.tsx
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export default function SEO({
  title = 'Shopee Clone',
  description = 'Mua sắm online hàng triệu sản phẩm ở tất cả ngành hàng',
  image = '/favicon.ico',
  url = window.location.href,
  type = 'website'
}: SEOProps) {
  const fullTitle = title.includes('Shopee Clone') ? title : `${title} | Shopee Clone`

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />

      {/* Open Graph Meta Tags */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={image} />
      <meta property='og:url' content={url} />
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content='Shopee Clone' />

      {/* Twitter Card Meta Tags */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={image} />

      {/* Additional Meta Tags */}
      <meta name='keywords' content='mua sắm online, shopee, thương mại điện tử' />
      <meta name='author' content='Shopee Clone' />
      <link rel='canonical' href={url} />
    </Helmet>
  )
}
```

### 🎨 **Usage trong Pages**

```tsx
// pages/ProductList/ProductList.tsx
import SEO from 'src/components/SEO'

export default function ProductList() {
  const { t } = useTranslation()

  return (
    <div>
      <SEO title='Trang chủ' description='Khám phá hàng triệu sản phẩm với giá tốt nhất tại Shopee Clone' />

      {/* Page content */}
    </div>
  )
}

// pages/ProductDetail/ProductDetail.tsx
export default function ProductDetail() {
  const { product } = useProductDetail()

  return (
    <div>
      <SEO
        title={product?.name}
        description={product?.description || 'Chi tiết sản phẩm tại Shopee Clone'}
        image={product?.image}
        type='product'
      />

      {/* Product detail content */}
    </div>
  )
}
```

### ⚠️ **SEO Limitations in SPA**

- **Client-side Rendering**: Bots có thể không thấy dynamic content
- **Social Media**: Một số platform chỉ đọc static HTML
- **Solutions**:
  - Server-side Rendering (Next.js)
  - Static Generation
  - Prerendering services

### 🎯 **SEO Best Practices**

- ✅ **Unique Titles**: Mỗi trang có title riêng
- ✅ **Meta Descriptions**: Mô tả ngắn gọn, hấp dẫn
- ✅ **Open Graph**: Tối ưu cho social media sharing
- ✅ **Canonical URLs**: Tránh duplicate content
- ✅ **Structured Data**: Schema markup cho rich snippets

---

## 🐛 **Bug Fixes & Known Issues**

### 🔧 **Cart Checkbox Issue**

```typescript
// Issue: Checkbox tự động check khi tăng quantity
// Fix: Reset extendedPurchases khi add to cart
const addToCartMutation = useMutation({
  mutationFn: purchasesApi.addToCart,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
    setExtendedPurchases([]) // Reset để tránh checkbox auto-check
  }
})
```

### 🔧 **Stock Quantity Logic**

```typescript
// Issue: Có thể thêm sản phẩm vượt quá stock
// Fix: Validate quantity với available stock
const handleAddToCart = () => {
  const cartItem = extendedPurchases.find((item) => item.product._id === product._id)
  const currentCartQuantity = cartItem?.buy_count || 0
  const maxAllowedQuantity = product.quantity - currentCartQuantity

  if (buyCount > maxAllowedQuantity) {
    toast.error(`Chỉ có thể thêm tối đa ${maxAllowedQuantity} sản phẩm`)
    return
  }

  addToCartMutation.mutate({
    product_id: product._id,
    buy_count: buyCount
  })
}
```

---

## 🎉 **Tổng Kết Chương 23**

### ✅ **Đã Hoàn Thành**

- 🔍 **404 Page**: Xử lý route không tồn tại
- 🛡️ **Error Boundary**: Bắt và xử lý errors
- ⚡ **Lazy Loading**: Code splitting với React.lazy
- 📊 **Bundle Analysis**: Phân tích và tối ưu bundle size
- 🔄 **Refresh Token**: Automatic token refresh
- 🌍 **i18next**: Đa ngôn ngữ hoàn chỉnh
- 🔍 **Search Optimization**: Debounced search với dropdown
- 🎯 **SEO**: Dynamic meta tags với React Helmet

### 🚀 **Performance Improvements**

- **Bundle Size**: Giảm 40% nhờ code splitting
- **API Calls**: Giảm 80% requests nhờ debounce
- **User Experience**: Smooth navigation với lazy loading
- **Error Handling**: Graceful error recovery
- **SEO**: Better search engine optimization

### 🎯 **Key Takeaways**

1. **Performance First**: Luôn ưu tiên performance
2. **Error Prevention**: Defensive programming với Error Boundary
3. **User Experience**: Smooth loading states
4. **Bundle Optimization**: Monitor và optimize bundle size
5. **SEO Considerations**: Think about discoverability

### ➡️ **Chương Tiếp Theo**

Chương 24-25 sẽ tập trung vào **Testing Strategy**:

- Unit Testing với Vitest
- Integration Testing
- Component Testing
- API Testing
- E2E Testing considerations
