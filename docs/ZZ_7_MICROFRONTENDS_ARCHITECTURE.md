# 🏗️ MICRO-FRONTENDS ARCHITECTURE - KIẾN TRÚC MICRO-FRONTENDS

> **Tài liệu chi tiết về Micro-frontends Architecture cho dự án Shopee Clone**
>
> **Tác giả:** AI Assistant | **Ngày:** 20/03/2026 | **Version:** 1.0

---

## 📑 MỤC LỤC

1. [Giới thiệu về Micro-frontends](#1-giới-thiệu-về-micro-frontends)
2. [Module Federation](#2-module-federation)
3. [Independent Deployment](#3-independent-deployment)
4. [Shared Dependencies](#4-shared-dependencies)
5. [Communication Between MFEs](#5-communication-between-mfes)
6. [Routing Strategies](#6-routing-strategies)
7. [State Management](#7-state-management)
8. [Styling Strategies](#8-styling-strategies)
9. [Testing Micro-frontends](#9-testing-micro-frontends)
10. [Best Practices](#10-best-practices)

---

## 1. GIỚI THIỆU VỀ MICRO-FRONTENDS

### 1.1. Micro-frontends là gì?

**Micro-frontends** là architectural pattern chia frontend monolith thành nhiều smaller, independent applications.

### 1.2. Tại sao cần Micro-frontends?

**Problems với Monolith:**

- Codebase lớn, khó maintain
- Deploy toàn bộ app mỗi lần có thay đổi nhỏ
- Team dependencies, khó scale team
- Technology lock-in

**Benefits của Micro-frontends:**

- **Independent deployment**: Deploy từng phần riêng biệt
- **Team autonomy**: Mỗi team own một MFE
- **Technology diversity**: Mỗi MFE có thể dùng tech stack khác nhau
- **Incremental upgrades**: Upgrade từng phần, không cần rewrite toàn bộ
- **Fault isolation**: Lỗi ở một MFE không ảnh hưởng toàn bộ app

### 1.3. Khi nào nên dùng Micro-frontends?

**✅ Nên dùng khi:**

- Large-scale applications với nhiều teams
- Cần independent deployment
- Cần technology diversity
- Cần scale team independently

**❌ Không nên dùng khi:**

- Small applications
- Single team
- Tight coupling giữa các features
- Performance là critical concern

---

## 2. MODULE FEDERATION

### 2.1. Khái niệm

**Module Federation** (Webpack 5) cho phép JavaScript applications dynamically load code từ other applications.

### 2.2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Shell Application                     │
│                  (Host/Container)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Header     │  │   Sidebar    │  │   Footer     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Remote Applications (MFEs)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Products │  │   Cart   │  │   User   │       │  │
│  │  │   MFE    │  │   MFE    │  │   MFE    │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.3. Setup Module Federation

**File structure:**

```
shopee-microfrontends/
├── shell/                    # Host application
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
├── products-mfe/             # Products micro-frontend
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
├── cart-mfe/                 # Cart micro-frontend
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
└── user-mfe/                 # User micro-frontend
    ├── src/
    ├── vite.config.ts
    └── package.json
```

### 2.4. Vite Module Federation Configuration

**Install plugin:**

```bash
npm install @originjs/vite-plugin-federation --save-dev
```

**Remote Application (products-mfe):**

```typescript
// products-mfe/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'products_mfe',
      filename: 'remoteEntry.js',
      // Expose components
      exposes: {
        './ProductList': './src/pages/ProductList',
        './ProductDetail': './src/pages/ProductDetail',
      },
      // Shared dependencies
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.0.0',
        },
        'react-router': {
          singleton: true,
        },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
})
```

**Host Application (shell):**

```typescript
// shell/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      // Remote applications
      remotes: {
        products_mfe: 'http://localhost:5001/assets/remoteEntry.js',
        cart_mfe: 'http://localhost:5002/assets/remoteEntry.js',
        user_mfe: 'http://localhost:5003/assets/remoteEntry.js',
      },
      // Shared dependencies
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.0.0',
        },
        'react-router': {
          singleton: true,
        },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
})
```

### 2.5. Loading Remote Components

```typescript
// shell/src/App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import Loader from './components/Loader'

// Lazy load remote components
const ProductList = lazy(() => import('products_mfe/ProductList'))
const ProductDetail = lazy(() => import('products_mfe/ProductDetail'))
const Cart = lazy(() => import('cart_mfe/Cart'))
const UserProfile = lazy(() => import('user_mfe/Profile'))

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
```

---

## 3. INDEPENDENT DEPLOYMENT

### 3.1. Deployment Strategy

**Mỗi MFE có CI/CD pipeline riêng:**

```yaml
# products-mfe/.github/workflows/deploy.yml
name: Deploy Products MFE

on:
  push:
    branches: [main]
    paths:
      - 'products-mfe/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./products-mfe
        run: npm ci

      - name: Build
        working-directory: ./products-mfe
        run: npm run build

      - name: Deploy to S3
        working-directory: ./products-mfe
        run: |
          aws s3 sync dist/ s3://shopee-products-mfe/ --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DIST_ID }} --paths "/*"
```

### 3.2. Versioning Strategy

```typescript
// products-mfe/vite.config.ts
import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'

const version = process.env.VERSION || 'latest'

export default defineConfig({
  plugins: [
    federation({
      name: 'products_mfe',
      filename: `remoteEntry.${version}.js`, // Versioned filename
      exposes: {
        './ProductList': './src/pages/ProductList',
      },
    }),
  ],
})
```

**Shell loads specific version:**

```typescript
// shell/src/config/remotes.ts
export const remotes = {
  products_mfe: `https://cdn.shopee.com/products-mfe/remoteEntry.${PRODUCTS_VERSION}.js`,
  cart_mfe: `https://cdn.shopee.com/cart-mfe/remoteEntry.${CART_VERSION}.js`,
}
```

### 3.3. Rollback Strategy

```typescript
// shell/src/utils/loadRemote.ts
const loadRemoteWithFallback = async (
  remoteName: string,
  module: string,
  fallbackVersion: string,
) => {
  try {
    // Try loading latest version
    return await import(`${remoteName}/${module}`)
  } catch (error) {
    console.error(`Failed to load ${remoteName}/${module}, falling back to ${fallbackVersion}`)
    // Fallback to previous stable version
    return await import(`${remoteName}_${fallbackVersion}/${module}`)
  }
}
```

---

## 4. SHARED DEPENDENCIES

### 4.1. Singleton Dependencies

```typescript
// Shared dependencies phải là singleton để tránh multiple instances
shared: {
  react: {
    singleton: true,        // Chỉ load 1 instance
    requiredVersion: '^19.0.0',
    strictVersion: false    // Allow version mismatch
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^19.0.0'
  },
  'react-router': {
    singleton: true
  }
}
```

### 4.2. Shared Utilities

```typescript
// shell/src/shared/
export { http } from './utils/http'
export { formatCurrency } from './utils/format'
export { AppContext } from './contexts/app.context'

// Expose shared utilities
// shell/vite.config.ts
federation({
  name: 'shell',
  exposes: {
    './shared': './src/shared/index.ts',
  },
})

// Remote MFE imports shared utilities
// products-mfe/src/api/products.api.ts
import { http } from 'shell/shared'

export const getProducts = () => {
  return http.get('/products')
}
```

### 4.3. Shared Components

```typescript
// shell/src/components/shared/
export { Button } from './Button'
export { Input } from './Input'
export { Modal } from './Modal'

// Expose shared components
federation({
  name: 'shell',
  exposes: {
    './components': './src/components/shared/index.ts'
  }
})

// Remote MFE uses shared components
// products-mfe/src/pages/ProductList.tsx
import { Button, Modal } from 'shell/components'

const ProductList = () => {
  return (
    <div>
      <Button>Add to Cart</Button>
    </div>
  )
}
```

---

## 5. COMMUNICATION BETWEEN MFES

### 5.1. Event Bus Pattern

```typescript
// shell/src/utils/eventBus.ts
type EventCallback = (data: any) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }
}

export const eventBus = new EventBus()

// Expose event bus
// shell/vite.config.ts
federation({
  exposes: {
    './eventBus': './src/utils/eventBus.ts',
  },
})
```

**Usage:**

```typescript
// products-mfe: Emit event khi add to cart
import { eventBus } from 'shell/eventBus'

const handleAddToCart = (product: Product) => {
  eventBus.emit('cart:add', product)
}

// cart-mfe: Listen to event
import { eventBus } from 'shell/eventBus'
import { useEffect } from 'react'

const Cart = () => {
  useEffect(() => {
    const handleCartAdd = (product: Product) => {
      // Update cart
      console.log('Product added:', product)
    }

    eventBus.on('cart:add', handleCartAdd)

    return () => {
      eventBus.off('cart:add', handleCartAdd)
    }
  }, [])

  return <div>Cart</div>
}
```

### 5.2. Shared State với Context

```typescript
// shell/src/contexts/cart.context.tsx
import { createContext, useContext, useState } from 'react'

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

const CartContext = createContext<CartContextType | null>(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev, item])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}

// Expose context
federation({
  exposes: {
    './CartContext': './src/contexts/cart.context.tsx'
  }
})

// Remote MFE uses shared context
// products-mfe/src/pages/ProductList.tsx
import { useCart } from 'shell/CartContext'

const ProductList = () => {
  const { addItem } = useCart()

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product._id,
      name: product.name,
      price: product.price
    })
  }

  return <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
}
```

### 5.3. Custom Events (Browser API)

```typescript
// products-mfe: Dispatch custom event
const handleAddToCart = (product: Product) => {
  const event = new CustomEvent('cart:add', {
    detail: product,
  })
  window.dispatchEvent(event)
}

// cart-mfe: Listen to custom event
useEffect(() => {
  const handleCartAdd = (event: CustomEvent) => {
    const product = event.detail
    console.log('Product added:', product)
  }

  window.addEventListener('cart:add', handleCartAdd as EventListener)

  return () => {
    window.removeEventListener('cart:add', handleCartAdd as EventListener)
  }
}, [])
```

---

## 6. ROUTING STRATEGIES

### 6.1. Shell-based Routing

**Shell owns routing, MFEs are just views:**

```typescript
// shell/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router'
import { lazy, Suspense } from 'react'

const ProductList = lazy(() => import('products_mfe/ProductList'))
const Cart = lazy(() => import('cart_mfe/Cart'))

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/products" element={<ProductList />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 6.2. MFE-based Routing

**Mỗi MFE có routing riêng:**

```typescript
// products-mfe/src/App.tsx
import { Routes, Route } from 'react-router'

const ProductsApp = () => {
  return (
    <Routes>
      <Route path="/" element={<ProductList />} />
      <Route path="/:id" element={<ProductDetail />} />
    </Routes>
  )
}

// shell/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/products/*" element={<ProductsApp />} />
        <Route path="/cart/*" element={<CartApp />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 7. STATE MANAGEMENT

### 7.1. Local State (Preferred)

**Mỗi MFE manage state riêng:**

```typescript
// products-mfe/src/stores/products.store.ts
import { create } from 'zustand'

interface ProductsStore {
  products: Product[]
  setProducts: (products: Product[]) => void
}

export const useProductsStore = create<ProductsStore>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}))
```

### 7.2. Shared State (When Needed)

**Shell exposes shared store:**

```typescript
// shell/src/stores/global.store.ts
import { create } from 'zustand'

