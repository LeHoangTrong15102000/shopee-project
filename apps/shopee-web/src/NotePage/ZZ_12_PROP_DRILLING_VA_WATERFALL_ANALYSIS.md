# 🚀 **PROP DRILLING VÀ WATERFALL TRONG REACT**

---

## 📋 **MỤC LỤC**

1. [🔍 Prop Drilling - Vấn Đề Truyền Props](#-prop-drilling---vấn-đề-truyền-props)
2. [🌊 Waterfall - Vấn Đề Render Cascade](#-waterfall---vấn-đề-render-cascade)
3. [🛠️ Giải Pháp cho Prop Drilling](#️-giải-pháp-cho-prop-drilling)
4. [⚡ Giải Pháp cho Waterfall](#-giải-pháp-cho-waterfall)
5. [📊 So Sánh Performance](#-so-sánh-performance)
6. [🎯 Best Practices](#-best-practices)

---

## 🔍 **Prop Drilling - Vấn Đề Truyền Props**

### 🎯 **Định Nghĩa**

**Prop Drilling** là hiện tượng khi bạn phải truyền props qua nhiều tầng component, ngay cả khi các component trung gian không sử dụng props đó.

### 🚨 **Vấn Đề Thực Tế**

Hãy tưởng tượng trong dự án Shopee Clone, chúng ta cần truyền thông tin user từ `App` xuống `ProductCard` để hiển thị trạng thái đăng nhập:

```tsx
// ❌ Prop Drilling Problem
// App.tsx
function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return <MainLayout user={user} isAuthenticated={isAuthenticated} onLogin={setUser} />
}

// MainLayout.tsx
function MainLayout({
  user,
  isAuthenticated,
  onLogin,
  children
}: {
  user: User | null
  isAuthenticated: boolean
  onLogin: (user: User) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <Header user={user} isAuthenticated={isAuthenticated} onLogin={onLogin} />
      <main>
        <ProductList user={user} isAuthenticated={isAuthenticated} />
      </main>
      <Footer />
    </div>
  )
}

// Header.tsx
function Header({
  user,
  isAuthenticated,
  onLogin
}: {
  user: User | null
  isAuthenticated: boolean
  onLogin: (user: User) => void
}) {
  return (
    <header>
      <Logo />
      <SearchBar />
      <UserMenu user={user} isAuthenticated={isAuthenticated} onLogin={onLogin} />
    </header>
  )
}

// ProductList.tsx
function ProductList({ user, isAuthenticated }: { user: User | null; isAuthenticated: boolean }) {
  const [products, setProducts] = useState([])

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} user={user} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  )
}

// ProductCard.tsx - Component cuối cùng thực sự cần dùng props
function ProductCard({
  product,
  user,
  isAuthenticated
}: {
  product: Product
  user: User | null
  isAuthenticated: boolean
}) {
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Redirect to login
      return
    }
    // Add to cart logic
  }

  return (
    <div className='product-card'>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={handleAddToCart}>{isAuthenticated ? 'Thêm vào giỏ' : 'Đăng nhập để mua'}</button>
    </div>
  )
}
```

### 😱 **Những Vấn Đề Của Prop Drilling**

#### 1. **Maintenance Nightmare**

```tsx
// Khi cần thêm 1 prop mới, phải sửa ở 4-5 places
interface UserProps {
  user: User | null
  isAuthenticated: boolean
  permissions: Permission[] // ← Prop mới
  onLogin: (user: User) => void
  onLogout: () => void // ← Prop mới
}

// Phải update ALL intermediate components!
// App → MainLayout → Header → UserMenu
// App → MainLayout → ProductList → ProductCard
```

#### 2. **Poor Reusability**

```tsx
// ProductCard bây giờ PHỤ THUỘC vào user props
// Không thể reuse ở contexts khác mà không có user
function ProductCard({ product, user, isAuthenticated }) {
  // Component này trở nên tight-coupled
}
```

#### 3. **Performance Issues**

```tsx
// Mỗi khi user state thay đổi
// TẤT CẢ intermediate components re-render
App               // ← Re-render
├── MainLayout    // ← Re-render (không cần thiết)
├── Header        // ← Re-render (không cần thiết)
├── ProductList   // ← Re-render (không cần thiết)
└── ProductCard   // ← Re-render (cần thiết)
```

### 📊 **Ví Dụ Thực Tế Từ Shopee Clone**

Trong dự án, chúng ta thấy prop drilling ở nhiều nơi:

```tsx
// src/pages/User/layouts/UserLayout/UserLayout.tsx
interface UserLayoutProps {
  children?: React.ReactNode
}

function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className='bg-neutral-100 py-16 text-sm text-gray-600'>
      <div className='container'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-12'>
          <div className='md:col-span-3 lg:col-span-2'>
            <UserSideNav /> {/* Cần user info */}
          </div>
          <div className='md:col-span-9 lg:col-span-10'>
            {children} {/* Profile, ChangePassword cũng cần user info */}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### **Problem**: Nếu không có Context API:

```tsx
// ❌ Without Context - Prop Drilling Nightmare
function UserLayout({
  children,
  user, // ← Phải nhận từ parent
  onUpdateUser // ← Phải nhận từ parent
}: {
  children: React.ReactNode
  user: User
  onUpdateUser: (user: User) => void
}) {
  return (
    <div className='bg-neutral-100 py-16'>
      <div className='container'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-12'>
          <div className='md:col-span-3 lg:col-span-2'>
            <UserSideNav user={user} /> {/* ← Truyền xuống */}
          </div>
          <div className='md:col-span-9 lg:col-span-10'>
            {/* Phải clone children với props */}
            {React.cloneElement(children, { user, onUpdateUser })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile.tsx cũng phải nhận props
function Profile({ user, onUpdateUser }: { user: User; onUpdateUser: (user: User) => void }) {
  // Component logic
}

// ChangePassword.tsx cũng phải nhận props
function ChangePassword({ user }: { user: User }) {
  // Component logic
}
```

---

## 🌊 **Waterfall - Vấn Đề Render Cascade**

### 🎯 **Định Nghĩa**

**Waterfall** (hay **Render Waterfall**) là hiện tượng khi React components render theo kiểu "thác nước" - component con chỉ bắt đầu render sau khi component cha đã render xong, gây ra hiệu ứng delay cascading.

### 🚨 **Vấn Đề Thực Tế**

```tsx
// ❌ Waterfall Problem Example
function App() {
  const [user, setUser] = useState<User | null>(null)

  // Fetch user info - Takes 500ms
  useEffect(() => {
    fetchUser().then(setUser)
  }, [])

  if (!user) {
    return <Loader /> // ← Blocking render của children
  }

  return <Dashboard user={user} />
}

function Dashboard({ user }: { user: User }) {
  const [products, setProducts] = useState([])

  // Chỉ bắt đầu fetch products AFTER user đã load
  useEffect(() => {
    fetchProducts(user.id).then(setProducts) // ← Waterfall!
  }, [user.id])

  if (products.length === 0) {
    return <Loader /> // ← Blocking render tiếp
  }

  return <ProductList products={products} />
}

function ProductList({ products }: { products: Product[] }) {
  const [reviews, setReviews] = useState([])

  // Chỉ bắt đầu fetch reviews AFTER products đã load
  useEffect(() => {
    fetchReviews(products[0].id).then(setReviews) // ← Waterfall continues!
  }, [products])

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} reviews={reviews} />
      ))}
    </div>
  )
}

/* 
Timeline:
0ms    → Start fetching user
500ms  → User loaded, start fetching products  
1000ms → Products loaded, start fetching reviews
1500ms → Reviews loaded, UI fully rendered

Total: 1500ms (Serial loading!)
*/
```

### 📊 **Waterfall Patterns trong Shopee Clone**

#### 1. **Authentication Waterfall**

```tsx
// useRouteElements.tsx - Ví dụ thực tế
export default function useRouteElements() {
  const { isAuthenticated } = useContext(AppContext) // ← Check auth first

  const routeElements = useRoutes([
    {
      path: '/',
      element: (
        <MainLayout>
          <ProductList /> {/* ← Chỉ render AFTER auth check */}
        </MainLayout>
      )
    },
    {
      path: path.user,
      element: (
        <ProtectedRoute>
          {' '}
          {/* ← Must wait for auth */}
          <UserLayout>
            <Profile /> {/* ← Cascade continues */}
          </UserLayout>
        </ProtectedRoute>
      )
    }
  ])

  return routeElements
}
```

#### 2. **Data Loading Waterfall**

```tsx
// pages/ProductDetail/ProductDetail.tsx
function ProductDetail() {
  const { nameId } = useParams()

  // Step 1: Fetch product info (500ms)
  const { data: productDetail } = useQuery({
    queryKey: ['product', nameId],
    queryFn: () => productApi.getProductDetail(nameId)
  })

  if (!productDetail) {
    return <Loader /> // ← Blocking UI
  }

  return (
    <div>
      <ProductInfo product={productDetail} />
      <ProductReviews productId={productDetail.id} /> {/* ← Delayed start */}
      <RelatedProducts categoryId={productDetail.category_id} /> {/* ← More delay */}
    </div>
  )
}

function ProductReviews({ productId }: { productId: string }) {
  // Step 2: Fetch reviews (chỉ bắt đầu sau khi product loaded)
  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewApi.getReviews(productId),
    enabled: !!productId // ← Waterfall dependency
  })

  return <div>{reviews?.map((review) => <ReviewItem key={review.id} review={review} />)}</div>
}

function RelatedProducts({ categoryId }: { categoryId: string }) {
  // Step 3: Fetch related products (delay thêm nữa)
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', categoryId],
    queryFn: () => productApi.getProductsByCategory(categoryId),
    enabled: !!categoryId // ← Another waterfall dependency
  })

  return <div>{relatedProducts?.map((product) => <ProductCard key={product.id} product={product} />)}</div>
}

