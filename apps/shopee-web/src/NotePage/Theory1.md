# 🛒 Shopping Cart & Advanced Features - Shopee Clone

## 🎯 Mục Lục

- [Chương 21: Shopping Cart Implementation](#chương-21-shopping-cart-implementation)
- [Chương 22: Advanced Form Handling](#chương-22-advanced-form-handling)
- [Chương 23: API Management & State](#chương-23-api-management--state)

---

## 🛒 Chương 21: Shopping Cart Implementation

### 🎬 Video 196: Cập Nhật InputNumber & QuantityController

#### 🔧 Local State Management Strategy

```typescript
// InputNumber với local state fallback
const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  ({ value, onChange, ...rest }, ref) => {
    const [localValue, setLocalValue] = useState(Number(value) || 0);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (/^\d+$/.test(value) || value === '') {
        // Update local state cho fallback
        setLocalValue(Number(value));
        // Call external onChange nếu có
        onChange && onChange(event);
      }
    };

    return (
      <input
        {...rest}
        ref={ref}
        value={value !== undefined ? value : localValue}
        onChange={handleChange}
      />
    );
  }
);
```

#### 🎯 Component Design Goals

- **Flexible Usage**: Component hoạt động dù không truyền props
- **Controlled/Uncontrolled**: Hỗ trợ cả hai mode
- **Type Safety**: Chỉ cho phép nhập số

#### 🎮 QuantityController Enhancement

```typescript
const QuantityController = ({ value, onChange, max, ...rest }: QuantityControllerProps) => {
  const [localValue, setLocalValue] = useState(Number(value) || 0);

  const increase = () => {
    let _value = Number(value || localValue) + 1;
    if (max !== undefined && _value > max) {
      _value = max;
    }
    setLocalValue(_value);
    onChange && onChange(_value);
  };

  const decrease = () => {
    let _value = Number(value || localValue) - 1;
    if (_value < 1) _value = 1;
    setLocalValue(_value);
    onChange && onChange(_value);
  };

  return (
    <div className="flex items-center">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-l-sm border border-gray-300"
        onClick={decrease}
      >
        -
      </button>
      <InputNumber
        value={value !== undefined ? value : localValue}
        onChange={(e) => {
          const _value = Number(e.target.value);
          setLocalValue(_value);
          onChange && onChange(_value);
        }}
        {...rest}
      />
      <button
        className="flex h-8 w-8 items-center justify-center rounded-r-sm border border-gray-300"
        onClick={increase}
      >
        +
      </button>
    </div>
  );
};
```

### 🎬 Video 197: InputV2 với useController

#### 🎛️ Advanced Generic Types

```typescript
// Demonstration: Generic types với function dependency
interface GenericExample<
  TFunc extends () => string,
  TLastName extends ReturnType<TFunc>
> {
  person: {
    getName: TFunc;
  };
  lastName: TLastName;
}

// InputV2 với useController và generic types
interface InputV2Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends UseControllerProps<TFieldValues, TName>, InputNumberProps {}

const InputV2 = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  type,
  onChange,
  className,
  classNameInput,
  classNameError,
  value = '',
  ...rest
}: InputV2Props<TFieldValues, TName>) => {
  const { field, fieldState } = useController(rest);
  const [localValue, setLocalValue] = useState<string>(field.value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valueFromInput = event.target.value;
    const numberCondition = type === 'number' && (/^\d+$/.test(valueFromInput) || valueFromInput === '');

    if (numberCondition || type !== 'number') {
      setLocalValue(valueFromInput);
      field.onChange(event);
      onChange && onChange(event);
    }
  };

  return (
    <div className={className}>
      <input
        {...field}
        className={classNameInput}
        onChange={handleChange}
        value={value || localValue}
      />
      <div className={classNameError}>{fieldState.error?.message}</div>
    </div>
  );
};
```

#### 🎯 Key Benefits

- **Type Safety**: Generic types đảm bảo type checking chặt chẽ
- **Controller Integration**: Hoạt động seamless với React Hook Form
- **Flexible**: Hỗ trợ cả text và number input

### 🎬 Video 198: Purchase API & Logout Fix

#### 🛒 Purchase API Definitions

```typescript
// Purchase API endpoints
const purchaseApi = {
  addToCart: (body: { product_id: string; buy_count: number }) =>
    http.post<SuccessResponse<Purchase>>('/purchases/add-to-cart', body),

  getPurchases: (params: { status: PurchaseStatus }) => http.get<SuccessResponse<Purchase[]>>('/purchases', { params }),

  buyProducts: (body: { product_id: string; buy_count: number }[]) =>
    http.post<SuccessResponse<Purchase[]>>('/purchases/buy-products', body),

  updatePurchase: (body: { product_id: string; buy_count: number }) =>
    http.put<SuccessResponse<Purchase>>('/purchases/update-purchase', body),

  deletePurchases: (purchaseIds: string[]) =>
    http.delete<SuccessResponse<{ deleted_count: number }>>('/purchases', {
      data: purchaseIds
    })
}

// Purchase status constants
export const purchaseStatus = {
  inCart: -1,
  waitForConfirmation: 1,
  waitForGetting: 2,
  inProgress: 3,
  delivered: 4,
  cancelled: 5
} as const
```

#### 🚪 Logout Query Cleanup

```typescript
// Clear React Query cache on logout
const logoutMutation = useMutation({
  mutationFn: authApi.logout,
  onSuccess: () => {
    queryClient.removeQueries({
      queryKey: ['purchases', { status: purchaseStatus.inCart }],
      exact: true
    })
    // Clear other user-specific queries...
  }
})
```

### 🎬 Video 199: Cart UI Implementation

#### 🎨 Cart Layout Structure

```typescript
const Cart = () => {
  return (
    <div className="bg-neutral-100 py-16">
      <div className="container">
        {/* Cart Items với overflow handling */}
        <div className="overflow-auto">
          <div className="min-w-[1000px]">
            {/* Header Grid */}
            <div className="grid grid-cols-12 rounded-xs bg-white py-5 px-9 text-sm capitalize text-gray-500 shadow-sm">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-2">Đơn giá</div>
              <div className="col-span-2">Số lượng</div>
              <div className="col-span-1">Số tiền</div>
              <div className="col-span-1">Thao tác</div>
            </div>

            {/* Cart Items */}
            {extendedPurchases.map((purchase, index) => (
              <CartItem key={purchase._id} purchase={purchase} index={index} />
            ))}
          </div>
        </div>

        {/* Sticky Summary */}
        <div className="sticky bottom-0 z-10 mt-8 flex flex-col rounded-xs border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center">
            <div className="flex shrink-0 items-center justify-center pr-3">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={isAllChecked}
                onChange={handleCheckAll}
              />
            </div>
            <button className="mx-3 border-none bg-none">
              Chọn tất cả ({extendedPurchases.length})
            </button>
            <button className="mx-3 border-none bg-none" onClick={handleDeleteManyPurchases}>
              Xóa
            </button>
          </div>

          <div className="mt-5 flex flex-col sm:ml-auto sm:mt-0 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center sm:justify-end">
                <div>Tổng thanh toán ({checkedPurchasesCount} sản phẩm):</div>
                <div className="ml-2 text-2xl text-orange">₫{formatCurrency(totalCheckedPurchasePrice)}</div>
              </div>
              <div className="flex items-center text-sm sm:justify-end">
                <div className="text-gray-500">Tiết kiệm</div>
                <div className="ml-6 text-orange">₫{formatCurrency(totalCheckedPurchaseSavingPrice)}</div>
              </div>
            </div>
            <Button
              className="mt-5 flex h-10 w-52 items-center justify-center bg-red-500 text-sm uppercase text-white hover:bg-red-600 sm:ml-4 sm:mt-0"
              onClick={handleBuyPurchases}
              disabled={buyPurchasesMutation.isLoading}
            >
              Mua hàng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 🎬 Video 200: Checked State với Immer.js

#### 🔄 Extended Purchase Type

```typescript
// Extended Purchase với checked và disabled state
export interface ExtendedPurchase extends Purchase {
  disabled: boolean
  checked: boolean
}

// Context state cho extended purchases
interface AppContextInterface {
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
  profile: User | null
  setProfile: React.Dispatch<React.SetStateAction<User | null>>
  extendedPurchases: ExtendedPurchase[]
  setExtendedPurchases: React.Dispatch<React.SetStateAction<ExtendedPurchase[]>>
  reset: () => void
}
```

#### 🔧 Immer.js cho State Updates

```typescript
import { produce } from 'immer'

// Initialize extended purchases from API data
useEffect(() => {
  setExtendedPurchases((prev) => {
    const extendedPurchasesObject = keyBy(prev, '_id')
    return (
      purchasesInCart?.map((purchase) => ({
        ...purchase,
        disabled: false,
        checked: Boolean(extendedPurchasesObject[purchase._id]?.checked)
      })) || []
    )
  })
}, [purchasesInCart])

// Handle individual item check
const handleCheck = (purchaseIndex: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
  setExtendedPurchases(
    produce((draft) => {
      draft[purchaseIndex].checked = event.target.checked
    })
  )
}

// Handle check all
const handleCheckAll = () => {
  setExtendedPurchases((prev) =>
    prev.map((purchase) => ({
      ...purchase,
      checked: !isAllChecked
    }))
  )
}

// Computed values
const isAllChecked = useMemo(() => extendedPurchases.every((purchase) => purchase.checked), [extendedPurchases])

const checkedPurchases = useMemo(() => extendedPurchases.filter((purchase) => purchase.checked), [extendedPurchases])
```

### 🎬 Video 201: Update Cart Logic

#### 🔄 Update Purchase Mutation

```typescript
// Update purchase quantity
const updatePurchaseMutation = useMutation({
  mutationFn: purchaseApi.updatePurchase,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['purchases', { status: purchaseStatus.inCart }]
    })
  }
})