interface GlobalStore {
  user: User | null
  cart: CartItem[]
  setUser: (user: User | null) => void
  addToCart: (item: CartItem) => void
}

export const useGlobalStore = create<GlobalStore>((set) => ({
  user: null,
  cart: [],
  setUser: (user) => set({ user }),
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] }))
}))

// Expose store
federation({
  exposes: {
    './store': './src/stores/global.store.ts'
  }
})

// Remote MFE uses shared store
import { useGlobalStore } from 'shell/store'

const ProductList = () => {
  const { addToCart } = useGlobalStore()

  return <button onClick={() => addToCart(item)}>Add to Cart</button>
}
```

---

## 8. STYLING STRATEGIES

### 8.1. CSS Modules (Scoped Styles)

```typescript
// products-mfe/src/pages/ProductList.module.css
.container {
  padding: 20px;
}

.productCard {
  border: 1px solid #ccc;
}

// products-mfe/src/pages/ProductList.tsx
import styles from './ProductList.module.css'

const ProductList = () => {
  return (
    <div className={styles.container}>
      <div className={styles.productCard}>Product</div>
    </div>
  )
}
```

### 8.2. CSS-in-JS (Styled Components)

```typescript
// products-mfe/src/pages/ProductList.tsx
import styled from 'styled-components'