/*
Timeline:
0ms    → User clicks product link
200ms  → Product detail API call starts
700ms  → Product loaded, Reviews API starts, Related Products API starts  
1200ms → Reviews & Related Products loaded
1200ms → UI fully interactive

Serial: 1200ms total
Parallel potential: ~700ms (if parallel)
*/
```

#### 3. **Component Mount Waterfall**

```tsx
// Waterfall trong component initialization
function ShoppingCart() {
  const [user, setUser] = useState<User | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])

  // Step 1: Get user (200ms)
  useEffect(() => {
    getUser().then(setUser)
  }, [])

  // Step 2: Get cart items (300ms) - chỉ chạy sau khi có user
  useEffect(() => {
    if (user) {
      getCartItems(user.id).then(setCartItems)
    }
  }, [user])

  // Step 3: Get shipping options (200ms) - chỉ chạy sau khi có cart
  useEffect(() => {
    if (cartItems.length > 0) {
      getShippingOptions(cartItems).then(setShippingOptions)
    }
  }, [cartItems])

  // UI chỉ render đầy đủ sau 700ms (200+300+200)
  if (!user || cartItems.length === 0 || shippingOptions.length === 0) {
    return <Loader />
  }

  return (
    <div>
      <CartItems items={cartItems} />
      <ShippingSelector options={shippingOptions} />
      <CheckoutButton />
    </div>
  )
}
```

### 😱 **Tác Hại Của Waterfall**

#### 1. **Slow Perceived Performance**

```
❌ Serial Loading (Waterfall):
User → Product → Reviews → Related
0ms   500ms    1000ms   1500ms

