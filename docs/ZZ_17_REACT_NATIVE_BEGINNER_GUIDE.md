# 📱 React Native Nhập Môn Qua Shopee-App

> **Mục tiêu:** giúp người mới ôn lại React Native bằng cách đọc trực tiếp source code thật trong `apps/shopee-app`.
>
> **Dành cho:** người đã biết JavaScript/TypeScript cơ bản, muốn hiểu React Native + Expo + Expo Router qua một app Shopee thực tế.
>
> **Project:** `shopee-project/apps/shopee-app`

---

## 1. Nên hiểu tài liệu này như thế nào?

Tài liệu này không chỉ giải thích React Native theo kiểu lý thuyết. Mỗi phần đều gắn với file thật trong app để bạn vừa học khái niệm, vừa biết nên mở source ở đâu.

Nếu bạn mới quay lại React Native, hãy đọc theo thứ tự này:

```text
1. Hiểu React Native là gì
2. Hiểu Expo là gì
3. Hiểu app chạy từ đâu
4. Hiểu router/screen/tab
5. Hiểu component
6. Hiểu state và hook
7. Hiểu gọi API và cache data
8. Hiểu store toàn app
9. Hiểu style/theme
10. Tự làm bài tập nhỏ trong app
```

Các file nên mở song song khi đọc:

| Mục tiêu                         | File nên mở                                       |
| -------------------------------- | ------------------------------------------------- |
| Biết app dùng công nghệ gì       | `apps/shopee-app/package.json`                    |
| Biết app khởi động từ đâu        | `apps/shopee-app/app/_layout.tsx`                 |
| Biết tab chính hoạt động thế nào | `apps/shopee-app/app/(tabs)/_layout.tsx`          |
| Đọc một màn hình thật            | `apps/shopee-app/app/(tabs)/home.tsx`             |
| Đọc một component thật           | `apps/shopee-app/components/home/ProductCard.tsx` |
| Đọc hook gọi API                 | `apps/shopee-app/hooks/useProducts.ts`            |
| Đọc store đăng nhập              | `apps/shopee-app/store/authStore.ts`              |
| Đọc cấu hình style               | `apps/shopee-app/tailwind.config.js`              |

---

## 2. React Native là gì?

React Native là cách viết app mobile bằng React.

Nếu React web render ra HTML như `div`, `span`, `button`, thì React Native render ra native UI của Android/iOS thông qua các component như:

| React Web   | React Native                                            |
| ----------- | ------------------------------------------------------- |
| `div`       | `View`                                                  |
| `span`, `p` | `Text`                                                  |
| `img`       | `Image`                                                 |
| `button`    | `Pressable`, `TouchableOpacity`                         |
| CSS file    | `StyleSheet`, inline style, hoặc NativeWind `className` |
| Browser DOM | Native UI của Android/iOS                               |

Ví dụ trong app này, màn hình home dùng các primitive của React Native:

```tsx
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
```

Ý nghĩa:

- `View`: khối layout, gần giống `div`.
- `FlatList`: danh sách tối ưu cho mobile, dùng để render nhiều item.
- `ActivityIndicator`: vòng loading.
- `RefreshControl`: kéo xuống để refresh.

Điểm quan trọng nhất: **bạn vẫn viết React**, nhưng UI cuối cùng là native mobile, không phải HTML.

---

## 3. Expo là gì?

Expo là bộ công cụ giúp làm React Native dễ hơn:

- Chạy app nhanh bằng Metro bundler.
- Mở bằng Expo Go khi chưa cần build native app riêng.
- Có sẵn nhiều package cho mobile như linking, status bar, localization.
- Hỗ trợ Expo Router để tạo route theo file.