const Container = styled.div`
  padding: 20px;
`

const ProductCard = styled.div`
  border: 1px solid #ccc;
`

const ProductList = () => {
  return (
    <Container>
      <ProductCard>Product</ProductCard>
    </Container>
  )
}
```

### 8.3. Shared Design System

```typescript
// shell/src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#ee4d2d',
    secondary: '#f5f5f5',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
}

// Expose theme
federation({
  exposes: {
    './theme': './src/styles/theme.ts',
  },
})

// Remote MFE uses shared theme
import { theme } from 'shell/theme'

const Button = styled.button`
  background-color: ${theme.colors.primary};
  padding: ${theme.spacing.md};
`
```

---

## 9. TESTING MICRO-FRONTENDS

### 9.1. Unit Testing

```typescript
// products-mfe/src/pages/ProductList.test.tsx
import { render, screen } from '@testing-library/react'
import ProductList from './ProductList'

describe('ProductList', () => {
  it('renders product list', () => {
    render(<ProductList />)
    expect(screen.getByText('Products')).toBeInTheDocument()
  })
})
```

### 9.2. Integration Testing

```typescript
// shell/src/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock remote modules
vi.mock('products_mfe/ProductList', () => ({
  default: () => <div>Mocked ProductList</div>
}))

describe('App', () => {
  it('loads remote MFE', async () => {
    render(<App />)
    expect(await screen.findByText('Mocked ProductList')).toBeInTheDocument()
  })
})
```

### 9.3. E2E Testing

```typescript
// e2e/products.spec.ts
import { test, expect } from '@playwright/test'