✅ Parallel Loading:
User → Product ↘
            Reviews → All done at 500ms
            Related ↗
0ms        500ms
```

#### 2. **Poor User Experience**

- Users nhìn thấy loading spinners liên tục
- Content "pop in" từng phần một
- Cảm giác trang web chậm chạp

#### 3. **Wasted Resources**

- Network requests không được tối ưu
- CPU idle time khi chờ data
- Unnecessary re-renders

---

## 🛠️ **Giải Pháp cho Prop Drilling**

### 1. **React Context API**

#### **Implementation trong Shopee Clone**

```tsx
// src/contexts/app.context.tsx - Giải pháp thực tế
interface AppContextInterface {
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
  profile: User | null
  setProfile: React.Dispatch<React.SetStateAction<User | null>>
  extendedPurchases: ExtendedPurchase[]
  setExtendedPurchases: React.Dispatch<React.SetStateAction<ExtendedPurchase[]>>
  reset: () => void
}

export const AppContext = createContext<AppContextInterface>(initialAppContext)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [profile, setProfile] = useState<User | null>(null)
  const [extendedPurchases, setExtendedPurchases] = useState<ExtendedPurchase[]>([])

  const reset = () => {
    setIsAuthenticated(false)
    setExtendedPurchases([])
    setProfile(null)
  }

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        profile,
        setProfile,
        extendedPurchases,
        setExtendedPurchases,
        reset
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
```

#### **Usage - Không Cần Prop Drilling**

```tsx
// ✅ Clean Component Hierarchy
function App() {
  return (
    <AppProvider>
      <MainLayout>
        <ProductList />
      </MainLayout>
    </AppProvider>
  )
}