Trong `apps/shopee-app/package.json`, app này dùng:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "android": "expo run:android",
    "ios": "expo run:ios",
    "start": "expo start",
    "web": "expo start --web"
  }
}
```

Nghĩa là:

- `main: "expo-router/entry"`: app khởi động qua Expo Router.
- `pnpm start`: mở Expo dev server.
- `pnpm android`: build/chạy app Android native.
- `pnpm ios`: build/chạy app iOS native.
- `pnpm web`: chạy thử giao diện trên web.

Nếu bạn chỉ muốn test nhanh UI, đọc thêm file:

```text
docs/ZZ_10_SHOPEE_APP_DEVELOPMENT_GUIDE.md
```

File đó hướng dẫn chạy app, emulator, device, debug và build APK/IPA. File hiện tại tập trung vào **học React Native căn bản qua source**.

---

## 4. Cấu trúc quan trọng của shopee-app

Nhìn đơn giản, app này có các lớp chính như sau:

```text
apps/shopee-app
├── app/                 # Route/screen theo Expo Router
│   ├── _layout.tsx      # Root layout: provider, auth gate, stack route
│   ├── (auth)/          # Nhóm màn hình đăng nhập/đăng ký
│   ├── (tabs)/          # Nhóm màn hình tab chính
│   ├── product/[id]/    # Route động chi tiết sản phẩm
│   └── ...
├── components/          # Component tái sử dụng
├── hooks/               # Custom hooks: gọi API, logic dùng lại
├── store/               # Zustand stores: auth, app, chat...
├── apis/                # Hàm gọi backend API
├── types/               # TypeScript type/interface
├── utils/               # Hàm tiện ích
├── config/              # Theme, queryClient, global css...
└── providers/           # Provider cấp global behavior
```

Cách đọc dễ nhất:

```text
app/_layout.tsx
  ↓
app/(tabs)/_layout.tsx
  ↓
app/(tabs)/home.tsx
  ↓
components/home/ProductCard.tsx
  ↓
hooks/useProducts.ts
  ↓
apis/product.api.ts
```

Nói ngắn gọn:

- `app/` trả lời câu hỏi: **màn hình nào tồn tại và URL/route là gì?**
- `components/` trả lời: **UI được chia nhỏ thế nào?**
- `hooks/` trả lời: **logic lấy data/tái sử dụng nằm ở đâu?**
- `store/` trả lời: **state toàn app nằm ở đâu?**
- `apis/` trả lời: **app gọi backend bằng hàm nào?**

---

## 5. App bắt đầu từ đâu?

File quan trọng nhất để hiểu app là:

```text
apps/shopee-app/app/_layout.tsx
```

Đây là root layout của Expo Router. Nó làm nhiều việc nền tảng trước khi user thấy màn hình thật.

### 5.1. Root providers

Trong `RootLayout`, app bọc các provider global:

```tsx
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <StripeProvider>
          <AppContent />
        </StripeProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
```

Hiểu đơn giản:

- `QueryClientProvider`: cho React Query hoạt động toàn app.
- `ToastProvider`: cho phép hiện toast/thông báo nhanh.
- `StripeProvider`: cấu hình thanh toán Stripe.
- `AppContent`: phần app thật, nơi có route, theme, auth gate.

### 5.2. Native/mobile providers

Bên trong `AppContent`, app còn có:

```tsx
<GestureHandlerRootView>
  <SafeAreaProvider>
    <BottomSheetModalProvider>
      <DialogProvider>
        <ThemeProvider value={navigationTheme}>
          <Stack>...</Stack>
        </ThemeProvider>
      </DialogProvider>
    </BottomSheetModalProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

Ý nghĩa:

- `GestureHandlerRootView`: hỗ trợ gesture như kéo, swipe, bottom sheet.
- `SafeAreaProvider`: tránh tai thỏ/notch/status bar.
- `BottomSheetModalProvider`: hỗ trợ modal kéo từ dưới lên.
- `DialogProvider`: dialog dùng chung.
- `ThemeProvider`: đưa theme vào navigation.
- `Stack`: khai báo các màn hình stack.

Đây là pattern rất phổ biến trong React Native: **root layout là nơi gắn provider toàn app**.

---

## 6. Expo Router hoạt động thế nào?

Expo Router dùng file system để tạo route. Nghĩa là tên file/thư mục trong `app/` quyết định đường đi màn hình.

Ví dụ:

| File/thư mục           | Ý nghĩa                                 |
| ---------------------- | --------------------------------------- |
| `app/_layout.tsx`      | Layout gốc của toàn app                 |
| `app/(tabs)/home.tsx`  | Màn hình home trong tab group           |
| `app/product/[id]/...` | Màn hình chi tiết sản phẩm theo id động |
| `app/search.tsx`       | Màn hình search                         |
| `app/checkout.tsx`     | Màn hình checkout                       |

### 6.1. Route group `(tabs)` và `(auth)`

Dấu ngoặc trong Expo Router như `(tabs)` hoặc `(auth)` là **route group**.

Nó giúp gom file cho dễ quản lý nhưng không nhất thiết làm group đó xuất hiện trong URL.

Trong app này:

- `(auth)`: nhóm màn hình đăng nhập/đăng ký.
- `(tabs)`: nhóm màn hình chính sau khi đăng nhập.

### 6.2. Auth gate