// Handle quantity change với enabled condition
const handleQuantity = (purchaseIndex: number, value: number, enabled: boolean) => {
  if (enabled) {
    const purchase = extendedPurchases[purchaseIndex]

    // Disable item during update
    setExtendedPurchases(
      produce((draft) => {
        draft[purchaseIndex].disabled = true
      })
    )

    // Update quantity
    updatePurchaseMutation.mutate({
      product_id: purchase.product._id,
      buy_count: value
    })
  }
}

// QuantityController event handlers
const handleTypeQuantity = (purchaseIndex: number) => (value: number) => {
  setExtendedPurchases(
    produce((draft) => {
      draft[purchaseIndex].buy_count = value
    })
  )
}

const handleQuantityFocusOut = (purchaseIndex: number, value: number) => {
  handleQuantity(purchaseIndex, value, value !== (purchasesInCart as Purchase[])[purchaseIndex]?.buy_count)
}
```

#### 🎮 Enhanced QuantityController

```typescript
<QuantityController
  max={purchase.product.quantity}
  value={purchase.buy_count}
  classNameWrapper="flex items-center"
  onIncrease={(value) => handleQuantity(index, value, value <= purchase.product.quantity)}
  onDecrease={(value) => handleQuantity(index, value, value >= 1)}
  onType={handleTypeQuantity(index)}
  onFocusOut={(value) => handleQuantityFocusOut(index, value)}
  disabled={purchase.disabled}