function MainLayout({ children }: { children: React.ReactNode }) {
  // Không cần nhận user props!
  return (
    <div>
      <Header /> {/* Header tự lấy data từ context */}
      <main>{children}</main>
      <Footer />
    </div>
  )
}

function Header() {
  // Trực tiếp access context, không cần props
  const { isAuthenticated, profile } = useContext(AppContext)

  return (
    <header>
      <Logo />
      <SearchBar />
      {isAuthenticated ? <UserMenu user={profile} /> : <LoginButton />}
    </header>
  )
}

function ProductCard({ product }: { product: Product }) {
  // Chỉ cần product prop, lấy user từ context
  const { isAuthenticated, profile } = useContext(AppContext)

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Redirect to login
      return
    }
    // Add to cart logic với profile.id
  }

  return (
    <div className='product-card'>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={handleAddToCart}>{isAuthenticated ? 'Thêm vào giỏ' : 'Đăng nhập để mua'}</button>
    </div>
  )
}
```

### 2. **Custom Hooks Pattern**

```tsx
// hooks/useAuth.tsx - Encapsulate context logic
export const useAuth = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAuth must be used within AppProvider')
  }

  return {
    isAuthenticated: context.isAuthenticated,
    user: context.profile,
    login: (user: User) => {
      context.setProfile(user)
      context.setIsAuthenticated(true)
    },
    logout: () => {
      context.reset()
    }
  }
}

// Usage - Even cleaner
function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated, login } = useAuth()

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Redirect to login
      return
    }
    // Add to cart
  }

  return (
    <div className='product-card'>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>{isAuthenticated ? 'Thêm vào giỏ' : 'Đăng nhập để mua'}</button>
    </div>
  )
}
```

### 3. **Component Composition Pattern**

```tsx
// Higher-Order Component approach
const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, profile } = useAuth()

    return <Component {...props} isAuthenticated={isAuthenticated} user={profile} />
  }
}

// Usage
const AuthenticatedProductCard = withAuth(ProductCard)
```

### 4. **State Management Libraries**

```tsx
// Zustand example - Alternative to Context
import { create } from 'zustand'

interface AuthStore {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null })
}))

// Usage - No Provider needed!
function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated, user } = useAuthStore()

  // Clean, no prop drilling
}
```

---

## ⚡ **Giải Pháp cho Waterfall**

### 1. **Parallel Data Fetching**

```tsx
// ✅ Parallel Approach - Fix Waterfall
function ProductDetail() {
  const { nameId } = useParams()
  const productId = getProductIdFromNameId(nameId)
  const categoryId = getCategoryIdFromNameId(nameId)

  // Fetch ALL data in parallel
  const productQuery = useQuery({
    queryKey: ['product', nameId],
    queryFn: () => productApi.getProductDetail(nameId)
  })

  const reviewsQuery = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewApi.getReviews(productId),
    enabled: !!productId // Still dependent but can start earlier
  })

  const relatedQuery = useQuery({
    queryKey: ['related-products', categoryId],
    queryFn: () => productApi.getProductsByCategory(categoryId),
    enabled: !!categoryId
  })

  // Render with partial data
  return (
    <div>
      {productQuery.data && <ProductInfo product={productQuery.data} />}

      {reviewsQuery.data ? <ProductReviews reviews={reviewsQuery.data} /> : <ReviewsSkeleton />}

      {relatedQuery.data ? <RelatedProducts products={relatedQuery.data} /> : <RelatedProductsSkeleton />}
    </div>
  )
}

