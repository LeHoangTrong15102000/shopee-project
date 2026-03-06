# 📚 Kiến Thức React TypeScript - Shopee Clone

## 🎯 Mục Lục

- [Chương 15: Setup Project & UI](#chương-15-setup-project--ui)
- [Chương 16: Register & Validation](#chương-16-register--validation)
- [Chương 17: API Integration](#chương-17-api-integration)
- [Chương 18: Authentication Flow](#chương-18-authentication-flow)
- [Chương 19: Product Management](#chương-19-product-management)
- [Chương 20: Production Ready](#chương-20-production-ready)

---

## 📖 Chương 15: Setup Project & UI

### 🎬 Video 152: Tạo Structure Project

```typescript
// Tạo folder layouts chứa những layout của dự án
// Tạo folder pages chứa những trang của dự án
```

#### 🏗️ Cấu Trúc Project

- **layouts/**: Chứa các layout components
- **pages/**: Chứa các trang của ứng dụng
- **components/**: Chứa các component tái sử dụng

### 🎬 Video 153: Code UI Trang Register

#### 🎨 TailwindCSS Mobile-First Design

```css
/* TailwindCSS là mobile first */
/* Code mobile trước, desktop sau */
.container {
  /* Mobile styles */
  @apply px-4;

  /* Desktop styles */
  @screen md {
    @apply px-8;
  }
}
```

#### ⚡ Key Points

- **Mobile First**: Thiết kế cho mobile trước, sau đó responsive cho desktop
- **TailwindCSS**: Sử dụng utility classes để styling nhanh chóng

---

## 🔐 Chương 16: Register & Validation

### 🎬 Video 155: Validate Register Form với React Hook Form

#### 📝 Register Function Behavior

```typescript
/**
 * register sẽ return về một object:
 * {
 *   onChange: ChangeHandler;
 *   onBlur: ChangeHandler;
 *   ref: RefCallBack;
 *   name: TFieldName;
 *   min?: string | number;
 *   max?: string | number;
 *   maxLength?: number;
 *   minLength?: number;
 *   pattern?: string;
 *   required?: boolean;
 *   disabled?: boolean;
 * }
 */
```

#### ⚡ Client-side Validation Benefits

- **Giảm tải Server**: Validate trên client trước khi gửi request
- **UX Tốt Hơn**: Phản hồi ngay lập tức cho người dùng
- **Re-render Logic**: RHF tự động re-render theo cơ chế tối ưu

#### 🔄 React Hook Form Behavior

```typescript
// Errors chỉ re-render khi cần thiết
const onSubmit = handleSubmit(
  (data) => {
    // onValid - Chạy khi form hợp lệ
    console.log('Valid data:', data)
  },
  (data) => {
    // onInvalid - Chạy khi form có lỗi
    console.log('Form errors:', data)
  }
)
```

#### 🛠️ Rules Configuration

```typescript
// Tạo file rules.ts để quản lý validation rules
import { RegisterOptions } from 'react-hook-form'

export const rules = {
  email: {
    required: 'Email là bắt buộc',
    pattern: {
      value: /^\S+@\S+$/i,
      message: 'Email không hợp lệ'
    }
  } as RegisterOptions,

  password: {
    required: 'Password là bắt buộc',
    minLength: {
      value: 6,
      message: 'Password ít nhất 6 ký tự'
    }
  } as RegisterOptions
}
```

### 🎬 Video 156: Xử Lý Confirm Password

#### 🛠️ Methods Quan Trọng

```typescript
// watch() - Lắng nghe input change và re-render component
const email = watch('email')

// getValues() - Lấy giá trị mà không re-render
const password = getValues('password')

// handleSubmit() - Nhận 2 tham số
const onSubmit = handleSubmit(
  (data) => {
    // onValid - Chạy khi form hợp lệ
    console.log('Form submitted:', data)
  },
  (data) => {
    // onInvalid - Chạy khi form có lỗi
    console.log('Form errors:', data)
  }
)
```

#### ✅ Custom Validation

```typescript
// Validate confirm password
validate: {
  matchPassword: (value) => {
    if (value === getValues('password')) {
      return true
    }
    return 'Nhập lại password không khớp'
  }
}
```

### 🎬 Video 158: Custom Container Class

#### ⚙️ Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem'
      }
    }
  }
}
```

### 🎬 Video 159: Tạo Component Input

#### 🧩 Reusable Input Component

```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string;
  classNameInput?: string;
  classNameError?: string;
}

const Input = ({ errorMessage, className, classNameInput, classNameError, ...rest }: InputProps) => {
  return (
    <div className={className}>
      <input
        className={classNameInput}
        {...rest}
      />
      <div className={classNameError}>{errorMessage}</div>
    </div>
  );
};
```

### 🎬 Video 160: Sử Dụng Yup Validation

> ⚠️ **Lưu ý**: Project hiện tại đã migrate sang Zod. Các ví dụ Yup bên dưới chỉ mang tính tham khảo lịch sử. Xem `src/utils/rules.ts` để tham khảo cách sử dụng Zod với baseSchema pattern.

#### 📦 Schema Setup

```typescript
import * as yup from 'yup'

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  password: yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Mật khẩu là bắt buộc'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('password')], 'Nhập lại password không khớp')
    .required('Xác nhận mật khẩu là bắt buộc')
})

type FormData = yup.InferType<typeof schema>
```

#### 🎯 Lợi Ích Yup

- **Type Inference**: Tự động tạo TypeScript types từ schema
- **Cross-field Validation**: Dễ dàng validate giữa các field
- **Omit & Pick**: Tái sử dụng schema với `Omit` và `Pick`

---

## 🌐 Chương 17: API Integration

### 🎬 Video 161: Setup Axios & React Query

#### ⚙️ HTTP Client Configuration

```typescript
// http.ts
import axios, { AxiosError } from 'axios'

const http = axios.create({
  baseURL: 'https://api-ecommerce.duthanhduoc.com/',
  timeout: 10000
})

// Request interceptor
http.interceptors.request.use(
  (config) => {
    const accessToken = getAccessTokenFromLS()
    if (accessToken && config.headers) {
      config.headers.authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default http
```

#### 🔄 React Query Setup

```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0
    }
  }
})
```

### 🎬 Video 162: API Interface Declaration

#### 🔗 Type Definitions

```typescript
// auth.type.ts
export interface User {
  _id: string
  roles: string[]
  email: string
  name?: string
  date_of_birth?: string
  avatar?: string
  address?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  access_token: string
  expires: string
  user: User
}

// utils.type.ts
export interface SuccessResponse<Data> {
  message: string
  data: Data
}

export interface ErrorResponse<Data> {
  message: string
  data?: Data
}
```

#### 📡 API Endpoints

```typescript
// auth.api.ts
import { AuthResponse } from 'src/types/auth.type'

const authApi = {
  registerAccount: (body: { email: string; password: string }) =>
    http.post<SuccessResponse<AuthResponse>>('/register', body),

  loginAccount: (body: { email: string; password: string }) => http.post<SuccessResponse<AuthResponse>>('/login', body),

  logoutAccount: () => http.post('/logout')
}

export default authApi
```

### 🎬 Video 163: Xử Lý Lỗi 422 từ Server

#### 🛡️ Type Predicate cho Error Handling

```typescript
// utils.ts
import axios, { AxiosError } from 'axios'

// Kiểm tra lỗi có phải từ Axios
export function isAxiosError<T>(error: unknown): error is AxiosError<T> {
  return axios.isAxiosError(error)
}

// Kiểm tra lỗi 422 (Validation Error)
export function isAxiosUnprocessableEntityError<FormError>(error: unknown): error is AxiosError<FormError> {
  return isAxiosError(error) && error.response?.status === 422
}
```

#### 🔧 SetError với React Hook Form

```typescript
// Xử lý lỗi trong component
const registerMutation = useMutation({
  mutationFn: (body: Omit<FormData, 'confirm_password'>) => authApi.registerAccount(body),
  onError: (error) => {
    if (isAxiosUnprocessableEntityError<ErrorResponse<FormError>>(error)) {
      const formError = error.response?.data.data
      if (formError) {
        Object.keys(formError).forEach((key) => {
          setError(key as keyof FormData, {
            message: formError[key],
            type: 'Server'
          })
        })
      }
    }
  }
})
```

### 🎬 Video 164: Axios Interceptor cho Error Handling

#### 🔄 Response Interceptor

```typescript
// http.ts - Response interceptor
http.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Xử lý lỗi không phải 422
    if (error.response?.status !== 422) {
      const data: any = error.response?.data
      const message = data?.message || error.message
      toast.error(message)
    }
    return Promise.reject(error)
  }
)
```

---

## 🧭 Chương 18: Authentication Flow

### 🎬 Video 165: Logic Trang Login

#### 🔄 Schema Reuse

```typescript
// Sử dụng schema từ register, bỏ confirm_password
const loginSchema = schema.omit(['confirm_password'])
type LoginFormData = yup.InferType<typeof loginSchema>
```

### 🎬 Video 166: Code UI Header - MainLayout

#### 💾 Token Storage & Navigation

```typescript
// Sau khi login thành công
const loginMutation = useMutation({
  mutationFn: (body: LoginFormData) => authApi.loginAccount(body),
  onSuccess: (data) => {
    // Lưu access_token vào localStorage
    setAccessTokenToLS(data.data.data.access_token)
    setProfileToLS(data.data.data.user)

    // Update context
    setIsAuthenticated(true)
    setProfile(data.data.data.user)

    // Redirect về trang chủ
    navigate('/')
  }
})
```

### 🎬 Video 167: Floating UI & Framer Motion Popover

#### 🎨 Animation Setup

```typescript
// Floating UI middleware
import { offset, flip, shift, arrow } from '@floating-ui/react';

const middleware = [
  offset(5),
  flip(),
  shift(),
  arrow({ element: arrowRef })
];

// Framer Motion animation
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Popover content */}
    </motion.div>
  )}
</AnimatePresence>
```

### 🎬 Video 168: Tạo Component Popover

#### 🧩 Flexible Popover Component

```typescript
interface PopoverProps {
  children: React.ReactNode;
  renderPopover: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  initialOpen?: boolean;
  placement?: Placement;
}

const Popover = ({
  children,
  renderPopover,
  className,
  as: Element = 'div',
  initialOpen,
  placement = 'bottom-end'
}: PopoverProps) => {
  const [open, setOpen] = useState(initialOpen || false);
  const id = useId();

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware,
    placement
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  return (
    <Element className={className} ref={refs.setReference} {...getReferenceProps()}>
      {children}
      <FloatingPortal id={id}>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
                transformOrigin: `${arrowRef.current?.style.left} top`
              }}
              {...getFloatingProps()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {renderPopover}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </Element>
  );
};
```

### 🎬 Video 170: Protected Route & Rejected Route

#### 🛡️ Route Guards

```typescript
// ProtectedRoute - Yêu cầu đăng nhập
const ProtectedRoute = () => {
  const { isAuthenticated } = useContext(AppContext);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// RejectedRoute - Chặn khi đã đăng nhập
const RejectedRoute = () => {
  const { isAuthenticated } = useContext(AppContext);
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

// Router configuration
const router = createBrowserRouter([
  {
    path: '',
    element: <RejectedRoute />,
    children: [
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/register',
        element: <Register />
      }
    ]
  },
  {
    path: '',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/cart',
        element: <Cart />
      },
      {
        path: '/user',
        element: <UserLayout />,
        children: [
          {
            path: '/user/profile',
            element: <Profile />
          }
        ]
      }
    ]
  }
]);
```

### 🎬 Video 171: Authentication Module Hoàn Chỉnh

#### 🚀 Performance Optimization

```typescript
// Context với memoization
const AppContext = createContext<AppContextInterface>({
  isAuthenticated: Boolean(getAccessTokenFromLS()),
  setIsAuthenticated: () => null,
  profile: getProfileFromLS(),
  setProfile: () => null,
  reset: () => null
});

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(getAccessTokenFromLS())
  );
  const [profile, setProfile] = useState<User | null>(getProfileFromLS());

  const reset = () => {
    setIsAuthenticated(false);
    setProfile(null);
  };

  // Tránh tạo object mới trong Context value
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      setIsAuthenticated,
      profile,
      setProfile,
      reset
    }),
    [isAuthenticated, profile]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
```

#### 💾 LocalStorage Utilities

```typescript
// auth.ts - Utility functions
export const setAccessTokenToLS = (access_token: string) => {
  localStorage.setItem('access_token', access_token)
}

export const getAccessTokenFromLS = () => {
  return localStorage.getItem('access_token') || ''
}

export const setProfileToLS = (profile: User) => {
  localStorage.setItem('profile', JSON.stringify(profile))
}

export const getProfileFromLS = () => {
  const result = localStorage.getItem('profile')
  return result ? JSON.parse(result) : null
}

export const clearLS = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('profile')
}
```

### 🎬 Video 172: Ngăn Chặn Spam Submit

#### 🔒 Loading State Management

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const Button = ({ children, className, isLoading, disabled, ...rest }: ButtonProps) => {
  const newClassName = disabled || isLoading ?
    className + ' cursor-not-allowed' : className;

  return (
    <button
      className={newClassName}
      disabled={disabled || isLoading}
      {...rest}
    >
      {children}
    </button>
  );
};

// Usage trong form
<Button
  type="submit"
  className="w-full bg-red-500 py-4 text-white"
  isLoading={registerMutation.isLoading}
>
  Đăng ký
</Button>
```

---

## 🛍️ Chương 19: Product Management

### 🎬 Video 174-176: UI Components

#### 🏗️ Component Structure

```typescript
// AsideFilter - Product filtering
// SortProductList - Product sorting options
// Product - Individual product card

// Image aspect ratio technique
.aspect-square {
  padding-top: 100%;
  position: relative;
}

.image-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### 🎬 Video 177: Interface & API Declaration

#### 🔗 Product Types & Configuration

```typescript
// product.type.ts
export interface Product {
  _id: string
  name: string
  price: number
  price_before_discount: number
  sold: number
  rating: number
  image: string
  images: string[]
  category: {
    _id: string
    name: string
  }
  quantity: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface ProductListConfig {
  page?: number | string
  limit?: number | string
  sort_by?: 'createdAt' | 'view' | 'sold' | 'price'
  order?: 'asc' | 'desc'
  exclude?: string
  rating_filter?: number | string
  price_max?: number | string
  price_min?: number | string
  name?: string
  category?: string
}
```

#### 🎣 Custom Hook useQueryConfig

```typescript
const useQueryConfig = () => {
  const queryParams = useQueryParams()
  const queryConfig: QueryConfig = removeUndefinedProperties({
    page: queryParams.page || '1',
    limit: queryParams.limit || '20',
    sort_by: queryParams.sort_by,
    exclude: queryParams.exclude,
    name: queryParams.name,
    order: queryParams.order,
    price_max: queryParams.price_max,
    price_min: queryParams.price_min,
    rating_filter: queryParams.rating_filter,
    category: queryParams.category
  })

  return queryConfig
}
```

### 🎬 Video 178: Format Numbers & Display

#### 🌍 Internationalization

```typescript
// Format giá tiền (German format phù hợp VN)
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE').format(value)
}

// Format số lượng bán (compact notation)
export const formatNumberToSocialStyle = (value: number) => {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  })
    .format(value)
    .replace('.', ',')
    .toLowerCase()
}
```

### 🎬 Video 179: Rating Stars Algorithm

#### ⭐ Smart Star Rating

```typescript
/**
 * Algorithm cho rating stars
 * Ví dụ: rating = 3.4
 * - Star 1: 1 <= 3.4 → 100% fill
 * - Star 2: 2 <= 3.4 → 100% fill
 * - Star 3: 3 <= 3.4 → 100% fill
 * - Star 4: 4 > 3.4 → 40% fill (4 - 3.4 = 0.6 < 1)
 * - Star 5: 5 > 3.4 → 0% fill (5 - 3.4 = 1.6 > 1)
 */

const ProductRating = ({ rating }: { rating: number }) => {
  const handleWidth = (order: number) => {
    if (order <= rating) {
      return '100%';
    }
    if (order > rating && order - rating < 1) {
      return `${(rating - Math.floor(rating)) * 100}%`;
    }
    return '0%';
  };

  return (
    <div className="flex items-center">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div className="relative" key={index}>
            <div
              className="absolute left-0 top-0 h-3 w-3 overflow-hidden"
              style={{
                width: handleWidth(index + 1)
              }}
            >
              <svg
                enableBackground="new 0 0 15 15"
                viewBox="0 0 15 15"
                x={0}
                y={0}
                className="h-3 w-3 fill-yellow-300 text-yellow-300"
              >
                <polygon
                  points="7.5,0 9.7,5.4 15.2,5.4 11.7,8.8 13.9,14.2 7.5,10.8 1.1,14.2 3.3,8.8 -0.2,5.4 5.3,5.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit={10}
                />
              </svg>
            </div>
            <svg
              enableBackground="new 0 0 15 15"
              viewBox="0 0 15 15"
              x={0}
              y={0}
              className="h-3 w-3 fill-current text-gray-300"
            >
              <polygon
                points="7.5,0 9.7,5.4 15.2,5.4 11.7,8.8 13.9,14.2 7.5,10.8 1.1,14.2 3.3,8.8 -0.2,5.4 5.3,5.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit={10}
              />
            </svg>
          </div>
        ))}
    </div>
  );
};
```

### 🎬 Video 180: Pagination Algorithm

#### 📄 Smart Pagination Logic

```typescript
/**
 * Pagination với range = 2
 *
 * Examples:
 * [1] 2 3 ... 19 20    (page 1)
 * 1 [2] 3 4 ... 19 20  (page 2)
 * 1 2 [3] 4 5 ... 19 20 (page 3)
 * 1 ... 4 [5] 6 ... 19 20 (page 5)
 * 1 2 ... 16 17 [18] 19 20 (page 18)
 */

const Pagination = ({ queryConfig, pageSize }: PaginationProps) => {
  const page = Number(queryConfig.page);
  const navigate = useNavigate();
  const RANGE = 2;

  const renderPagination = () => {
    let dotAfter = false;
    let dotBefore = false;

    const renderDotBefore = (index: number) => {
      if (!dotBefore) {
        dotBefore = true;
        return (
          <span key={index} className="mx-2 cursor-default rounded-sm border bg-white px-3 py-2 shadow-xs">
            ...
          </span>
        );
      }
      return null;
    };

    const renderDotAfter = (index: number) => {
      if (!dotAfter) {
        dotAfter = true;
        return (
          <span key={index} className="mx-2 cursor-default rounded-sm border bg-white px-3 py-2 shadow-xs">
            ...
          </span>
        );
      }
      return null;
    };

    return Array(pageSize)
      .fill(0)
      .map((_, index) => {
        const pageNumber = index + 1;

        // Trong khoảng
        if (page <= RANGE * 2 + 1 && pageNumber > page + RANGE && pageNumber < pageSize - RANGE + 1) {
          return renderDotAfter(index);
        } else if (page > RANGE * 2 + 1 && page < pageSize - RANGE * 2) {
          if (pageNumber < page - RANGE && pageNumber > RANGE) {
            return renderDotBefore(index);
          } else if (pageNumber > page + RANGE && pageNumber < pageSize - RANGE + 1) {
            return renderDotAfter(index);
          }
        } else if (page >= pageSize - RANGE * 2 && pageNumber > RANGE && pageNumber < page - RANGE) {
          return renderDotBefore(index);
        }

        return (
          <Link
            to={{
              pathname: path.home,
              search: createSearchParams({
                ...queryConfig,
                page: pageNumber.toString()
              }).toString()
            }}
            key={index}
            className={classNames(
              'mx-2 cursor-pointer rounded-sm border bg-white px-3 py-2 shadow-xs',
              {
                'border-cyan-500': pageNumber === page,
                'border-transparent': pageNumber !== page
              }
            )}
          >
            {pageNumber}
          </Link>
        );
      });
  };

  return (
    <div className="mt-6 flex flex-wrap justify-center">
      {page === 1 ? (
        <span className="mx-2 cursor-not-allowed rounded-sm border bg-white/60 px-3 py-2 shadow-xs">Prev</span>
      ) : (
        <Link
          to={{
            pathname: path.home,
            search: createSearchParams({
              ...queryConfig,
              page: (page - 1).toString()
            }).toString()
          }}
          className="mx-2 cursor-pointer rounded-sm border bg-white px-3 py-2 shadow-xs"
        >
          Prev
        </Link>
      )}

      {renderPagination()}

      {page === pageSize ? (
        <span className="mx-2 cursor-not-allowed rounded-sm border bg-white/60 px-3 py-2 shadow-xs">Next</span>
      ) : (
        <Link
          to={{
            pathname: path.home,
            search: createSearchParams({
              ...queryConfig,
              page: (page + 1).toString()
            }).toString()
          }}
          className="mx-2 cursor-pointer rounded-sm border bg-white px-3 py-2 shadow-xs"
        >
          Next
        </Link>
      )}
    </div>
  );
};
```

---

## 🔍 Chương 20: Production Ready

### 🎬 Video 189: SEO-Friendly URLs

#### 🔗 URL Structure & Utils

```typescript
// SEO-friendly URL: /ten-san-pham-i.productId
// Example: /iPhone-12-Pro-Max-i.60afb1c56ef5b902180aacb8

export const generateNameId = ({ name, id }: { name: string; id: string }) => {
  return removeSpecialCharacter(name).replace(/\s/g, '-') + `-i.${id}`
}

export const getIdFromNameId = (nameId: string) => {
  const arr = nameId.split('-i.')
  return arr[arr.length - 1]
}

export const removeSpecialCharacter = (str: string) => {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, '')
}
```

#### ⚙️ Vite Configuration

```typescript
// vite.config.ts - Fix cho URL có dấu chấm
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src')
    }
  }
})
```

### 🎬 Video 191: Search Functionality

#### 🔍 Search Implementation

```typescript
const useSearchProducts = () => {
  const queryConfig = useQueryConfig()
  const navigate = useNavigate()

  const { register, handleSubmit } = useForm<{ name: string }>({
    defaultValues: {
      name: ''
    }
  })

  const onSubmitSearch = handleSubmit((data) => {
    const config = queryConfig.order ? omit(queryConfig, ['order']) : queryConfig

    navigate({
      pathname: path.home,
      search: createSearchParams({
        ...config,
        name: data.name
      }).toString()
    })
  })

  return {
    register,
    onSubmitSearch
  }
}
```

---

## 📝 Tổng Kết

### 🎯 **Technologies Stack**

- **Frontend**: React 18, TypeScript, TailwindCSS
- **State Management**: React Query, Context API
- **Form**: React Hook Form, Zod validation (đã migrate từ Yup)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios với interceptors
- **Animation**: Framer Motion
- **UI Components**: Floating UI, Headless UI

### 🚀 **Key Features Implemented**

- ✅ Authentication (Login/Register/Logout)
- ✅ Protected Routes & Route Guards
- ✅ Product Listing với Pagination
- ✅ Advanced Filtering (Category, Price, Rating)
- ✅ Product Detail với Image Zoom
- ✅ Shopping Cart Management
- ✅ Search Functionality
- ✅ Responsive Design
- ✅ SEO-friendly URLs
- ✅ Error Handling & Validation

### 🏗️ **Architecture Patterns**

- **Component Composition**: Tái sử dụng và modularity
- **Custom Hooks**: Logic separation và reusability
- **Type Safety**: Strict TypeScript configuration
- **Performance**: Memoization và React Query caching
- **Error Boundaries**: Graceful error handling
- **Security**: XSS protection, input sanitization

Đây là foundation vững chắc cho một ứng dụng React production-ready! 🎉