/>
```

### 🎬 Video 202: Delete & Buy Functions

#### 🗑️ Delete Purchases

```typescript
// Delete mutation
const deletePurchasesMutation = useMutation({
  mutationFn: purchaseApi.deletePurchases,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['purchases', { status: purchaseStatus.inCart }]
    })
  }
})

// Delete handlers với currying
const handleDelete = (purchaseIndex: number) => () => {
  const purchaseId = extendedPurchases[purchaseIndex]._id
  deletePurchasesMutation.mutate([purchaseId])
}

const handleDeleteManyPurchases = () => {
  const purchaseIds = checkedPurchases.map((purchase) => purchase._id)
  deletePurchasesMutation.mutate(purchaseIds)
}
```

#### 💰 Price Calculations

```typescript
// Memoized calculations cho performance
const checkedPurchasesCount = useMemo(() => checkedPurchases.length, [checkedPurchases])

const totalCheckedPurchasePrice = useMemo(
  () =>
    checkedPurchases.reduce((result, current) => {
      return result + current.product.price * current.buy_count
    }, 0),
  [checkedPurchases]
)

const totalCheckedPurchaseSavingPrice = useMemo(
  () =>
    checkedPurchases.reduce((result, current) => {
      return result + (current.product.price_before_discount - current.product.price) * current.buy_count
    }, 0),
  [checkedPurchases]
)
```

#### 🛒 Buy Products

```typescript
// Buy products mutation
const buyPurchasesMutation = useMutation({
  mutationFn: purchaseApi.buyProducts,
  onSuccess: (data) => {
    queryClient.invalidateQueries({
      queryKey: ['purchases', { status: purchaseStatus.inCart }]
    })
    toast.success(`Mua ${data.data.data.length} sản phẩm thành công`)
  }
})