/*
Timeline với Parallel:
0ms   → All 3 API calls start simultaneously  
500ms → Product + Reviews + Related all complete
500ms → UI fully rendered

Improvement: 1500ms → 500ms (3x faster!)
*/
```

### 2. **React Query Parallel Queries**

```tsx
// utils/queries.ts - Parallel query utilities
export const useProductDetailData = (nameId: string) => {
  const productId = getProductIdFromNameId(nameId)
  const categoryId = getCategoryIdFromNameId(nameId)

  return useQueries({
    queries: [
      {
        queryKey: ['product', nameId],
        queryFn: () => productApi.getProductDetail(nameId)
      },
      {
        queryKey: ['reviews', productId],
        queryFn: () => reviewApi.getReviews(productId),
        enabled: !!productId
      },
      {
        queryKey: ['related-products', categoryId],
        queryFn: () => productApi.getProductsByCategory(categoryId),
        enabled: !!categoryId
      }
    ]
  })
}

// Usage
function ProductDetail() {
  const { nameId } = useParams()
  const [productQuery, reviewsQuery, relatedQuery] = useProductDetailData(nameId)

  return (
    <div>
      <ProductInfo query={productQuery} />
      <ProductReviews query={reviewsQuery} />
      <RelatedProducts query={relatedQuery} />
    </div>
  )
}
```

### 3. **Optimistic Updates**

```tsx
// ✅ Optimistic approach - Better UX
function ShoppingCart() {
  const { user } = useAuth()

  // Start fetching immediately, don't wait
  const cartQuery = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => getCartItems(user?.id),
    enabled: !!user?.id,
    // Show cached data while refetching
    staleTime: 30000,
    placeholderData: [] // Optimistic empty state
  })

  const shippingQuery = useQuery({
    queryKey: ['shipping-options'],
    queryFn: getShippingOptions
    // Start fetching immediately regardless of cart
    // Most shipping options are the same anyway
  })

  // Render immediately with loading states
  return (
    <div>
      <CartItems items={cartQuery.data || []} isLoading={cartQuery.isLoading} />

      <ShippingSelector options={shippingQuery.data || []} isLoading={shippingQuery.isLoading} />

      <CheckoutButton disabled={cartQuery.isLoading || shippingQuery.isLoading} />
    </div>
  )
}
```

### 4. **Suspense Boundaries**

```tsx
// React 18 Concurrent Features
function ProductDetail() {
  return (
    <div>
      {/* Immediate render */}
      <ProductHeader />

      {/* Concurrent rendering */}
      <Suspense fallback={<ProductInfoSkeleton />}>
        <ProductInfo />
      </Suspense>

      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews />
      </Suspense>

      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts />
      </Suspense>
    </div>
  )
}

// Each component fetches independently
function ProductInfo() {
  const { nameId } = useParams()
  // This will suspend until data is ready
  const product = useSuspenseQuery({
    queryKey: ['product', nameId],
    queryFn: () => productApi.getProductDetail(nameId)
  })

  return <div>{/* Product info JSX */}</div>
}
```

### 5. **Preloading Strategies**

```tsx
// Preload data before component mounts
function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient()

  const handleMouseEnter = () => {
    // Preload detail page data on hover
    queryClient.prefetchQuery({
      queryKey: ['product', product.nameId],
      queryFn: () => productApi.getProductDetail(product.nameId)
    })
  }

  return (
    <Link to={`/products/${product.nameId}`} onMouseEnter={handleMouseEnter}>
      <div className='product-card'>{/* Product card content */}</div>
    </Link>
  )
}

// Route-level preloading
const productDetailLoader = async ({ params }: { params: any }) => {
  const { nameId } = params

  // Start fetching before component renders
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['product', nameId],
      queryFn: () => productApi.getProductDetail(nameId)
    }),
    queryClient.prefetchQuery({
      queryKey: ['reviews', nameId],
      queryFn: () => reviewApi.getReviews(nameId)
    })
  ])
}
```

---

## 📊 **So Sánh Performance**

### 🏃‍♂️ **Prop Drilling vs Context**

| Aspect                   | Prop Drilling | React Context | State Management |
| ------------------------ | ------------- | ------------- | ---------------- |
| **Bundle Size**          | Smaller       | Medium        | Larger           |
| **Runtime Performance**  | Faster\*      | Medium        | Fast             |
| **Developer Experience** | Poor          | Good          | Excellent        |
| **Maintainability**      | Poor          | Good          | Excellent        |
| **Type Safety**          | Good          | Good          | Excellent        |
| **Debugging**            | Hard          | Medium        | Easy             |

\*_Faster chỉ khi số lượng component ít_

### ⚡ **Waterfall vs Parallel**

```tsx
// Performance Comparison
const WaterfallExample = () => {
  const [step1, setStep1] = useState(null)
  const [step2, setStep2] = useState(null)
  const [step3, setStep3] = useState(null)

  useEffect(() => {
    fetch('/api/step1').then(setStep1) // 0-500ms
  }, [])

  useEffect(() => {
    if (step1) {
      fetch('/api/step2').then(setStep2) // 500-800ms
    }
  }, [step1])

  useEffect(() => {
    if (step2) {
      fetch('/api/step3').then(setStep3) // 800-1100ms
    }
  }, [step2])

  // Total: ~1100ms
}

