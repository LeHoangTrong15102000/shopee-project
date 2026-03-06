# 🚀 **CÁC VẤN ĐỀ HIỆN TẠI TRONG REACT 18+ VÀ GIẢI PHÁP**

---

## 📋 **MỤC LỤC**

1. [🔄 Excessive Re-renders](#-excessive-re-renders)
2. [🧠 Memory Leaks](#-memory-leaks)
3. [⚡ State Update Batching](#-state-update-batching)
4. [🔍 Context Performance Issues](#-context-performance-issues)
5. [📦 Bundle Size Problems](#-bundle-size-problems)
6. [🎯 Event Handler Recreation](#-event-handler-recreation)

---

## 🔄 **Excessive Re-renders**

### 🚨 **Vấn Đề**

Components re-render không cần thiết, gây performance issues trong large applications.

```tsx
// ❌ Problem - Parent re-render gây toàn bộ children re-render
function ProductList() {
  const [filter, setFilter] = useState('')
  const [products, setProducts] = useState([])

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {products.map((product) => (
        // Mỗi keystroke → ALL ProductCard re-render!
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### ✅ **Giải Pháp**

#### 1. **React.memo**

```tsx
// Trong Shopee Clone: src/components/Product/Product.tsx
const ProductCard = memo(({ product }: { product: Product }) => {
  return (
    <div className='product-card'>
      <h3>{product.name}</h3>
      <span>{product.price}</span>
    </div>
  )
})

// Chỉ re-render khi product props thay đổi
```

#### 2. **useMemo for Filtered Data**

```tsx
function ProductList() {
  const [filter, setFilter] = useState('')
  const [products, setProducts] = useState([])

  // Memoize filtered results
  const filteredProducts = useMemo(() => products.filter((p) => p.name.includes(filter)), [products, filter])

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

#### 3. **Component Splitting**

```tsx
// Tách input thành component riêng
function SearchInput({ onFilterChange }: { onFilterChange: (value: string) => void }) {
  const [localFilter, setLocalFilter] = useState('')

  const debouncedUpdate = useMemo(() => debounce(onFilterChange, 300), [onFilterChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilter(e.target.value)
    debouncedUpdate(e.target.value)
  }

  return <input value={localFilter} onChange={handleChange} />
}
```

---

## 🧠 **Memory Leaks**

### 🚨 **Vấn Đề**

Event listeners, timers, subscriptions không được cleanup khi component unmount.

```tsx
// ❌ Problem - Memory leaks
function ProductDetail({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    // Timer không được cleanup
    const interval = setInterval(() => {
      fetchLatestReviews(productId).then(setReviews)
    }, 30000)

    // Event listener không được cleanup
    window.addEventListener('scroll', handleScroll)

    // Subscription không được cleanup
    const subscription = reviewSocket.subscribe(productId, (newReview) => {
      setReviews((prev) => [...prev, newReview])
    })

    // ❌ Không cleanup khi unmount!
  }, [productId])
}
```

### ✅ **Giải Pháp**

#### 1. **Cleanup Functions**

```tsx
// ✅ Proper cleanup trong Shopee Clone
function ProductDetail({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestReviews(productId).then(setReviews)
    }, 30000)

    const handleScroll = () => {
      // Handle scroll logic
    }
    window.addEventListener('scroll', handleScroll)

    const subscription = reviewSocket.subscribe(productId, (newReview) => {
      setReviews((prev) => [...prev, newReview])
    })

    // ✅ Cleanup function
    return () => {
      clearInterval(interval)
      window.removeEventListener('scroll', handleScroll)
      subscription.unsubscribe()
    }
  }, [productId])
}
```

#### 2. **AbortController cho API Calls**

```tsx
function useProductData(productId: string) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/products/${productId}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then(setData)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error)
        }
      })

    return () => controller.abort()
  }, [productId])

  return data
}
```

---

## ⚡ **State Update Batching**

### 🚨 **Vấn Đề**

Multiple state updates gây multiple re-renders thay vì batch updates.

```tsx
// ❌ Problem - Multiple re-renders
function ShoppingCart() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [tax, setTax] = useState(0)

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev, item]) // Re-render #1
    setTotal((prev) => prev + item.price) // Re-render #2
    setTax((prev) => prev + item.price * 0.1) // Re-render #3
    // Total: 3 re-renders cho 1 action!
  }
}
```

### ✅ **Giải Pháp**

#### 1. **React 18 Automatic Batching**

```tsx
// ✅ React 18 tự động batch
function ShoppingCart() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [tax, setTax] = useState(0)

  const addItem = (item: CartItem) => {
    // React 18 automatically batches these
    setItems((prev) => [...prev, item])
    setTotal((prev) => prev + item.price)
    setTax((prev) => prev + item.price * 0.1)
    // Only 1 re-render in React 18!
  }
}
```

#### 2. **useReducer for Complex State**

```tsx
interface CartState {
  items: CartItem[]
  total: number
  tax: number
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      const newItem = action.payload
      const newItems = [...state.items, newItem]
      const newTotal = state.total + newItem.price
      const newTax = newTotal * 0.1

      return {
        items: newItems,
        total: newTotal,
        tax: newTax
      }
    default:
      return state
  }
}

function ShoppingCart() {
  const [cartState, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    tax: 0
  })

  const addItem = (item: CartItem) => {
    // Single dispatch = single re-render
    dispatch({ type: 'ADD_ITEM', payload: item })
  }
}
```

---

## 🔍 **Context Performance Issues**

### 🚨 **Vấn Đề**

Context value thay đổi gây toàn bộ consumers re-render.

```tsx
// ❌ Problem - All consumers re-render
const AppContext = createContext()

function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('vi')

  // Object mới mỗi render → ALL consumers re-render!
  const value = {
    user,
    setUser,
    theme,
    setTheme,
    language,
    setLanguage
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
```

### ✅ **Giải Pháp**

#### 1. **Split Contexts**

```tsx
// ✅ Separate contexts trong Shopee Clone
const UserContext = createContext()
const ThemeContext = createContext()
const LanguageContext = createContext()

function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('vi')

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}
```

#### 2. **Memoized Context Value**

```tsx
// ✅ Memoize context value
function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  const userValue = useMemo(
    () => ({
      user,
      setUser
    }),
    [user]
  )

  const themeValue = useMemo(
    () => ({
      theme,
      setTheme
    }),
    [theme]
  )

  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
    </UserContext.Provider>
  )
}
```

#### 3. **State Management Alternative**

```tsx
// ✅ Zustand - Better performance
import { create } from 'zustand'

const useAppStore = create((set) => ({
  user: null,
  theme: 'light',
  language: 'vi',
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language })
}))

// Usage - No Provider needed, selective subscriptions
function UserProfile() {
  const user = useAppStore((state) => state.user) // Only subscribes to user
  return <div>{user?.name}</div>
}
```

---

## 📦 **Bundle Size Problems**

### 🚨 **Vấn Đề**

Large bundle sizes gây slow initial load times.

```tsx
// ❌ Problem - Large imports
import * as icons from '@heroicons/react/24/outline' // 500KB+
import { formatDistanceToNow, formatRelative, parseISO, format } from 'date-fns' // 200KB+
import { Chart } from 'chart.js' // 300KB+

function Dashboard() {
  return (
    <div>
      <icons.HomeIcon /> {/* Chỉ dùng 1 icon nhưng import hết */}
      <Chart /> {/* Load entire Chart.js */}
    </div>
  )
}
```

### ✅ **Giải Pháp**

#### 1. **Tree Shaking**

```tsx
// ✅ Import specific modules
import { HomeIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { Chart as ChartJS } from 'chart.js/auto'
```

#### 2. **Code Splitting**

```tsx
// ✅ Lazy loading trong Shopee Clone
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const UserProfile = lazy(() => import('./pages/User/Profile'))

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path='/product/:id' element={<ProductDetail />} />
        <Route path='/profile' element={<UserProfile />} />
      </Routes>
    </Suspense>
  )
}
```

#### 3. **Manual Chunks**

```typescript
// vite.config.ts - Trong Shopee Clone
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@heroui/react', '@floating-ui/react'],
          'http-vendor': ['axios', '@tanstack/react-query'],
          'utils-vendor': ['classnames', 'query-string']
        }
      }
    }
  }
})
```

---

## 🎯 **Event Handler Recreation**

### 🚨 **Vấn Đề**

Event handlers được tạo mới mỗi render, gây child components re-render.

```tsx
// ❌ Problem - New functions every render
function ProductList({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={() => setSelectedId(product.id)} // New function mỗi render!
          isSelected={selectedId === product.id}
        />
      ))}
    </div>
  )
}
```

### ✅ **Giải Pháp**

#### 1. **useCallback**

```tsx
// ✅ Memoized event handlers
function ProductList({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = useCallback((productId: string) => {
    setSelectedId(productId)
  }, [])

  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={handleSelect}
          isSelected={selectedId === product.id}
        />
      ))}
    </div>
  )
}

// ProductCard receives stable function reference
const ProductCard = memo(({ product, onSelect, isSelected }) => {
  const handleClick = () => onSelect(product.id)

  return (
    <div className={isSelected ? 'selected' : ''} onClick={handleClick}>
      {product.name}
    </div>
  )
})
```

#### 2. **Event Delegation**

```tsx
// ✅ Single event handler for all items
function ProductList({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleClick = useCallback((event: React.MouseEvent) => {
    const productId = event.currentTarget.dataset.productId
    if (productId) {
      setSelectedId(productId)
    }
  }, [])

  return (
    <div onClick={handleClick}>
      {products.map((product) => (
        <div key={product.id} data-product-id={product.id} className={selectedId === product.id ? 'selected' : ''}>
          {product.name}
        </div>
      ))}
    </div>
  )
}
```

---

## 🎉 **Tổng Kết**

### 💡 **Key Takeaways**

1. **Excessive Re-renders** → React.memo, useMemo, component splitting
2. **Memory Leaks** → Cleanup functions, AbortController
3. **State Batching** → React 18 auto-batching, useReducer
4. **Context Issues** → Split contexts, memoization, alternative state management
5. **Bundle Size** → Tree shaking, code splitting, manual chunks
6. **Event Handlers** → useCallback, event delegation

### 🚀 **Modern React Best Practices**

- ✅ **React 18+ Features**: Automatic batching, Suspense, Concurrent rendering
- ✅ **Performance Tools**: React DevTools Profiler, Bundle analyzers
- ✅ **Alternative Solutions**: Zustand, Valtio cho state management
- ✅ **Build Optimization**: Vite, ESBuild, SWC cho fast builds
- ✅ **Monitoring**: Web Vitals, Performance API

### 🔮 **Future với React 19**

React 19 sẽ tự động tối ưu nhiều vấn đề này:

- **React Compiler**: Auto-optimization, không cần manual memoization
- **Actions**: Better form handling và state updates
- **Better Suspense**: Improved loading states và error boundaries