// Handle buy
const handleBuyPurchases = () => {
  if (checkedPurchases.length > 0) {
    const body = checkedPurchases.map((purchase) => ({
      product_id: purchase.product._id,
      buy_count: purchase.buy_count
    }))
    buyPurchasesMutation.mutate(body)
  }
}
```

### 🎬 Video 203: CartHeader & Search Hook

#### 🎨 Cart Layout Component

```typescript
// CartLayout với custom header
const CartLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <CartHeader />
      {children}
      <Footer />
    </div>
  );
};

// CartHeader component
const CartHeader = () => {
  const { onSubmitSearch, register } = useSearchProducts();

  return (
    <div className="border-b-4 border-b-orange">
      <div className="bg-orange text-white">
        <div className="container">
          <nav className="flex items-center justify-between py-2">
            <Link to="/" className="flex items-center">
              <svg className="mr-4 h-8 w-8 lg:h-11 lg:w-11" viewBox="0 0 192 65">
                {/* Logo SVG */}
              </svg>
              <div className="mx-4 h-6 w-px bg-orange-300 lg:h-8" />
              <div className="capitalize text-orange-300 lg:text-xl">Giỏ hàng</div>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};
```

#### 🔍 Custom Search Hook

```typescript
// useSearchProducts hook cho reusability
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

### 🎬 Video 204: Buy Now Feature

#### 🛒 Router State Navigation

```typescript
// Buy now implementation với router state
const handleBuyNow = async () => {
  const res = await addToCartMutation.mutateAsync({
    buy_count: buyCount,
    product_id: product?._id as string
  })

  const purchase = res.data.data
  navigate('/cart', {
    state: {
      purchaseId: purchase._id
    }
  })
}

// Cart component - Handle router state
const location = useLocation()
const choosenPurchaseIdFromLocation = (location.state as { purchaseId: string } | null)?.purchaseId

useEffect(() => {
  setExtendedPurchases((prev) => {
    const extendedPurchasesObject = keyBy(prev, '_id')
    return (
      purchasesInCart?.map((purchase) => {
        const isChoosenPurchaseFromLocation = choosenPurchaseIdFromLocation === purchase._id
        return {
          ...purchase,
          disabled: false,
          checked: isChoosenPurchaseFromLocation || Boolean(extendedPurchasesObject[purchase._id]?.checked)
        }
      }) || []
    )
  })
}, [purchasesInCart, choosenPurchaseIdFromLocation])

// Clear router state để tránh persist khi F5
useEffect(() => {
  return () => {
    history.replaceState(null, '')
  }
}, [])
```

---

## 👤 Chương 22: Advanced Form Handling

### 🎬 Video 205: Token Expiration Handling

#### 🔒 EventTarget Pattern

```typescript
// EventTarget cho global event handling
const eventTarget = new EventTarget()

// Clear localStorage và dispatch event
export const clearLS = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('profile')

  // Dispatch custom event
  const clearLSEvent = new Event('clearLS')
  eventTarget.dispatchEvent(clearLSEvent)
}

// Listen for clearLS event trong App component
useEffect(() => {
  const handleClearLS = () => {
    reset() // Reset AppContext state
  }

  eventTarget.addEventListener('clearLS', handleClearLS)

  return () => {
    eventTarget.removeEventListener('clearLS', handleClearLS)
  }
}, [reset])
```

#### 🔄 Axios Interceptor cho 401 Handling

```typescript
// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      clearLS()
      // Optional: Show error message
      toast.error('Phiên đăng nhập đã hết hạn')
    }

    return Promise.reject(error)
  }
)
```

### 🎬 Video 206: Nested Routes cho User Layout

#### 🧭 User Routes Structure

```typescript
// Nested routes configuration
{
  path: path.user,
  element: (
    <MainLayout>
      <UserLayout />
    </MainLayout>
  ),
  children: [
    {
      path: path.profile,
      element: <Profile />
    },
    {
      path: path.changePassword,
      element: <ChangePassword />
    },
    {
      path: path.historyPurchases,
      element: <HistoryPurchases />
    }
  ]
}

// UserLayout với Outlet
const UserLayout = () => {
  return (
    <div className="bg-neutral-100 py-16 text-sm text-gray-600">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-3 lg:col-span-2">
            <UserSideNav />
          </div>
          <div className="md:col-span-9 lg:col-span-10">
            <Outlet /> {/* Render child routes */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🚀 Chương 23: API Management & State

### 🎬 Video 218: Đơn Mua & Status Management

#### 📋 Purchase Status Handling

```typescript
// Purchase status navigation
const purchaseStatuses = [
  { status: purchaseStatus.all, name: 'Tất cả' },
  { status: purchaseStatus.waitForConfirmation, name: 'Chờ xác nhận' },
  { status: purchaseStatus.waitForGetting, name: 'Chờ lấy hàng' },
  { status: purchaseStatus.inProgress, name: 'Đang giao' },
  { status: purchaseStatus.delivered, name: 'Đã giao' },
  { status: purchaseStatus.cancelled, name: 'Đã hủy' }
];

// Active status detection với queryParams
const useQueryParams = () => {
  const [searchParams] = useSearchParams();
  return Object.fromEntries([...searchParams]);
};

const HistoryPurchases = () => {
  const queryParams = useQueryParams();
  const status = Number(queryParams.status) || purchaseStatus.all;

  // Query với status parameter
  const { data: purchasesData } = useQuery({
    queryKey: ['purchases', { status }],
    queryFn: () => purchaseApi.getPurchases({ status })
  });

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="rounded-t-sm shadow-xs">
            {purchaseStatuses.map((item) => (
              <Link
                key={item.status}
                to={{
                  pathname: path.historyPurchases,
                  search: createSearchParams({
                    status: String(item.status)
                  }).toString()
                }}
                className={classNames(
                  'flex flex-1 items-center justify-center border-b-2 bg-white py-4 text-center',
                  {
                    'border-b-orange text-orange': status === item.status,
                    'border-b-black/10 text-gray-900': status !== item.status
                  }
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
        {purchasesData?.data.data.map((purchase) => (
          <div key={purchase._id} className="mt-4 rounded-xs border-black/10 bg-white p-6 text-gray-800 shadow-xs">
            {/* Purchase item display */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 📝 Tổng Kết

### 🎯 **Core Achievements trong Các Chương**

#### 🛒 **Shopping Cart (Chương 21)**

- ✅ **State Management**: Immer.js cho complex state updates
- ✅ **Local State Strategy**: InputNumber với fallback state
- ✅ **Generic Types**: Advanced TypeScript với useController
- ✅ **API Integration**: CRUD operations cho cart management
- ✅ **UI/UX**: Sticky summary, loading states, optimistic updates

#### 👤 **Advanced Forms (Chương 22)**

- ✅ **Authentication Flow**: Token expiry với EventTarget pattern
- ✅ **Nested Routing**: Clean route structure với React Router v6
- ✅ **Form Handling**: Multi-step forms với React Hook Form
- ✅ **File Upload**: Avatar upload với FormData
- ✅ **Validation**: Complex cross-field validation với Yup

#### 🚀 **API & State (Chương 23)**

- ✅ **Purchase Management**: Comprehensive purchase status handling
- ✅ **React Query**: Advanced caching và data synchronization
- ✅ **URL State**: Query params cho filter navigation
- ✅ **Performance**: Memoized calculations và optimal re-renders

### 🏗️ **Advanced Patterns Applied**

#### 🎨 **UI/UX Excellence**

- **Responsive Design**: Mobile-first với TailwindCSS
- **Loading States**: Skeleton screens, disabled states
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Graceful degradation
- **Accessibility**: ARIA labels, keyboard navigation

#### 🔧 **Technical Architecture**

- **Type Safety**: Strict TypeScript với generic constraints
- **Performance**: React.memo, useMemo, useCallback
- **State Management**: Context + Immer.js cho complex updates
- **API Layer**: Axios interceptors, React Query caching
- **Routing**: Nested routes, protected routes, query params

### 📈 **Production-Ready Features**

- 🔒 **Security**: XSS protection, input sanitization
- 🚀 **Performance**: Bundle optimization, lazy loading
- 🔄 **Real-time**: Optimistic updates, instant feedback
- 📱 **Mobile**: Touch-friendly, responsive design
- 🧪 **Testing**: Unit tests, integration tests
- 📊 **Analytics**: Error tracking, performance monitoring

Dự án đã hoàn thiện với architecture vững chắc và code quality cao! 🎉