Trong `app/_layout.tsx`, app kiểm tra user đã đăng nhập chưa:

```tsx
const inAuthGroup = segments[0] === '(auth)'

if (!isAuthenticated && !inAuthGroup) {
  router.replace('/(auth)/sign-in')
} else if (isAuthenticated && inAuthGroup) {
  router.replace('/(tabs)/home')
}
```

Hiểu đơn giản:

- Chưa đăng nhập mà vào màn hình chính → đá về sign-in.
- Đã đăng nhập mà còn ở auth screen → chuyển về home.

Đây là một trong những pattern quan trọng nhất khi đọc app mobile có login.

---

## 7. Tab navigation trong app

File:

```text
apps/shopee-app/app/(tabs)/_layout.tsx
```

File này khai báo các tab chính:

```tsx
<Tabs
  tabBar={(props) => <CustomTabBar {...props} />}
  screenOptions={{
    headerShown: false,
  }}
>
  <Tabs.Screen name="home" />
  <Tabs.Screen name="cart" />
  <Tabs.Screen name="live" />
  <Tabs.Screen name="notifications" />
  <Tabs.Screen name="account" />
</Tabs>
```

Nghĩa là app có các tab chính:

- Home
- Cart
- Live
- Notifications
- Account

Điểm đáng chú ý:

```tsx
tabBar={(props) => <CustomTabBar {...props} />}
```

App không dùng tab bar mặc định, mà dùng component riêng:

```text
apps/shopee-app/components/navigation/CustomTabBar.tsx
```

Khi học React Native, bạn nên hiểu rằng navigation thường gồm 2 lớp:

```text
Stack navigation: chuyển giữa các màn hình lớn
Tab navigation: chuyển giữa các tab chính
```

Trong app này:

```text
app/_layout.tsx          → Stack
app/(tabs)/_layout.tsx   → Tabs
```

---

## 8. Đọc một screen thật: HomeScreen

File:

```text
apps/shopee-app/app/(tabs)/home.tsx
```

Đây là màn hình rất tốt để học vì nó có gần đủ thứ cơ bản:

- State chọn category.
- Hook lấy sản phẩm.
- Hook lấy category.
- Loading skeleton.
- Error state.
- Empty state.
- Pull-to-refresh.
- Infinite scroll.
- Render grid sản phẩm 2 cột.

### 8.1. Import cho biết screen cần gì

```tsx
import React, { useCallback, useMemo, useState } from 'react'
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ShoppingBag } from 'lucide-react-native'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { InlineError, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
```

Khi đọc một screen, hãy nhìn import trước:

- Import từ `react`: screen dùng hook nào?
- Import từ `react-native`: screen dùng primitive UI nào?
- Import từ `hooks`: screen lấy data/logic từ đâu?
- Import từ `components`: screen ghép UI nào?
- Import từ `types`: data có shape gì?

### 8.2. State cục bộ

```tsx
const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
```

Đây là state chỉ thuộc màn hình home.

Khi user chọn category, `selectedCategory` đổi. Khi state đổi, component render lại, hook `useProducts(selectedCategory)` cũng chạy theo category mới.

### 8.3. Data từ custom hook

```tsx
const {
  data: productsData,
  isLoading: productsLoading,
  isError: productsError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch: refetchProducts,
} = useProducts(selectedCategory)
```

Screen không tự gọi API trực tiếp. Nó gọi custom hook `useProducts`.

Đây là cách tách trách nhiệm tốt:

```text
home.tsx
  chỉ lo hiển thị UI và phản ứng với user

hooks/useProducts.ts
  lo gọi API, cache, phân trang
```

### 8.4. Pull-to-refresh

```tsx
const onRefresh = useCallback(async () => {
  setRefreshing(true)
  await Promise.all([refetchProducts(), refetchCategories()])
  setRefreshing(false)
}, [refetchProducts, refetchCategories])
```

Khi user kéo xuống refresh:

```text
setRefreshing(true)
  ↓
gọi lại products + categories
  ↓
setRefreshing(false)
```

Trong React Native, pull-to-refresh thường đi cùng `RefreshControl`:

```tsx
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
```

### 8.5. Infinite scroll

```tsx
const handleLoadMore = useCallback(() => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
```

Logic rất dễ hiểu:

```text
Nếu còn trang tiếp theo
và hiện tại không đang fetch trang tiếp theo
thì fetch thêm
```

`FlatList` gọi hàm này khi scroll gần cuối:

```tsx
onEndReached={handleLoadMore}
onEndReachedThreshold={0.5}
```