const ParallelExample = () => {
  const [step1, setStep1] = useState(null)
  const [step2, setStep2] = useState(null)
  const [step3, setStep3] = useState(null)

  useEffect(() => {
    // All start at the same time
    Promise.all([
      fetch('/api/step1').then(setStep1), // 0-500ms
      fetch('/api/step2').then(setStep2), // 0-300ms
      fetch('/api/step3').then(setStep3) // 0-400ms
    ])
  }, [])

  // Total: ~500ms (66% improvement!)
}
```

### 📈 **Real Performance Metrics**

#### **Shopee Clone Measurements**

```typescript
// Before optimization (Waterfall)
Performance.mark('page-start')
// User clicks product
// → Product API (500ms)
// → Reviews API (300ms) - starts after product
// → Related API (200ms) - starts after reviews
Performance.mark('page-interactive')
// Total: 1000ms

// After optimization (Parallel)
Performance.mark('page-start-optimized')
// User clicks product
// → All APIs start simultaneously
// → Longest API determines total time (500ms)
Performance.mark('page-interactive-optimized')
// Total: 500ms

console.log('Improvement:', 1000 - 500, 'ms (50% faster)')
```

---

## 🎯 **Best Practices**

### ✅ **Prop Drilling Best Practices**

#### 1. **Use Context for Global State**

```tsx
// ✅ Good - Global state in Context
const AppContext = createContext({
  user: null,
  theme: 'light',
  language: 'vi'
})

// ❌ Bad - Local state passed down many levels
function App() {
  const [theme, setTheme] = useState('light')
  return <Layout theme={theme} setTheme={setTheme} />
}
```

#### 2. **Props for Component Configuration**

```tsx
// ✅ Good - Props for component-specific config
function Button({ variant = 'primary', size = 'medium', onClick, children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  )
}

// ❌ Bad - Context for everything
const ButtonContext = createContext({
  variant: 'primary',
  size: 'medium'
})
```

#### 3. **Composition Over Prop Drilling**

```tsx
// ✅ Good - Composition pattern
function UserProfile() {
  const { user } = useAuth()

  return (
    <ProfileLayout>
      <ProfileHeader user={user} />
      <ProfileContent user={user} />
      <ProfileActions user={user} />
    </ProfileLayout>
  )
}

// ❌ Bad - Passing user through multiple levels
function UserProfile() {
  const { user } = useAuth()
  return <ProfileLayout user={user} /> // user passed down
}
```

### ⚡ **Waterfall Best Practices**

#### 1. **Identify Dependencies**

```tsx
// ✅ Good - Parallel independent queries
const useProductPageData = (productId: string) => {
  const product = useQuery(['product', productId], () => fetchProduct(productId))

  const reviews = useQuery(
    ['reviews', productId],
    () => fetchReviews(productId) // Independent of product details
  )

  const related = useQuery(
    ['related', productId],
    () => fetchRelatedProducts(productId) // Independent
  )

  return { product, reviews, related }
}

// ❌ Bad - Unnecessary dependencies
const product = useQuery(['product', productId], fetchProduct)
const reviews = useQuery(
  ['reviews', productId],
  () => fetchReviews(productId),
  { enabled: !!product.data } // Unnecessary wait!
)
```

#### 2. **Progressive Enhancement**

```tsx
// ✅ Good - Show partial UI immediately
function ProductPage() {
  const { product, reviews, related } = useProductPageData(productId)

  return (
    <div>
      {/* Show immediately when available */}
      {product.data && <ProductInfo product={product.data} />}

      {/* Show skeleton while loading */}
      {reviews.isLoading && <ReviewsSkeleton />}
      {reviews.data && <Reviews reviews={reviews.data} />}

      {related.isLoading && <RelatedSkeleton />}
      {related.data && <RelatedProducts products={related.data} />}
    </div>
  )
}