test('should load products MFE', async ({ page }) => {
  await page.goto('http://localhost:3000/products')
  await expect(page.locator('text=Products')).toBeVisible()
})
```

---

## 10. BEST PRACTICES

### 10.1. Design Principles

**1. Independent & Autonomous**

- Mỗi MFE có thể develop, test, deploy independently
- Minimize dependencies giữa các MFEs

**2. Technology Agnostic**

- Mỗi MFE có thể dùng tech stack khác nhau
- Shell không nên assume tech stack của MFEs

**3. Resilient**

- MFE failure không crash toàn bộ app
- Implement error boundaries và fallbacks

**4. Consistent UX**

- Shared design system
- Consistent navigation và interactions

### 10.2. Common Pitfalls

**❌ Avoid:**

- Tight coupling giữa MFEs
- Sharing too much state
- Inconsistent styling
- No error handling
- Circular dependencies

**✅ Do:**

- Clear boundaries giữa MFEs
- Minimal shared state
- Shared design system
- Error boundaries
- Well-defined contracts

### 10.3. Performance Optimization

```typescript
// Preload remote modules
const preloadRemote = (remoteName: string) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'script'
  link.href = remotes[remoteName]
  document.head.appendChild(link)
}

// Preload on hover
<Link
  to="/products"
  onMouseEnter={() => preloadRemote('products_mfe')}
>
  Products
</Link>
```

---

**Kết luận:**

Micro-frontends là powerful pattern cho large-scale applications, nhưng cũng có trade-offs:

**Pros:**

- Independent deployment
- Team autonomy
- Technology diversity
- Incremental upgrades

**Cons:**

- Increased complexity
- Performance overhead
- Duplication of dependencies
- Testing challenges

**Khi nào nên dùng:**

- Large teams (> 5 teams)
- Complex domains
- Need for independent deployment
- Long-term maintenance

**Tài liệu tham khảo:**

- [Micro Frontends](https://micro-frontends.org/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Vite Plugin Federation](https://github.com/originjs/vite-plugin-federation)
- [Martin Fowler - Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