### 8.6. FlatList render grid 2 cột

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={(item) => item._id}
  numColumns={2}
  columnWrapperStyle={{ gap: CARD_GAP }}
  ListHeaderComponent={ListHeader}
  ListFooterComponent={ListFooter}
/>
```

Ý nghĩa:

- `data`: mảng sản phẩm.
- `renderItem`: mỗi item render thế nào.
- `keyExtractor`: key unique cho từng item.
- `numColumns={2}`: grid 2 cột.
- `ListHeaderComponent`: phần đầu list như banner, flash sale, category.
- `ListFooterComponent`: phần cuối list như loading thêm.

Với mobile app, danh sách dài nên ưu tiên `FlatList`, không nên map trực tiếp quá nhiều item trong `ScrollView`.

---

## 9. Đọc một component thật: ProductCard

File:

```text
apps/shopee-app/components/home/ProductCard.tsx
```

Component là khối UI có thể tái sử dụng.

Trong app này, `HomeScreen` không tự viết toàn bộ UI của sản phẩm. Nó gọi:

```tsx
<ProductCard product={item} />
```

### 9.1. Props là gì?

Trong `ProductCard`, app định nghĩa shape của product:

```tsx
export interface ProductCardProduct {
  _id: string
  name: string
  image: string
  price: number
  price_before_discount: number
  rating: number
  sold: number
}

interface ProductCardProps {
  product: ProductCardProduct
}
```

Hiểu đơn giản:

```text
ProductCard cần 1 prop tên product.
Product đó phải có _id, name, image, price, rating...
```

TypeScript giúp bạn không truyền sai data vào component.

### 9.2. Component nhận props

```tsx
export function ProductCard({ product }: ProductCardProps) {
  ...
}
```

Dòng này nghĩa là:

```text
Component ProductCard nhận object props,
lấy field product ra dùng.
```

### 9.3. Bấm card để chuyển màn hình

```tsx
const router = useRouter()

<TouchableOpacity
  onPress={() => router.push(`/product/${product._id}`)}
>
```

Khi user bấm sản phẩm:

```text
ProductCard
  ↓
router.push('/product/<id>')
  ↓
Mở màn hình chi tiết sản phẩm
```

Đây là navigation bằng code.

### 9.4. Accessibility

```tsx
accessibilityRole="button"
accessibilityLabel={t('a11y.viewProduct', { name: product.name })}
```

Ý nghĩa:

- Screen reader biết card này là button.
- Người dùng dùng trợ năng nghe được nội dung như “xem sản phẩm ...”.

Khi học React Native nghiêm túc, đừng bỏ qua accessibility. Mobile app tốt không chỉ đẹp, mà còn dùng được với nhiều nhóm người dùng.

---

## 10. Hook là gì?

Hook là hàm giúp dùng state, lifecycle, data fetching, hoặc logic tái sử dụng trong React.

React có hook built-in:

| Hook          | Dùng để làm gì              |
| ------------- | --------------------------- |
| `useState`    | Lưu state trong component   |
| `useEffect`   | Chạy side effect sau render |
| `useMemo`     | Ghi nhớ giá trị tính toán   |
| `useCallback` | Ghi nhớ function            |

App còn có custom hook:

| Hook            | Ý nghĩa                |
| --------------- | ---------------------- |
| `useProducts`   | Lấy danh sách sản phẩm |
| `useCategories` | Lấy danh mục           |
| `useColors`     | Lấy màu theo theme     |
| `useAuthStore`  | Dùng auth state        |
| `useAppStore`   | Dùng app/theme state   |

### 10.1. Custom hook `useProducts`

File:

```text
apps/shopee-app/hooks/useProducts.ts
```

Nội dung chính:

```tsx
export function useProducts(category?: string) {
  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: ({ pageParam }) =>
      getProducts({ page: pageParam, limit: PRODUCTS_PER_PAGE, category }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination
      return page < total_pages ? page + 1 : undefined
    },
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products) as Product[],
    }),
  })
}
```

Hiểu từng phần:

- `queryKey: ['products', category]`: cache riêng theo category.
- `queryFn`: hàm thật sự gọi API.
- `initialPageParam: 1`: bắt đầu từ page 1.
- `getNextPageParam`: tính page tiếp theo.
- `select`: gom nhiều page thành một mảng `products`.

Luồng dữ liệu:

```text
HomeScreen
  ↓ useProducts(selectedCategory)
useProducts
  ↓ getProducts(...)
Backend API
  ↓ response