// ❌ Bad - All-or-nothing loading
function ProductPage() {
  const { product, reviews, related } = useProductPageData(productId)

  if (product.isLoading || reviews.isLoading || related.isLoading) {
    return <FullPageLoader />  // User waits for everything
  }

  return (/* Full UI */)
}
```

#### 3. **Smart Preloading**

```tsx
// ✅ Good - Predictive loading
function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient()

  const prefetchProductDetails = useCallback(() => {
    queryClient.prefetchQuery(
      ['product', product.id],
      () => fetchProductDetails(product.id),
      { staleTime: 10 * 60 * 1000 } // Cache for 10 minutes
    )
  }, [product.id, queryClient])

  return (
    <Link
      to={`/products/${product.id}`}
      onMouseEnter={prefetchProductDetails} // Load on hover
      onFocus={prefetchProductDetails} // Load on focus (keyboard)
    >
      <div className='product-card'>{/* Product card content */}</div>
    </Link>
  )
}
```

### 🔧 **Performance Monitoring**

```tsx
// Monitor and measure improvements
const usePerformanceTracking = (pageId: string) => {
  useEffect(() => {
    const navigationStart = performance.timing.navigationStart
    const loadComplete = performance.timing.loadEventEnd
    const totalTime = loadComplete - navigationStart

    // Track metrics
    analytics.track('page_load_time', {
      pageId,
      loadTime: totalTime,
      timestamp: Date.now()
    })
  }, [pageId])
}

// Usage
function ProductDetail() {
  const { nameId } = useParams()
  usePerformanceTracking(`product-${nameId}`)

  return (/* Component JSX */)
}
```

### 🎯 **Decision Matrix**

#### **When to Use What?**

| Scenario                   | Solution            | Reason                      |
| -------------------------- | ------------------- | --------------------------- |
| User authentication state  | Context API         | Global, infrequent changes  |
| Theme/Language preferences | Context API         | Global, infrequent changes  |
| Form data                  | useState/useReducer | Local, frequent changes     |
| Component variants         | Props               | Component-specific config   |
| API data                   | React Query         | Caching, background updates |
| Complex state logic        | Zustand/Redux       | Predictable state updates   |

#### **Performance Priorities**

1. **Measure First** - Use React DevTools Profiler
2. **Optimize Bottlenecks** - Don't optimize prematurely
3. **User Experience** - Perceived performance > actual performance
4. **Progressive Enhancement** - Show something immediately
5. **Monitor Continuously** - Performance is not set-and-forget

---

## 🎉 **Tổng Kết**

### 🔍 **Prop Drilling Recap**

- **Vấn đề**: Truyền props qua nhiều tầng component không cần thiết
- **Tác hại**: Code phức tạp, khó maintain, performance kém
- **Giải pháp**: Context API, State management, Composition patterns
- **Khi nào dùng**: Global state, shared data, deep component trees

### 🌊 **Waterfall Recap**

- **Vấn đề**: Components render tuần tự thay vì song song
- **Tác hại**: Trang tải chậm, UX kém, waste resources
- **Giải pháp**: Parallel queries, Suspense, Preloading, Progressive enhancement
- **Khi nào optimize**: Critical loading paths, user-facing delays

### 💡 **Key Takeaways**

1. **Prop Drilling không phải lúc nào cũng xấu** - Với 2-3 levels thì props vẫn ổn
2. **Context có overhead** - Chỉ dùng cho global state thật sự
3. **Waterfall thường ẩn** - Monitor performance để phát hiện
4. **User experience first** - Ưu tiên perceived performance
5. **Measure before optimize** - Đừng optimize sớm quá

### 🚀 **Áp Dụng Vào Dự Án**

Trong Shopee Clone, chúng ta đã thấy:

- ✅ **Context API** cho authentication state
- ✅ **React Query** để tránh waterfall trong data fetching
- ✅ **Component composition** để giảm prop drilling
- ✅ **Lazy loading** để improve initial load time

Những techniques này giúp app chạy mượt mà hơn và code dễ maintain hơn đáng kể!
