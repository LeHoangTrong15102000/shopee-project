# ⚛️ ADVANCED REACT PATTERNS - CÁC PATTERN NÂNG CAO

> **Tài liệu chi tiết về Advanced React Patterns cho dự án Shopee Clone**
>
> **Tác giả:** AI Assistant | **Ngày:** 20/03/2026 | **Version:** 1.0

---

## 📑 MỤC LỤC

1. [Compound Components Pattern](#1-compound-components-pattern)
2. [Render Props Pattern](#2-render-props-pattern)
3. [Higher-Order Components (HOC)](#3-higher-order-components-hoc)
4. [Custom Hooks Pattern](#4-custom-hooks-pattern)
5. [Provider Pattern](#5-provider-pattern)
6. [State Reducer Pattern](#6-state-reducer-pattern)
7. [Control Props Pattern](#7-control-props-pattern)
8. [Props Getters Pattern](#8-props-getters-pattern)
9. [State Initializer Pattern](#9-state-initializer-pattern)
10. [Composition Pattern](#10-composition-pattern)

---

## 1. COMPOUND COMPONENTS PATTERN

### 1.1. Khái niệm

**Compound Components** là pattern cho phép nhiều components work together để tạo thành một complete UI.

### 1.2. Implementation

```typescript
// src/components/Tabs/Tabs.tsx
import { createContext, useContext, useState } from 'react'

// Context để share state giữa các compound components
const TabsContext = createContext<{
  activeTab: string
  setActiveTab: (tab: string) => void
} | null>(null)

const useTabs = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs')
  }
  return context
}

// Root component
const Tabs = ({ defaultTab, children }: {
  defaultTab: string
  children: React.ReactNode
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

// TabList component
const TabList = ({ children }: { children: React.ReactNode }) => {
  return (
    <div role="tablist" className="tab-list">
      {children}
    </div>
  )
}

// Tab component
const Tab = ({ value, children }: {
  value: string
  children: React.ReactNode
}) => {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={isActive ? 'tab active' : 'tab'}
    >
      {children}
    </button>
  )
}

// TabPanels component
const TabPanels = ({ children }: { children: React.ReactNode }) => {
  return <div className="tab-panels">{children}</div>
}

// TabPanel component
const TabPanel = ({ value, children }: {
  value: string
  children: React.ReactNode
}) => {
  const { activeTab } = useTabs()

  if (activeTab !== value) return null

  return (
    <div role="tabpanel" className="tab-panel">
      {children}
    </div>
  )
}

// Export as compound components
Tabs.TabList = TabList
Tabs.Tab = Tab
Tabs.TabPanels = TabPanels
Tabs.TabPanel = TabPanel

export default Tabs
```

### 1.3. Usage

```typescript
// src/pages/ProductDetail.tsx
import Tabs from 'src/components/Tabs'

const ProductDetail = () => {
  return (
    <Tabs defaultTab="description">
      <Tabs.TabList>
        <Tabs.Tab value="description">Mô tả</Tabs.Tab>
        <Tabs.Tab value="specs">Thông số</Tabs.Tab>
        <Tabs.Tab value="reviews">Đánh giá</Tabs.Tab>
      </Tabs.TabList>

      <Tabs.TabPanels>
        <Tabs.TabPanel value="description">
          <ProductDescription />
        </Tabs.TabPanel>
        <Tabs.TabPanel value="specs">
          <ProductSpecs />
        </Tabs.TabPanel>
        <Tabs.TabPanel value="reviews">
          <ProductReviews />
        </Tabs.TabPanel>
      </Tabs.TabPanels>
    </Tabs>
  )
}
```

### 1.4. Ưu điểm

- **Flexible**: Dễ dàng customize layout
- **Readable**: Code dễ đọc, dễ hiểu
- **Maintainable**: Dễ maintain và extend
- **Separation of concerns**: Mỗi component có responsibility riêng

---

## 2. RENDER PROPS PATTERN

### 2.1. Khái niệm

**Render Props** là pattern truyền một function as prop để component có thể render dynamic content.

### 2.2. Implementation

```typescript
// src/components/DataFetcher.tsx
import { useState, useEffect } from 'react'

interface DataFetcherProps<T> {
  url: string
  render: (data: {
    data: T | null
    loading: boolean
    error: Error | null
  }) => React.ReactNode
}

const DataFetcher = <T,>({ url, render }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return <>{render({ data, loading, error })}</>
}

export default DataFetcher
```

### 2.3. Usage

```typescript
// src/pages/ProductList.tsx
import DataFetcher from 'src/components/DataFetcher'
import { Product } from 'src/types/product.type'

const ProductList = () => {
  return (
    <DataFetcher<Product[]>
      url="/api/products"
      render={({ data, loading, error }) => {
        if (loading) return <div>Loading...</div>
        if (error) return <div>Error: {error.message}</div>
        if (!data) return null

        return (
          <div className="product-grid">
            {data.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )
      }}
    />
  )
}
```

### 2.4. Children as Function (Variant)

```typescript
// Alternative: Children as function
const DataFetcher = <T,>({ url, children }: {
  url: string
  children: (data: {
    data: T | null
    loading: boolean
    error: Error | null
  }) => React.ReactNode
}) => {
  // Same implementation
  return <>{children({ data, loading, error })}</>
}

// Usage
<DataFetcher<Product[]> url="/api/products">
  {({ data, loading, error }) => {
    if (loading) return <div>Loading...</div>
    // ...
  }}
</DataFetcher>
```

---

## 3. HIGHER-ORDER COMPONENTS (HOC)

### 3.1. Khái niệm

**HOC** là function nhận vào một component và return một enhanced component.

### 3.2. Implementation

```typescript
// src/hocs/withAuth.tsx
import { ComponentType } from 'react'
import { Navigate } from 'react-router'
import { useContext } from 'react'
import { AppContext } from 'src/contexts/app.context'

// HOC để protect routes
export const withAuth = <P extends object>(
  Component: ComponentType<P>
) => {
  return (props: P) => {
    const { isAuthenticated } = useContext(AppContext)

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    return <Component {...props} />
  }
}

// Usage
const ProtectedProfile = withAuth(Profile)
```

### 3.3. HOC với Additional Props

```typescript
// src/hocs/withLoading.tsx
import { ComponentType } from 'react'
import Loader from 'src/components/Loader'

interface WithLoadingProps {
  loading: boolean
}

export const withLoading = <P extends object>(
  Component: ComponentType<P>
) => {
  return (props: P & WithLoadingProps) => {
    const { loading, ...rest } = props

    if (loading) {
      return <Loader />
    }

    return <Component {...(rest as P)} />
  }
}

// Usage
const ProductListWithLoading = withLoading(ProductList)

<ProductListWithLoading loading={isLoading} products={products} />
```

### 3.4. Composing Multiple HOCs

```typescript
// src/hocs/compose.ts
export const compose = <P extends object>(
  ...hocs: Array<(component: ComponentType<P>) => ComponentType<P>>
) => {
  return (component: ComponentType<P>) => {
    return hocs.reduceRight((acc, hoc) => hoc(acc), component)
  }
}

// Usage
const EnhancedProfile = compose(
  withAuth,
  withLoading,
  withErrorBoundary
)(Profile)
```

### 3.5. HOC Best Practices

```typescript
// ✅ GOOD: Forward refs
export const withAuth = <P extends object>(
  Component: ComponentType<P>
) => {
  const WithAuth = forwardRef((props: P, ref) => {
    const { isAuthenticated } = useContext(AppContext)

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    return <Component {...props} ref={ref} />
  })

  // Set display name for debugging
  WithAuth.displayName = `withAuth(${Component.displayName || Component.name})`

  return WithAuth
}

// ✅ GOOD: Hoist non-react statics
import hoistNonReactStatics from 'hoist-non-react-statics'

export const withAuth = <P extends object>(
  Component: ComponentType<P>
) => {
  const WithAuth = (props: P) => {
    // ...
  }

  hoistNonReactStatics(WithAuth, Component)
  return WithAuth
}
```

---

## 4. CUSTOM HOOKS PATTERN

### 4.1. Khái niệm

**Custom Hooks** là functions bắt đầu bằng "use" và có thể sử dụng React hooks bên trong.

### 4.2. Data Fetching Hook

```typescript
// src/hooks/useFetch.ts
import { useState, useEffect } from 'react'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

export const useFetch = <T>(url: string): UseFetchResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchIndex, setRefetchIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(url)
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url, refetchIndex])

  const refetch = () => setRefetchIndex((prev) => prev + 1)

  return { data, loading, error, refetch }
}

// Usage
const ProductList = () => {
  const { data, loading, error, refetch } = useFetch<Product[]>('/api/products')

  if (loading) return <Loader />
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {data?.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}
```

### 4.3. Local Storage Hook

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  // Get initial value from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  // Update localStorage when value changes
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

// Usage
const Cart = () => {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('cart', [])

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item])
  }

  return (
    <div>
      {cartItems.map((item) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  )
}
```

### 4.4. Toggle Hook

```typescript
// src/hooks/useToggle.ts
import { useState, useCallback } from 'react'

export const useToggle = (
  initialValue = false
): [boolean, () => void, (value: boolean) => void] => {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  const setToggle = useCallback((newValue: boolean) => {
    setValue(newValue)
  }, [])

  return [value, toggle, setToggle]
}

// Usage
const Modal = () => {
  const [isOpen, toggle, setIsOpen] = useToggle(false)

  return (
    <>
      <button onClick={toggle}>Toggle Modal</button>
      {isOpen && (
        <div className="modal">
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </>
  )
}
```

### 4.5. Previous Value Hook

```typescript
// src/hooks/usePrevious.ts
import { useRef, useEffect } from 'react'

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// Usage
const Counter = () => {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

---

## 5. PROVIDER PATTERN

### 5.1. Khái niệm

**Provider Pattern** sử dụng Context API để share data across component tree mà không cần prop drilling.

### 5.2. Implementation

```typescript
// src/contexts/theme.context.tsx
import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as Theme) || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 5.3. Usage

```typescript
// src/main.tsx
import { ThemeProvider } from 'src/contexts/theme.context'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)

// src/components/Header.tsx
import { useTheme } from 'src/contexts/theme.context'

const Header = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <header>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  )
}
```

### 5.4. Optimizing Context Performance

```typescript
// src/contexts/optimized-app.context.tsx
import { createContext, useContext, useMemo } from 'react'

interface AppContextType {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  // Memoize computed values
  const isAuthenticated = useMemo(() => !!user, [user])

  // Memoize callbacks
  const login = useCallback((user: User) => {
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  // Memoize context value
  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated, login, logout]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
```

---

## 6. STATE REDUCER PATTERN

### 6.1. Khái niệm

**State Reducer Pattern** cho phép users control internal state của component thông qua reducer function.

### 6.2. Implementation

```typescript
// src/components/Counter/Counter.tsx
import { useReducer } from 'react'

type CounterAction =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' }
  | { type: 'SET'; payload: number }

interface CounterState {
  count: number
}

const defaultReducer = (state: CounterState, action: CounterAction): CounterState => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    case 'DECREMENT':
      return { count: state.count - 1 }
    case 'RESET':
      return { count: 0 }
    case 'SET':
      return { count: action.payload }
    default:
      return state
  }
}

interface CounterProps {
  initialCount?: number
  reducer?: (state: CounterState, action: CounterAction) => CounterState
}

const Counter = ({ initialCount = 0, reducer = defaultReducer }: CounterProps) => {
  const [state, dispatch] = useReducer(reducer, { count: initialCount })

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
    </div>
  )
}

export default Counter
```

### 6.3. Custom Reducer Usage

```typescript
// User có thể override reducer để customize behavior
const customReducer = (state: CounterState, action: CounterAction): CounterState => {
  // Call default reducer first
  const newState = defaultReducer(state, action)

  // Add custom logic
  if (action.type === 'INCREMENT' && newState.count > 10) {
    return { count: 10 } // Max limit
  }

  if (action.type === 'DECREMENT' && newState.count < 0) {
    return { count: 0 } // Min limit
  }

  return newState
}

// Usage
<Counter initialCount={5} reducer={customReducer} />
```

---

## 7. CONTROL PROPS PATTERN

### 7.1. Khái niệm

**Control Props Pattern** cho phép component có thể controlled hoặc uncontrolled.

### 7.2. Implementation

```typescript
// src/components/Input/ControlledInput.tsx
import { useState } from 'react'

interface InputProps {
  value?: string // Controlled
  defaultValue?: string // Uncontrolled
  onChange?: (value: string) => void
}

const Input = ({ value: controlledValue, defaultValue = '', onChange }: InputProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue)

  // Determine if controlled or uncontrolled
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue)
    }

    // Call onChange callback
    onChange?.(newValue)
  }

  return <input type="text" value={value} onChange={handleChange} />
}

export default Input
```

### 6.3. Usage

```typescript
// Uncontrolled usage
<Input defaultValue="Hello" onChange={(value) => console.log(value)} />

// Controlled usage
const [value, setValue] = useState('')
<Input value={value} onChange={setValue} />
```

---

## 8. PROPS GETTERS PATTERN

### 8.1. Khái niệm

**Props Getters Pattern** cung cấp functions để get props cho elements, giúp users dễ dàng integrate.

### 8.2. Implementation

```typescript
// src/hooks/useDropdown.ts
import { useState, useRef, useEffect } from 'react'

export const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Props getter for trigger button
  const getTriggerProps = (props = {}) => ({
    ...props,
    onClick: () => setIsOpen(!isOpen),
    'aria-expanded': isOpen,
    'aria-haspopup': true
  })

  // Props getter for dropdown menu
  const getMenuProps = (props = {}) => ({
    ...props,
    ref: dropdownRef,
    hidden: !isOpen,
    role: 'menu'
  })

  // Props getter for menu items
  const getItemProps = (props = {}) => ({
    ...props,
    role: 'menuitem',
    onClick: () => {
      props.onClick?.()
      setIsOpen(false)
    }
  })

  return {
    isOpen,
    getTriggerProps,
    getMenuProps,
    getItemProps
  }
}
```

### 8.3. Usage

```typescript
// src/components/Dropdown.tsx
import { useDropdown } from 'src/hooks/useDropdown'

const Dropdown = () => {
  const { getTriggerProps, getMenuProps, getItemProps } = useDropdown()

  return (
    <div>
      <button {...getTriggerProps()}>Menu</button>

      <div {...getMenuProps()}>
        <button {...getItemProps({ onClick: () => console.log('Profile') })}>
          Profile
        </button>
        <button {...getItemProps({ onClick: () => console.log('Settings') })}>
          Settings
        </button>
        <button {...getItemProps({ onClick: () => console.log('Logout') })}>
          Logout
        </button>
      </div>
    </div>
  )
}
```

---

## 9. STATE INITIALIZER PATTERN

### 9.1. Khái niệm

**State Initializer Pattern** cho phép reset state về initial value.

### 9.2. Implementation

```typescript
// src/hooks/useCounter.ts
import { useState, useCallback } from 'react'

export const useCounter = (initialCount = 0) => {
  const [count, setCount] = useState(initialCount)

  const increment = useCallback(() => {
    setCount((prev) => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1)
  }, [])

  // Reset to initial value
  const reset = useCallback(() => {
    setCount(initialCount)
  }, [initialCount])

  return { count, increment, decrement, reset }
}

// Usage
const Counter = () => {
  const { count, increment, decrement, reset } = useCounter(10)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset to 10</button>
    </div>
  )
}
```

---

## 10. COMPOSITION PATTERN

### 10.1. Khái niệm

**Composition Pattern** là việc combine nhiều components nhỏ để tạo thành complex UI.

### 10.2. Implementation

```typescript
// src/components/Card/Card.tsx
const Card = ({ children }: { children: React.ReactNode }) => {
  return <div className="card">{children}</div>
}

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-header">{children}</div>
}

const CardBody = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-body">{children}</div>
}

const CardFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-footer">{children}</div>
}

// Export as compound components
Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
```

### 10.3. Usage

```typescript
// Flexible composition
<Card>
  <Card.Header>
    <h2>Product Title</h2>
  </Card.Header>
  <Card.Body>
    <p>Product description...</p>
  </Card.Body>
  <Card.Footer>
    <button>Add to Cart</button>
  </Card.Footer>
</Card>

// Can omit parts
<Card>
  <Card.Body>
    <p>Simple card with only body</p>
  </Card.Body>
</Card>
```

---

**Kết luận:**

Advanced React Patterns giúp:
- **Reusability**: Code có thể reuse dễ dàng
- **Flexibility**: Dễ dàng customize và extend
- **Maintainability**: Code dễ maintain và scale
- **Separation of concerns**: Logic và UI tách biệt rõ ràng

**Khi nào dùng pattern nào?**
- **Compound Components**: Khi cần flexible layout (Tabs, Accordion, Dropdown)
- **Render Props**: Khi cần share logic với dynamic rendering
- **HOC**: Khi cần enhance component với additional functionality
- **Custom Hooks**: Khi cần reuse stateful logic
- **Provider Pattern**: Khi cần share data across component tree
- **State Reducer**: Khi cần users control internal state
- **Control Props**: Khi component cần support both controlled và uncontrolled
- **Props Getters**: Khi cần simplify integration với accessibility
- **State Initializer**: Khi cần reset functionality
- **Composition**: Khi cần flexible và reusable UI components

**Tài liệu tham khảo:**
- [React Patterns](https://reactpatterns.com/)
- [Advanced React Patterns](https://kentcdodds.com/blog/advanced-react-patterns)
- [React Hooks Patterns](https://blog.logrocket.com/react-hooks-patterns/)