React Query cache
  ↓
HomeScreen render FlatList
```

Điểm cần nhớ: screen càng ít biết về API càng tốt. Screen chỉ dùng data đã được hook chuẩn bị.

---

## 11. State toàn app với Zustand

Có 2 loại state thường gặp:

| Loại state     | Ví dụ                               | Nên để đâu              |
| -------------- | ----------------------------------- | ----------------------- |
| State cục bộ   | selected category, refreshing       | `useState` trong screen |
| State toàn app | user, token, theme, chat connection | store như Zustand       |

File auth store:

```text
apps/shopee-app/store/authStore.ts
```

### 11.1. Auth state gồm gì?

```tsx
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean

  login: (data: { accessToken: string; refreshToken: string; user: User }) => void
  logout: () => void
  setAccessToken: (token: string) => void
}
```

Nó lưu:

- `accessToken`: token gọi API.
- `refreshToken`: token làm mới phiên.
- `user`: thông tin user.
- `isAuthenticated`: user đã đăng nhập chưa.
- `login/logout/setAccessToken`: action cập nhật state.

### 11.2. Persist state

Store dùng middleware `persist`:

```tsx
persist(
  (set) => ({ ... }),
  {
    name: 'auth-storage',
    version: 1,
    storage: createJSONStorage(() => mmkvStorage),
    partialize: (state) => ({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    }),
  }
)
```

Hiểu đơn giản:

```text
Khi app đóng/mở lại,
token và user vẫn được lưu trong MMKV.
```

`partialize` nghĩa là chỉ lưu một phần state. Ở đây app lưu token/user, không lưu mọi thứ.

### 11.3. Rehydration là gì?

Khi mở app, persisted state cần được nạp lại từ storage. Quá trình đó gọi là rehydration.

Trong `app/_layout.tsx`, app đợi auth store hydrate xong rồi mới redirect:

```tsx
const [isReady, setIsReady] = useState(false)

useEffect(() => {
  const unsub = useAuthStore.persist.onFinishHydration(() => {
    setIsReady(true)
  })
  if (useAuthStore.persist.hasHydrated()) {
    setIsReady(true)
  }
  return unsub
}, [])
```

Nếu không đợi hydrate, app có thể tưởng user chưa đăng nhập trong vài mili giây đầu và redirect sai.

Đây là chi tiết rất quan trọng trong app mobile có auth persistence.

---

## 12. Styling trong app

React Native gốc thường style bằng object:

```tsx
<View style={{ flex: 1, backgroundColor: colors.background }} />
```

App này cũng dùng NativeWind, tức Tailwind-style className cho React Native:

```tsx
<View className="flex-1 bg-background" />
```

File cấu hình:

```text
apps/shopee-app/tailwind.config.js
```

Điểm quan trọng:

```js
export const darkMode = 'class'
export const content = ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}']
export const presets = [require('nativewind/preset')]
```

Ý nghĩa:

- `darkMode = 'class'`: dark mode bật qua class `dark`.
- `content`: NativeWind scan class trong `app/` và `components/`.
- `presets`: dùng preset của NativeWind.

Trong root layout:

```tsx
<View style={{ flex: 1 }} className={theme === 'dark' ? 'dark' : ''}>
```

Nếu theme là dark, root view có class `dark`, từ đó các class dark mode hoạt động.

---

## 13. Theme và màu sắc

File root layout lấy theme từ store:

```tsx
const theme = useAppStore((state) => state.theme)
const colors = useColors()
```

Sau đó tạo navigation theme:

```tsx
const navigationTheme = {
  ...(theme === 'dark' ? DarkTheme : DefaultTheme),
  dark: theme === 'dark',
  colors: {
    ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
    primary: colors.primary,
    background: colors.background,
    card: colors.neutrals800,
    text: colors.foreground,
    border: colors.neutrals700,
    notification: colors.primary,
  },
}
```

Hiểu đơn giản:

```text
App có theme riêng.
React Navigation cũng cần biết theme đó.
Nên app convert màu nội bộ sang navigationTheme.
```

Khi đọc UI component, nếu thấy:

```tsx
const colors = useColors()
```

thì component đó đang lấy màu theo theme hiện tại.

---

## 14. Loading, error, empty state

Một màn hình mobile tốt không chỉ có trạng thái thành công. Nó cần ít nhất 4 trạng thái:

```text
Loading → Error → Empty → Success
```

Trong `home.tsx`:

### 14.1. Loading

```tsx
{
  productsLoading ? <BannerSkeleton /> : <BannerCarousel />
}
```

Khi đang tải, app không để trống màn hình mà dùng skeleton.

### 14.2. Error

```tsx
{
  productsError && !productsLoading && (
    <InlineError message={t('ERROR_LOAD_PRODUCTS')} onRetry={() => refetchProducts()} />
  )
}
```

Khi lỗi, user thấy thông báo và có nút retry.

### 14.3. Empty

```tsx
{
  !productsLoading && !productsError && products.length === 0 && (
    <EmptyState
      icon={ShoppingBag}
      message={t('EMPTY_PRODUCTS')}
      actionLabel={t('EMPTY_PRODUCTS_CTA')}
      onAction={() => setSelectedCategory(undefined)}
    />
  )
}
```

Khi không có sản phẩm, app không im lặng. Nó cho user hành động để reset category.

Đây là tư duy nên có khi viết mobile app: **mọi trạng thái đều cần UI rõ ràng**.

---

## 15. i18n trong app

App dùng `react-i18next`.

Trong component:

```tsx
const { t } = useTranslation()
```

Sau đó dùng:

```tsx
message={t('ERROR_LOAD_PRODUCTS')}
```

Nghĩa là text không hard-code trực tiếp trong component. Component dùng key, file ngôn ngữ quyết định text tiếng Việt/tiếng Anh.

Lợi ích:

- Đổi ngôn ngữ dễ hơn.
- UI component sạch hơn.
- Dễ kiểm soát copy toàn app.

Khi đọc source, nếu thấy `t('SOME_KEY')`, hãy hiểu đó là text dịch từ i18n.

---

## 16. Deep link là gì?

Deep link là link mở thẳng vào app hoặc một màn hình trong app.

Trong `app/_layout.tsx`, app xử lý payment return:

```tsx
function handleUrl(event: { url: string }) {
  const parsed = Linking.parse(event.url)
  const host = parsed.hostname ?? ''

  if (host === 'payment-return') {
    const sessionId = parsed.queryParams?.sessionId as string | undefined
    if (sessionId) {
      router.push({ pathname: '/payment-status', params: { sessionId } })
    }
  }
}
```

Luồng đơn giản:

```text
Ví điện tử/Stripe mở lại app
  ↓
