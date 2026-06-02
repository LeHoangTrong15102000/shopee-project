# 📚 **SHOPEE CLONE - CHƯƠNG 22: QUẢN LÝ USER & TOKEN**

---

## 📋 **MỤC LỤC**

1. [🔐 Xử Lý Lỗi Token Hết Hạn](#-xử-lý-lỗi-token-hết-hạn)
2. [🏗️ Nested Routes cho User Layout](#️-nested-routes-cho-user-layout)
3. [🎨 Code UI User SideNav](#-code-ui-user-sidenav)
4. [📝 Code UI Trang Profile](#-code-ui-trang-profile)
5. [🌐 Khai Báo API cho Profile](#-khai-báo-api-cho-profile)
6. [📊 Hiển Thị Data Profile lên Form](#-hiển-thị-data-profile-lên-form)

---

## 🔐 **Xử Lý Lỗi Token Hết Hạn**

### 🎯 **Mục Tiêu**

Xử lý trường hợp khi `access_token` hết hạn thì tự động logout người dùng ra khỏi ứng dụng.

### 📋 **Phân Tích Vấn Đề**

- Khi `access_token` hết hạn → API trả về lỗi **401**
- Cần xóa `access_token` và `profile` trong localStorage
- Reset state `isAuthenticated` về `false`
- Xóa `profile` khỏi Context API

### ⚠️ **Vấn Đề Với Cách Tiếp Cận Thông Thường**

```javascript
// ❌ Cách không tốt
window.location.reload() // Làm mất tính SPA của React
```

### ✅ **Giải Pháp Tối Ưu: EventTarget**

#### 🔧 **Cách Hoạt Động**

1. Tạo một `EventTarget` để dispatch events
2. Khi `clearLS()` được gọi → dispatch event 'clearLS'
3. Component App lắng nghe event này
4. Reset tất cả state về trạng thái ban đầu

#### 📝 **Implementation**

**1. Setup EventTarget trong localStorage utils:**

```javascript
// utils/auth.ts
const clearLSEvent = new EventTarget()

export const clearLS = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('profile')

  // Dispatch event khi clear localStorage
  clearLSEvent.dispatchEvent(new Event('clearLS'))
}

export { clearLSEvent }
```

**2. Listen Events trong App Component:**

```javascript
// App.tsx
import { clearLSEvent } from 'utils/auth'

function App() {
  const { reset } = useContext(AppContext)

  useEffect(() => {
    const handleClearLS = () => {
      reset() // Reset Context API
    }

    // Lắng nghe event clearLS
    clearLSEvent.addEventListener('clearLS', handleClearLS)

    // Cleanup để tránh memory leak
    return () => {
      clearLSEvent.removeEventListener('clearLS', handleClearLS)
    }
  }, [reset])

  return (
    // JSX của App
  )
}
```

**3. Xử Lý trong HTTP Interceptor:**

```javascript
// utils/http.ts
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearLS() // Tự động dispatch event
    }
    return Promise.reject(error)
  }
)
```

### 🎯 **Lợi Ích**

- ✅ Giữ được tính SPA của React
- ✅ Tách biệt logic xử lý
- ✅ Không có memory leak
- ✅ Xử lý đồng bộ trên toàn app

---

## 🏗️ **Nested Routes cho User Layout**

### 🎯 **Mục Tiêu**

Tạo cấu trúc nested routes cho các trang user để tái sử dụng layout chung.

### 📋 **Phân Tích Cấu Trúc**

```
/user
├── /profile
├── /change-password
└── /history-purchases
```

### ❌ **Cách Cũ (Lặp Code)**

```javascript
// useRouteElements.tsx - Cách không tối ưu
{
  path: path.profile,
  element: (
    <MainLayout>
      <UserLayout>
        <Profile />
      </UserLayout>
    </MainLayout>
  )
},
{
  path: path.changePassword,
  element: (
    <MainLayout>
      <UserLayout>
        <ChangePassword />
      </UserLayout>
    </MainLayout>
  )
}
// ... lặp lại cho từng route
```

### ✅ **Cách Mới (Nested Routes)**

```javascript
// useRouteElements.tsx - Cách tối ưu
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
```

### 🔧 **Cập Nhật UserLayout**

```tsx
// layouts/UserLayout/UserLayout.tsx
import { Outlet } from 'react-router-dom'

export default function UserLayout() {
  return (
    <div className="bg-neutral-100 py-16 text-sm text-gray-600">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Sidebar */}
          <div className="md:col-span-3 lg:col-span-2">
            <UserSideNav />
          </div>

          {/* Main Content */}
          <div className="md:col-span-9 lg:col-span-10">
            <Outlet /> {/* Render các child routes */}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 🎯 **Lợi Ích**

- ✅ Giảm code lặp lại
- ✅ Cấu trúc rõ ràng, dễ hiểu
- ✅ Dễ bảo trì và mở rộng
- ✅ Tận dụng được tính năng của React Router

---

## 🎨 **Code UI User SideNav**

### 🎯 **Mục Tiêu**

Tạo sidebar navigation cho phần user với avatar, tên người dùng và menu điều hướng.

### 🎨 **Component Structure**

```tsx
// components/UserSideNav/UserSideNav.tsx
import { Link } from 'react-router-dom'
import path from 'src/constant/path'
import { useContext } from 'react'
import { AppContext } from 'src/contexts/app.context'

export default function UserSideNav() {
  const { profile } = useContext(AppContext)

  return (
    <div>
      {/* User Info */}
      <div className="flex items-center border-b border-b-gray-200 py-4">
        <Link to={path.profile} className="h-12 w-12 shrink-0 overflow-hidden rounded-full border">
          <img
            src={profile?.avatar || '/src/assets/images/user.svg'}
            alt="avatar"
            className="h-full w-full object-cover"
          />
        </Link>
        <div className="grow pl-4">
          <div className="mb-1 truncate font-semibold text-gray-600">
            {profile?.name || profile?.email}
          </div>
          <Link to={path.profile} className="flex items-center capitalize text-gray-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              {/* Edit icon */}
            </svg>
            <span className="ml-1">Sửa hồ sơ</span>
          </Link>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="mt-7">
        <Link
          to={path.profile}
          className="flex items-center capitalize text-orange transition-colors hover:text-orange"
        >
          <div className="mr-3 h-[22px] w-[22px]">
            <img src="/src/assets/images/user.svg" alt="" className="h-full w-full" />
          </div>
          Tài khoản của tôi
        </Link>

        <Link
          to={path.changePassword}
          className="mt-4 flex items-center capitalize text-gray-600 transition-colors hover:text-orange"
        >
          <div className="mr-3 h-[22px] w-[22px]">{/* Password icon */}</div>
          Đổi mật khẩu
        </Link>

        <Link
          to={path.historyPurchases}
          className="mt-4 flex items-center capitalize text-gray-600 transition-colors hover:text-orange"
        >
          <div className="mr-3 h-[22px] w-[22px]">{/* Order icon */}</div>
          Đơn mua
        </Link>
      </div>
    </div>
  )
}
```

### 🎯 **Tính Năng**

- ✅ Hiển thị avatar người dùng
- ✅ Hiển thị tên/email người dùng
- ✅ Link "Sửa hồ sơ" có icon
- ✅ Menu điều hướng với icons
- ✅ Responsive design
- ✅ Hover effects

---

## 📝 **Code UI Trang Profile**

### 🎯 **Mục Tiêu**

Tạo form chỉnh sửa thông tin cá nhân với layout responsive và upload avatar.

### 🎨 **Layout Structure**

```tsx
// pages/User/pages/Profile/Profile.tsx
export default function Profile() {
  return (
    <div className="rounded-xs bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20">
      <div className="border-b border-b-gray-200 py-6">
        <h1 className="text-lg font-medium capitalize text-gray-900">Hồ Sơ Của Tôi</h1>
        <div className="mt-1 text-sm text-gray-700">
          Quản lý thông tin hồ sơ để bảo mật tài khoản
        </div>
      </div>

      <form className="mt-8 flex flex-col-reverse md:flex-row md:items-start">
        {/* Form Fields */}
        <div className="mt-6 grow md:mt-0 md:pr-12">
          {/* Email Field */}
          <div className="flex flex-col flex-wrap sm:flex-row">
            <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Email</div>
            <div className="sm:w-[80%] sm:pl-5">
              <div className="pt-3 text-gray-700">example@email.com</div>
            </div>
          </div>

          {/* Name Field */}
          <div className="mt-6 flex flex-col flex-wrap sm:flex-row">
            <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Tên</div>
            <div className="sm:w-[80%] sm:pl-5">
              <Input
                classNameInput="w-full rounded-xs border border-gray-300 px-3 py-2 outline-hidden focus:border-gray-500 focus:shadow-xs"
                name="name"
                placeholder="Tên"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="mt-2 flex flex-col flex-wrap sm:flex-row">
            <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Số điện thoại</div>
            <div className="sm:w-[80%] sm:pl-5">
              <Input
                classNameInput="w-full rounded-xs border border-gray-300 px-3 py-2 outline-hidden focus:border-gray-500 focus:shadow-xs"
                name="phone"
                placeholder="Số điện thoại"
              />
            </div>
          </div>

          {/* Address Field */}
          <div className="mt-2 flex flex-col flex-wrap sm:flex-row">
            <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Địa chỉ</div>
            <div className="sm:w-[80%] sm:pl-5">
              <Input
                classNameInput="w-full rounded-xs border border-gray-300 px-3 py-2 outline-hidden focus:border-gray-500 focus:shadow-xs"
                name="address"
                placeholder="Địa chỉ"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="mt-2 flex flex-col flex-wrap sm:flex-row">
            <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Ngày sinh</div>
            <div className="sm:w-[80%] sm:pl-5">
              <DateSelect />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-2 flex flex-col flex-wrap sm:flex-row">
            <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right" />
            <div className="sm:w-[80%] sm:pl-5">
              <Button
                className="flex h-9 items-center rounded-xs bg-orange px-5 text-center text-sm text-white hover:bg-orange/80"
                type="submit"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex justify-center md:w-72 md:border-l md:border-l-gray-200">
          <div className="flex flex-col items-center">
            <div className="my-5 h-24 w-24">
              <img
                src="/src/assets/images/user.svg"
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <InputFile />
            <div className="mt-3 text-gray-400">
              <div>Dung lượng file tối đa 1 MB</div>
              <div>Định dạng:.JPEG, .PNG</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
```

### 📱 **Responsive Features**

- **Desktop**: Avatar bên phải, form bên trái
- **Mobile**: Avatar ở trên, form ở dưới
- **Responsive grid**: Sử dụng Flexbox và Grid

### 🎯 **Form Features**

- ✅ Form validation với React Hook Form
- ✅ Date picker với select options
- ✅ File upload cho avatar
- ✅ Responsive layout
- ✅ Error handling

---

## 🌐 **Khai Báo API cho Profile**

### 🎯 **Mục Tiêu**

Khai báo các API endpoints cho việc quản lý thông tin user và upload avatar.

### 📝 **User Type Updates**

```typescript
// types/user.type.ts
export interface User {
  _id: string
  roles: Role[]
  email: string
  name?: string
  date_of_birth?: string // API trả về string
  avatar?: string // Thêm trường avatar
  address?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

// Body request cho update user
export type UserUpdateBody = Omit<User, '_id' | 'roles' | 'createdAt' | 'updatedAt' | 'email'> & {
  password?: string
  new_password?: string
}
```

### 🌐 **API Declarations**

```typescript
// apis/user.api.ts
import { User, UserUpdateBody } from 'src/types/user.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const userApi = {
  // Get user profile
  getProfile() {
    return http.get<SuccessResponseApi<User>>('me')
  },

  // Update user profile
  updateProfile(body: UserUpdateBody) {
    return http.put<SuccessResponseApi<User>>('user', body)
  },

  // Upload avatar
  uploadAvatar(body: FormData) {
    return http.post<SuccessResponseApi<string>>('user/upload-avatar', body, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export default userApi
```

### 🧪 **API Testing**

```typescript
// Test API endpoints
const testUserApi = async () => {
  try {
    // Test get profile
    const profile = await userApi.getProfile()
    console.log('Profile:', profile.data.data)

    // Test update profile
    const updateData: UserUpdateBody = {
      name: 'John Doe',
      phone: '0123456789',
      address: 'Hà Nội',
    }
    const updateResult = await userApi.updateProfile(updateData)
    console.log('Update result:', updateResult.data.data)

    // Test upload avatar
    const formData = new FormData()
    formData.append('image', file) // file từ input
    const uploadResult = await userApi.uploadAvatar(formData)
    console.log('Upload result:', uploadResult.data.data)
  } catch (error) {
    console.error('API Error:', error)
  }
}
```

### 📋 **API Features**

- ✅ Get user profile
- ✅ Update user information
- ✅ Upload avatar with FormData
- ✅ Proper TypeScript typing
- ✅ Error handling
- ✅ File upload với multipart/form-data

---

## 📊 **Hiển Thị Data Profile lên Form**

### 🎯 **Mục Tiêu**

Fetch data từ API và hiển thị lên form, xử lý form validation và submission.

### 🔧 **Schema Validation**

> ⚠️ **Lưu ý**: Project hiện tại đã migrate sang Zod. Các ví dụ Yup bên dưới chỉ mang tính tham khảo lịch sử. Xem `src/utils/rules.ts` để tham khảo cách sử dụng Zod với baseSchema pattern và .superRefine() cho cross-field validation.

```typescript
// utils/rules.ts (ví dụ cũ với Yup - chỉ tham khảo)
export const userSchema = schema.pick(['name', 'phone', 'address', 'date_of_birth', 'avatar'])

// Thêm validation cho date_of_birth
const userSchemaWithValidation = userSchema.extend({
  date_of_birth: yup.date().max(new Date(), 'Ngày sinh không thể lớn hơn ngày hiện tại'),
  password: schema.fields.password,
  new_password: schema.fields.password,
  confirm_password: handleConfirmPasswordYup('new_password'),
})

export type UserSchema = yup.InferType<typeof userSchemaWithValidation>
```

### 📊 **Form Implementation**

```tsx
// pages/User/pages/Profile/Profile.tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import userApi from 'src/apis/user.api'
import { userSchema, UserSchema } from 'src/utils/rules'

type FormData = Pick<UserSchema, 'name' | 'phone' | 'address' | 'date_of_birth' | 'avatar'>

export default function Profile() {
  // Fetch user profile
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  })

  const profile = profileData?.data.data

  // Form setup
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      avatar: '',
      date_of_birth: new Date(1990, 0, 1),
    },
    resolver: yupResolver(userSchema),
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
  })

  // Set form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      setValue('name', profile.name || '')
      setValue('phone', profile.phone || '')
      setValue('address', profile.address || '')
      setValue('avatar', profile.avatar || '')
      setValue(
        'date_of_birth',
        profile.date_of_birth ? new Date(profile.date_of_birth) : new Date(1990, 0, 1),
      )
    }
  }, [profile, setValue])

  // Form submission
  const onSubmit = handleSubmit(async (data) => {
    try {
      const body = {
        ...data,
        date_of_birth: data.date_of_birth?.toISOString(),
      }

      await updateProfileMutation.mutateAsync(body)
      toast.success('Cập nhật profile thành công')
    } catch (error) {
      toast.error('Cập nhật profile thất bại')
    }
  })

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      <div className="mt-6 flex flex-col flex-wrap sm:flex-row">
        <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Tên</div>
        <div className="sm:w-[80%] sm:pl-5">
          <Input
            classNameInput="w-full rounded-xs border border-gray-300 px-3 py-2 outline-hidden focus:border-gray-500 focus:shadow-xs"
            register={register}
            name="name"
            placeholder="Tên"
            errorMessage={errors.name?.message}
          />
        </div>
      </div>

      {/* Date of Birth với Controller */}
      <div className="mt-2 flex flex-col flex-wrap sm:flex-row">
        <div className="truncate pt-3 capitalize sm:w-[20%] sm:text-right">Ngày sinh</div>
        <div className="sm:w-[80%] sm:pl-5">
          <Controller
            control={control}
            name="date_of_birth"
            render={({ field }) => (
              <DateSelect
                errorMessage={errors.date_of_birth?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        className="flex h-9 items-center rounded-xs bg-orange px-5 text-center text-sm text-white hover:bg-orange/80"
        type="submit"
        isLoading={updateProfileMutation.isPending}
      >
        Lưu
      </Button>
    </form>
  )
}
```

### 🎯 **Key Features**

- ✅ **useQuery** để fetch profile data
- ✅ **useMutation** để update profile
- ✅ **useForm** với defaultValues
- ✅ **Controller** cho date picker
- ✅ **setValue** để sync data với form
- ✅ **Date validation** với yup
- ✅ Error handling và success feedback

### 💡 **Best Practices**

1. **Single Date Field**: Dùng 1 trường `date_of_birth` thay vì 3 select riêng
2. **Controller Usage**: Dùng Controller cho custom components
3. **Date Handling**: Convert sang ISO string khi gửi API
4. **Form Sync**: Sync data từ API với form values
5. **Loading States**: Hiển thị loading khi đang submit

---

## 🎉 **Tổng Kết Chương 22**

### ✅ **Đã Hoàn Thành**

- 🔐 **Token Management**: Xử lý token hết hạn với EventTarget
- 🏗️ **Nested Routes**: Cấu trúc routes tối ưu cho user section
- 🎨 **UI Components**: User sidebar và profile form
- 🌐 **API Integration**: Khai báo và test APIs
- 📊 **Form Handling**: React Hook Form với validation

### 🚀 **Điểm Nổi Bật**

- **EventTarget Pattern**: Giải pháp elegant cho token expiration
- **Nested Routes**: Tái sử dụng layout hiệu quả
- **Type Safety**: TypeScript typing chặt chẽ
- **Form Validation**: Zod schema validation (đã migrate từ Yup)
- **Responsive Design**: Mobile-first approach

### ➡️ **Chương Tiếp Theo**

Chương 23 sẽ tập trung vào **Performance Optimization** và **Advanced Features**:

- Error Boundary implementation
- Lazy loading với React.lazy
- Bundle analysis và optimization
- Refresh token mechanism
- Internationalization (i18n)