shopeeapp://payment-return?sessionId=xxx
  ↓
Linking.parse(...)
  ↓
router.push('/payment-status')
```

Đây là phần nâng cao hơn, nhưng nên biết vì mobile app thường phải xử lý:

- Payment return.
- Email verification.
- Password reset.
- App link từ notification.

---

## 17. WebSocket/chat connection

Trong root layout:

```tsx
useEffect(() => {
  if (isAuthenticated) {
    connectChat()
  } else {
    disconnectChat()
  }
}, [isAuthenticated])
```

Hiểu đơn giản:

```text
Đăng nhập → mở kết nối chat
Đăng xuất → đóng kết nối chat
```

Đây là ví dụ của side effect phụ thuộc auth state. Nó không nằm trong màn hình chat riêng, vì kết nối chat là hành vi cấp app.

---

## 18. TypeScript trong React Native

App dùng TypeScript nên file thường là:

| Đuôi file | Ý nghĩa                 |
| --------- | ----------------------- |
| `.ts`     | Logic không chứa JSX    |
| `.tsx`    | Component/screen có JSX |

Ví dụ:

- `hooks/useProducts.ts`: hook logic, không render UI.
- `app/(tabs)/home.tsx`: screen render UI.
- `components/home/ProductCard.tsx`: component render UI.

Khi học, hãy tập đọc type/interface trước. Type cho bạn biết data cần hình dạng gì.

Ví dụ:

```tsx
interface ProductCardProps {
  product: ProductCardProduct
}
```

Chỉ cần đọc dòng này, bạn biết component cần prop `product`.

---

## 19. Cách đọc một file React Native bất kỳ

Khi mở một file `.tsx`, hãy đọc theo checklist này:

### Bước 1: Nhìn import

Tự hỏi:

- File này là screen hay component?
- Nó dùng hook nào?
- Nó lấy data từ đâu?
- Nó dùng component con nào?
- Nó có navigation không?

### Bước 2: Nhìn type/interface

Tự hỏi:

- Component cần props gì?
- Data có field nào?
- Có optional field không?

### Bước 3: Nhìn state/hook

Tự hỏi:

- State cục bộ là gì?
- Hook nào gọi API?
- Hook nào lấy store?
- Có `useEffect` gây side effect không?

### Bước 4: Nhìn handler

Tự hỏi:

- User bấm vào đâu?
- On press làm gì?
- Có navigate không?
- Có gọi API/refetch không?

### Bước 5: Nhìn return JSX

Tự hỏi:

- Layout chính là gì?
- Loading/error/empty/success xử lý thế nào?
- Component con nhận prop gì?

### Bước 6: Nhìn style

Tự hỏi:

- Dùng `className` hay `style`?
- Màu lấy từ theme hay hard-code?
- Có responsive theo width không?

---

## 20. Mapping khái niệm React Native với file thật

| Khái niệm      | File ví dụ                        | Nên chú ý                          |
| -------------- | --------------------------------- | ---------------------------------- |
| Root app       | `app/_layout.tsx`                 | Provider, auth gate, stack route   |
| Tab navigation | `app/(tabs)/_layout.tsx`          | `Tabs.Screen`, custom tab bar      |
| Screen         | `app/(tabs)/home.tsx`             | State, hooks, FlatList, UI states  |
| Component      | `components/home/ProductCard.tsx` | Props, layout, navigation          |
| Data hook      | `hooks/useProducts.ts`            | React Query, pagination, cache key |
| Global store   | `store/authStore.ts`              | Zustand, persist, MMKV             |
| Styling        | `tailwind.config.js`              | NativeWind, dark mode, colors      |
| Theme          | `hooks/useColors.ts`              | Màu theo light/dark theme          |
| i18n           | component dùng `useTranslation`   | Text qua key dịch                  |
| Deep link      | `app/_layout.tsx`                 | `expo-linking`, payment return     |

---

## 21. Những lỗi người mới hay gặp

### 21.1. Nghĩ React Native giống hoàn toàn React web

React Native dùng React, nhưng không có DOM. Không dùng `div`, `span`, `button`.

Dùng:

```tsx
<View />
<AppText />
<TouchableOpacity />
```

### 21.2. Dùng `ScrollView` cho danh sách dài

Với danh sách sản phẩm, nên dùng `FlatList` vì nó tối ưu render item.

App home đang làm đúng:

```tsx
<FlatList data={products} renderItem={renderProduct} />
```

### 21.3. Gọi API trực tiếp trong component quá nhiều

Nên tách sang custom hook như:

```text
hooks/useProducts.ts
hooks/useCategories.ts
```

Screen chỉ nhận data và render.

### 21.4. Quên xử lý loading/error/empty

Một screen chỉ render success state là chưa đủ. Hãy kiểm tra đủ:

```text
loading
error
empty
success
refreshing
fetching next page
```

### 21.5. Redirect quá sớm trước khi store hydrate

Auth store có persist. Phải đợi hydrate xong rồi mới quyết định redirect.

App đã xử lý bằng `isReady` trong `app/_layout.tsx`.

---

## 22. Lộ trình học qua shopee-app

### Ngày 1: Nắm app chạy từ đâu

Đọc:

```text
apps/shopee-app/package.json
apps/shopee-app/app/_layout.tsx
```

Bạn cần trả lời được:

- App dùng Expo Router như thế nào?
- Provider nào bọc toàn app?
- Khi chưa login app redirect ra sao?

### Ngày 2: Nắm route và tab

Đọc:

```text
apps/shopee-app/app/(tabs)/_layout.tsx
apps/shopee-app/components/navigation/CustomTabBar.tsx
```

Bạn cần trả lời được:

- Có những tab nào?
- Tab bar mặc định hay custom?
- `headerShown: false` có ý nghĩa gì?

### Ngày 3: Nắm screen home

Đọc:

```text
apps/shopee-app/app/(tabs)/home.tsx
```

Bạn cần trả lời được:

- Home lấy products/categories từ đâu?
- Pull-to-refresh chạy thế nào?
- Infinite scroll chạy thế nào?
- Loading/error/empty state nằm ở đâu?

### Ngày 4: Nắm component

Đọc:

```text
apps/shopee-app/components/home/ProductCard.tsx
```

Bạn cần trả lời được:

- ProductCard cần props gì?
- Khi bấm card thì route nào mở ra?
- Width card được tính thế nào?
- Accessibility được khai báo ra sao?

### Ngày 5: Nắm data fetching

Đọc:

```text
apps/shopee-app/hooks/useProducts.ts
apps/shopee-app/apis/product.api.ts
```

Bạn cần trả lời được:

- React Query cache theo key nào?
- Page tiếp theo được tính thế nào?
- API response được flatten ra sao?

### Ngày 6: Nắm auth store

Đọc:

```text
apps/shopee-app/store/authStore.ts
apps/shopee-app/store/mmkvStorage.ts
```

Bạn cần trả lời được:

- Token lưu ở đâu?
- Khi login/logout state đổi thế nào?
- Vì sao cần rehydration?

### Ngày 7: Nắm style/theme

Đọc:

```text
apps/shopee-app/tailwind.config.js
apps/shopee-app/config/colors.ts
apps/shopee-app/hooks/useColors.ts
```

Bạn cần trả lời được:

- NativeWind scan file nào?
- Dark mode bật bằng gì?
- Component lấy màu theme bằng hook nào?

---

## 23. Bài tập nhỏ để ôn React Native

> Nên làm trên branch riêng hoặc chỉ đọc/thử local nếu chưa muốn commit.

### Bài 1: Đọc HomeScreen và vẽ flow

Vẽ lại bằng lời:

```text
HomeScreen render
  ↓
useProducts + useCategories
  ↓
loading/error/empty/success
  ↓
FlatList render ProductCard
```

Mục tiêu: hiểu flow trước khi sửa code.

### Bài 2: Thêm một text nhỏ vào ProductCard

Ví dụ: hiển thị thêm rating label hoặc sold label theo format khác.

Mục tiêu:

- Hiểu props.
- Hiểu JSX.
- Hiểu style bằng `className`.

### Bài 3: Đổi empty state của HomeScreen

Thử đổi message hoặc action khi không có sản phẩm.

Mục tiêu:

- Hiểu conditional rendering.
- Hiểu `EmptyState`.
- Hiểu i18n key.

### Bài 4: Trace từ card sang product detail

Từ dòng:

```tsx
router.push(`/product/${product._id}`)
```

Hãy tìm file route product detail tương ứng trong `app/product/[id]/`.

Mục tiêu:

- Hiểu dynamic route `[id]`.
- Hiểu navigation bằng Expo Router.

### Bài 5: Trace auth redirect

Đọc `authStore.ts`, rồi đọc `app/_layout.tsx`.

Trả lời:

```text
Nếu accessToken tồn tại sau khi hydrate thì app làm gì?
Nếu logout thì app làm gì?
```

Mục tiêu: hiểu global state + route protection.

---

## 24. Công thức đọc source không bị ngợp

Khi thấy một màn hình lớn, đừng đọc từ trên xuống như đọc truyện. Hãy đọc theo lớp:

```text
Lớp 1: File này là route/screen/component/hook/store?
Lớp 2: Input của nó là gì?
Lớp 3: State của nó là gì?
Lớp 4: Data lấy từ đâu?
Lớp 5: User tương tác ở đâu?
Lớp 6: Nó render UI gì?
Lớp 7: Nó gọi component/hook nào tiếp theo?
```

Ví dụ với `home.tsx`:

```text
Lớp 1: Đây là screen tab home
Lớp 2: Không nhận props trực tiếp
Lớp 3: selectedCategory, refreshing
Lớp 4: useProducts, useCategories
Lớp 5: chọn category, pull refresh, scroll cuối list
Lớp 6: SearchHeader, Banner, FlashSale, RecentlyViewed, CategoryBar, ProductCard
Lớp 7: ProductCard dẫn sang product detail
```

Cách này giúp bạn không bị chìm trong JSX.

---

## 25. Tóm tắt nhanh

Nếu chỉ nhớ vài ý, hãy nhớ:

- React Native là React cho mobile native, không phải HTML DOM.
- Expo giúp chạy/build/debug React Native dễ hơn.
- Expo Router biến file trong `app/` thành route.
- `_layout.tsx` là nơi khai báo layout/provider/navigation chung.
- Screen nên tập trung render UI và xử lý tương tác.
- Logic gọi API nên nằm trong custom hook.
- State toàn app nên nằm trong store như Zustand.
- Danh sách dài nên dùng `FlatList`.
- UI tốt cần đủ loading/error/empty/success state.
- App này dùng NativeWind để style bằng `className` kiểu Tailwind.

Đường đọc tốt nhất cho người mới:

```text
package.json
  → app/_layout.tsx
  → app/(tabs)/_layout.tsx
  → app/(tabs)/home.tsx
  → components/home/ProductCard.tsx
  → hooks/useProducts.ts
  → store/authStore.ts
  → tailwind.config.js
```

Khi bạn đọc hết các file trên và giải thích lại được bằng lời của mình, bạn đã nắm được phần lõi của React Native trong app này.
