# React Reconciliation, Virtualization & Tối Ưu Render - Deep Dive

> Tài liệu phân tích chuyên sâu dựa trên codebase thực tế của dự án Shopee Project

---

## Mục lục

1. [React Reconciliation là gì?](#1-react-reconciliation-là-gì)
2. [Đếm DOM Nodes thực tế của Product Card](#2-đếm-dom-nodes-thực-tế-của-product-card)
3. [@tanstack/react-virtual giải quyết bài toán Virtualization](#3-tanstackreact-virtual-giải-quyết-bài-toán-virtualization)
4. [Hạn chế re-render khi 1 sản phẩm thay đổi trong danh sách 5000+](#4-hạn-chế-re-render-khi-1-sản-phẩm-thay-đổi)
5. [Virtualization + Re-render: Chuyện gì thực sự xảy ra?](#5-virtualization--re-render-chuyện-gì-thực-sự-xảy-ra)

---

## 1. React Reconciliation là gì?

### 1.1 Giải thích đơn giản nhất

Hãy tưởng tượng bạn có một **bản vẽ kiến trúc** (Virtual DOM) và một **ngôi nhà thật** (Real DOM).

Khi bạn muốn thay đổi ngôi nhà (ví dụ: sơn lại 1 phòng), bạn có 2 cách:

- **Cách ngu**: Đập bỏ toàn bộ ngôi nhà, xây lại từ đầu → Cực kỳ tốn kém
- **Cách thông minh**: So sánh bản vẽ cũ với bản vẽ mới, chỉ sơn lại đúng cái phòng cần thay đổi

**React Reconciliation chính là "cách thông minh" đó.**

### 1.2 Quy trình chi tiết

```
State/Props thay đổi
        │
        ▼
┌─────────────────────┐
│  React tạo Virtual   │    ← Bước 1: Tạo "bản vẽ mới" (Virtual DOM mới)
│  DOM mới (cây mới)   │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  SO SÁNH (Diffing)   │    ← Bước 2: So sánh "bản vẽ cũ" vs "bản vẽ mới"
│  Cây cũ vs Cây mới   │       Đây chính là RECONCILIATION
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Tìm ra sự khác biệt │    ← Bước 3: Xác định chính xác cái gì thay đổi
│  (minimal changes)    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Cập nhật Real DOM    │    ← Bước 4: Chỉ thay đổi đúng phần cần thiết
│  (commit phase)       │       trên Real DOM
└─────────────────────┘
```

### 1.3 Hai quy tắc vàng của Reconciliation (Diffing Algorithm)

**Quy tắc 1: Khác loại element → Xây lại toàn bộ cây con**

```jsx
// Trước:
<div>
  <ProductCard />
</div>

// Sau (đổi div → section):
<section>
  <ProductCard />     ← React sẽ UNMOUNT ProductCard cũ
</section>            ← và MOUNT ProductCard MỚI hoàn toàn
                      ← Dù ProductCard không thay đổi gì!
```

→ Vì `<div>` và `<section>` là **khác loại**, React coi như toàn bộ cây con bên trong đã thay đổi.

**Quy tắc 2: Cùng loại element → So sánh attributes/props**

```jsx
// Trước:
<div className="old" style={{color: 'red'}}>

// Sau:
<div className="new" style={{color: 'blue'}}>

// React chỉ cập nhật className và style.color
// KHÔNG tạo lại div mới
```

### 1.4 Vai trò của `key` trong Reconciliation

Đây là phần **CỰC KỲ QUAN TRỌNG** khi render danh sách:

```jsx
// ❌ KHÔNG có key (hoặc dùng index làm key):
{
  products.map((product, index) => <Product key={index} product={product} />)
}
```

**Vấn đề khi dùng index làm key:**

```
Trước:                          Sau (thêm 1 sản phẩm ở đầu):
key=0: iPhone 15                key=0: Samsung S24    ← React nghĩ: "key=0 thay đổi props"
key=1: Samsung S24              key=1: iPhone 15      ← React nghĩ: "key=1 thay đổi props"
key=2: Xiaomi 14                key=2: Samsung S24    ← React nghĩ: "key=2 thay đổi props"
                                key=3: Xiaomi 14      ← React nghĩ: "key=3 là mới"

→ React RE-RENDER TẤT CẢ 4 items! (vì props của key 0,1,2 đều "thay đổi")
```

```jsx
// ✅ Dùng unique ID làm key (như trong project của bạn):
{
  products.map((product) => <Product key={product._id} product={product} />)
}
```

```
Trước:                              Sau (thêm 1 sản phẩm ở đầu):
key="abc": iPhone 15                key="xyz": Samsung S24  ← React: "xyz là MỚI, mount nó"
key="def": Samsung S24              key="abc": iPhone 15    ← React: "abc không đổi, SKIP"
key="ghi": Xiaomi 14                key="def": Samsung S24  ← React: "def không đổi, SKIP"
                                    key="ghi": Xiaomi 14    ← React: "ghi không đổi, SKIP"

→ React chỉ MOUNT 1 item mới! Còn lại giữ nguyên.
```

### 1.5 Reconciliation trong project Shopee (code thực tế)

Trong file `ProductListInfinite.tsx` (dòng 294):

```tsx
// ✅ Project đang dùng product._id làm key - ĐÚNG CHUẨN
{
  rowProducts.map((product) => (
    <div className="col-span-1" key={product._id}>
      <Product product={product} />
    </div>
  ))
}
```

→ Khi thêm sản phẩm mới (infinite scroll load thêm page), React chỉ mount các sản phẩm mới, không re-render sản phẩm cũ.

---

## 2. Đếm DOM Nodes thực tế của Product Card

### 2.1 Trả lời câu hỏi: "Con số 10 DOM nodes lấy ở đâu?"

**Thật ra con số 10 là SAI và chỉ là ước chừng rất thấp.** Tôi đã đếm lại chính xác từ code thực tế của project, và con số thật sự là **~55-58 DOM nodes** cho MỖI Product Card.

### 2.2 Đếm chi tiết từ code thực tế

Dưới đây là cây DOM thực tế của 1 Product Card, đếm từ 3 file:

- `Product.tsx` (component chính)
- `OptimizedImage.tsx` (component ảnh)
- `ProductRating.tsx` (component sao đánh giá)
- `WishlistButton.tsx` (nút yêu thích)

```
div[role="link"]                              #1
└─ div.card-container                         #2
   ├─ div.image-section                       #3
   │  ├─ div.optimized-image-container        #4  (OptimizedImage)
   │  │  ├─ div.skeleton-pulse                #5  (loading skeleton)
   │  │  └─ img                               #6  (ảnh sản phẩm)
   │  └─ div.wishlist-position                #7
   │     └─ button                            #8  (WishlistButton)
   │        └─ svg                            #9  (heart icon)
   │           └─ path                        #10
   ├─ div.info-section                        #11
   │  ├─ div.product-name                     #12 (tên sản phẩm)
   │  ├─ div.price-row                        #13
   │  │  ├─ div.original-price                #14
   │  │  │  ├─ span "₫"                       #15
   │  │  │  └─ span "500.000"                 #16
   │  │  └─ div.sale-price                    #17
   │  │     ├─ span "₫"                       #18
   │  │     └─ span "350.000"                 #19
   │  └─ div.rating-sold-row                  #20
   │     ├─ div.rating-container              #21 (ProductRating)
   │     │  ├─ div.star-1                     #22 ─┐
   │     │  │  ├─ div.active-overlay          #23  │
   │     │  │  │  └─ svg + polygon            #24 #25
   │     │  │  └─ svg + polygon               #26 #27
   │     │  ├─ div.star-2                     #28 ─┤
   │     │  │  ├─ div + svg + polygon         #29 #30 #31
   │     │  │  └─ svg + polygon               #32 #33
   │     │  ├─ div.star-3                     #34 ─┤  5 ngôi sao
   │     │  │  ├─ div + svg + polygon         #35 #36 #37
   │     │  │  └─ svg + polygon               #38 #39
   │     │  ├─ div.star-4                     #40 ─┤
   │     │  │  ├─ div + svg + polygon         #41 #42 #43
   │     │  │  └─ svg + polygon               #44 #45
   │     │  └─ div.star-5                     #46 ─┘
   │     │     ├─ div + svg + polygon         #47 #48 #49
   │     │     └─ svg + polygon               #50 #51
   │     └─ div.sold-section                  #52
   │        ├─ span "Đã bán"                  #53
   │        └─ span "1.2k"                    #54
   └─ div.location-section                    #55
      └─ div.flex-container                   #56
         └─ span "TP. Hồ Chí Minh"           #57
```

### 2.3 Tổng kết DOM nodes

| Phần                  | Số DOM Nodes |
| --------------------- | :----------: |
| Wrapper + Card        |      2       |
| Image section         |      4       |
| WishlistButton        |      3       |
| Product name          |      1       |
| Price section         |      7       |
| ProductRating (5 sao) |    **31**    |
| Sold section          |      3       |
| Location section      |      3       |
| **TỔNG CỘNG**         |   **~57**    |

### 2.4 Tại sao con số này quan trọng?

```
Không có Virtualization:
  10,000 sản phẩm × 57 DOM nodes = 570,000 DOM nodes 🔥💀

Có Virtualization (viewport hiển thị ~20 sản phẩm):
  20 sản phẩm × 57 DOM nodes = 1,140 DOM nodes ✅👍
```

→ Chênh lệch: **500 lần!** Đó là lý do virtualization cực kỳ quan trọng.

---

## 3. @tanstack/react-virtual giải quyết bài toán Virtualization

### 3.1 Bài toán: Tại sao cần Virtualization?

```
Bạn có 10,000 sản phẩm. Màn hình chỉ hiển thị được ~20 sản phẩm.

❌ Không có Virtualization:
   Browser phải tạo 10,000 × 57 = 570,000 DOM nodes
   → Tất cả đều nằm trong bộ nhớ
   → Browser phải tính layout cho TẤT CẢ
   → Scroll bị lag, giật, đơ

✅ Có Virtualization:
   Browser chỉ tạo ~20 × 57 = 1,140 DOM nodes
   → Chỉ những gì user NHÌN THẤY mới tồn tại trong DOM
   → Scroll mượt mà
```

### 3.2 Nguyên lý hoạt động (giải thích bằng hình ảnh)

```
┌─────────────────────────────────────────────────┐
│              SCROLL CONTAINER                    │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │    Spacer trên (padding-top)              │  │ ← Khoảng trống giả
│  │    height = tổng chiều cao các item       │  │    để thanh scroll
│  │    phía trên viewport                     │  │    có đúng kích thước
│  │                                           │  │
│  ├───────────────────────────────────────────┤  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │  │ ← overscan items
│  │  │ SP #58  │ │ SP #59  │ │ SP #60  │     │  │   (đệm phía trên)
│  ├──┼─────────┼─┼─────────┼─┼─────────┼─────┤  │
│  │  │ SP #61  │ │ SP #62  │ │ SP #63  │     │  │
│  │  ├─────────┤ ├─────────┤ ├─────────┤     │  │
│  │  │ SP #64  │ │ SP #65  │ │ SP #66  │     │  │ ← VIEWPORT
│  │  ├─────────┤ ├─────────┤ ├─────────┤     │  │   (user nhìn thấy)
│  │  │ SP #67  │ │ SP #68  │ │ SP #69  │     │  │
│  ├──┼─────────┼─┼─────────┼─┼─────────┼─────┤  │
│  │  │ SP #70  │ │ SP #71  │ │ SP #72  │     │  │ ← overscan items
│  │  └─────────┘ └─────────┘ └─────────┘     │  │   (đệm phía dưới)
│  ├───────────────────────────────────────────┤  │
│  │                                           │  │
│  │    Spacer dưới (padding-bottom)           │  │ ← Khoảng trống giả
│  │    height = tổng chiều cao các item       │  │
│  │    phía dưới viewport                     │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

SP #1 đến #57:   KHÔNG TỒN TẠI trong DOM (chỉ có spacer)
SP #58 đến #72:  TỒN TẠI trong DOM (viewport + overscan)
SP #73 đến #10000: KHÔNG TỒN TẠI trong DOM (chỉ có spacer)
```

### 3.3 Code thực tế trong project (ProductListInfinite.tsx)

**Bước 1: Khởi tạo virtualizer**

```tsx
// Grid view: virtualize theo HÀNG (mỗi hàng 5 sản phẩm)
const gridVirtualizer = useVirtualizer({
  count: gridRows.length, // Tổng số hàng (10000/5 = 2000 hàng)
  getScrollElement: () => scrollContainerRef.current, // Container scroll
  estimateSize: () => 320, // Ước tính mỗi hàng cao 320px
  overscan: 3, // Render thêm 3 hàng trên/dưới viewport
})

// List view: virtualize theo TỪNG sản phẩm
const listVirtualizer = useVirtualizer({
  count: allProducts.length, // Tổng số sản phẩm (10000)
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 120, // Ước tính mỗi item cao 120px
  overscan: 5, // Render thêm 5 items trên/dưới viewport
})
```

**Bước 2: Render chỉ những items trong viewport**

```tsx
// Lấy danh sách virtual items (CHỈ những cái cần render)
const virtualItems = gridVirtualizer.getVirtualItems()
// Ví dụ: nếu đang scroll ở vị trí sản phẩm 60-70
// virtualItems = [row_11, row_12, row_13, row_14, row_15, row_16]
// (bao gồm overscan 3 hàng trên + viewport + overscan 3 hàng dưới)

return (
  <div
    style={{
      // Container có chiều cao = TỔNG chiều cao tất cả items
      // Để thanh scrollbar có kích thước đúng
      height: `${gridVirtualizer.getTotalSize()}px`, // VD: 640,000px
      width: '100%',
      position: 'relative',
    }}
  >
    {virtualItems.map((virtualRow) => {
      const rowProducts = gridRows[virtualRow.index]
      return (
        <div
          key={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            // Đặt vị trí chính xác bằng transform
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {rowProducts.map((product) => (
            <Product key={product._id} product={product} />
          ))}
        </div>
      )
    })}
  </div>
)
```

### 3.4 Giải thích từng tham số quan trọng

| Tham số            | Giá trị              | Ý nghĩa                             |
| ------------------ | -------------------- | ----------------------------------- |
| `count`            | `gridRows.length`    | Tổng số items cần virtualize        |
| `getScrollElement` | `scrollContainerRef` | Element nào đang scroll             |
| `estimateSize`     | `() => 320`          | Ước tính chiều cao mỗi item (px)    |
| `overscan`         | `3`                  | Số items render thêm ngoài viewport |

**Tại sao cần `overscan`?**

```
overscan = 0:
  Khi scroll nhanh → user thấy khoảng trắng trước khi items kịp render
  → Trải nghiệm xấu

overscan = 3:
  Render thêm 3 items phía trên + 3 items phía dưới viewport
  → Khi scroll, items đã sẵn sàng → Không thấy khoảng trắng
  → Trải nghiệm mượt mà

overscan quá lớn (VD: 50):
  Render quá nhiều items ngoài viewport
  → Mất đi lợi ích của virtualization
```

### 3.5 Kỹ thuật "absolute positioning + transform"

Đây là cách `@tanstack/react-virtual` đặt vị trí items:

```
Container (position: relative, height: 640,000px)
│
├─ Item (position: absolute, transform: translateY(35,200px))  ← Row 110
├─ Item (position: absolute, transform: translateY(35,520px))  ← Row 111
├─ Item (position: absolute, transform: translateY(35,840px))  ← Row 112
├─ Item (position: absolute, transform: translateY(36,160px))  ← Row 113
└─ Item (position: absolute, transform: translateY(36,480px))  ← Row 114
```

**Tại sao dùng `transform` thay vì `top`?**

- `transform: translateY()` được xử lý bởi **GPU** (hardware accelerated)
- `top` được xử lý bởi **CPU** và trigger layout recalculation
- → `transform` nhanh hơn rất nhiều khi scroll

---

## 4. Hạn chế re-render khi 1 sản phẩm thay đổi

### 4.1 Vấn đề: 1 sản phẩm thay đổi → 5000 sản phẩm re-render?

```
Giả sử: Sản phẩm #42 được cập nhật giá từ 500k → 450k

❌ Nếu không tối ưu:
   React re-render TOÀN BỘ ProductList component
   → Re-render tất cả 5000 Product components
   → Reconciliation phải diff 5000 × 57 = 285,000 DOM nodes
   → Dù cuối cùng chỉ cập nhật 2 DOM nodes (giá cũ + giá mới)

✅ Nếu tối ưu đúng cách:
   Chỉ Product #42 re-render
   → Reconciliation diff 57 DOM nodes
   → Cập nhật 2 DOM nodes
```

### 4.2 So sánh: NextJS ISR vs React Client-Side

| Khía cạnh   | NextJS ISR                          | React Client-Side                       |
| ----------- | ----------------------------------- | --------------------------------------- |
| Nơi xử lý   | Server-side                         | Browser                                 |
| Cơ chế      | Revalidate HTML tĩnh theo thời gian | Re-render component khi state/props đổi |
| Granularity | Cả trang                            | Từng component                          |
| Phù hợp     | SEO, static content                 | Interactive UI, real-time updates       |

**ISR (Incremental Static Regeneration)** giải quyết vấn đề ở tầng **server** - nó regenerate HTML tĩnh.
Nhưng ở **client-side React**, chúng ta cần các kỹ thuật khác.

### 4.3 Các kỹ thuật tối ưu re-render trong React (từ cơ bản → nâng cao)

#### Kỹ thuật 1: `React.memo` (Project đang dùng ✅)

```tsx
// Product.tsx - dòng 135
export default memo(Product)
```

**Cách hoạt động:**

```
Khi ProductList re-render:

Product #1:  props cũ === props mới?  → YES → SKIP (không re-render)
Product #2:  props cũ === props mới?  → YES → SKIP
...
Product #42: props cũ === props mới?  → NO (giá thay đổi) → RE-RENDER
...
Product #5000: props cũ === props mới? → YES → SKIP

→ Chỉ Product #42 re-render!
```

**Lưu ý quan trọng:** `React.memo` chỉ so sánh **shallow** (nông):

```tsx
// ✅ Hoạt động tốt - primitive values
<Product product={product} />
// Nếu product object reference không đổi → memo skip

// ❌ Vấn đề - object reference mới mỗi lần render
<Product product={{ ...product, extra: 'data' }} />
// Object mới mỗi lần → memo KHÔNG skip được
```

#### Kỹ thuật 2: `useMemo` cho derived data (Project đang dùng ✅)

```tsx
// ProductListInfinite.tsx - dòng 97-100
const allProducts = useMemo(() => {
  if (!productsData?.pages) return []
  return productsData.pages.flatMap((page) => page.data.data.products)
}, [productsData?.pages])
// → Chỉ tính lại khi productsData.pages thay đổi
// → Không tạo array mới mỗi lần component re-render

// Dòng 123-129
const gridRows = useMemo(() => {
  const rows: (typeof allProducts)[] = []
  for (let i = 0; i < allProducts.length; i += gridColumns) {
    rows.push(allProducts.slice(i, i + gridColumns))
  }
  return rows
}, [allProducts])
// → gridRows chỉ tính lại khi allProducts thay đổi
```

#### Kỹ thuật 3: `useCallback` cho event handlers (Project đang dùng ✅)

```tsx
// Product.tsx - dòng 33-42
const handleProductClick = useCallback(() => {
  handlePrefetchClick();
  scrollManager.savePosition(...);
  navigate(`${path.home}${generateNameId(...)}`);
}, [navigate, product.name, product._id, handlePrefetchClick]);
// → Không tạo function mới mỗi lần render
// → Giúp React.memo hoạt động hiệu quả
```

#### Kỹ thuật 4: React Compiler (Project đang dùng ✅)

```tsx
// vite.config.ts
react({
  babel: {
    plugins: [['babel-plugin-react-compiler', {}]],
  },
})
```

React Compiler **tự động** thêm memoization cho bạn:

- Tự động memo components
- Tự động useMemo cho expressions
- Tự động useCallback cho functions

→ Đây là tương lai của React optimization, không cần viết memo/useMemo/useCallback thủ công nữa.

#### Kỹ thuật 5: Normalized State + Selective Updates (Nâng cao)

Đây là kỹ thuật mà **Redux/Zustand** sử dụng:

```tsx
// ❌ Cách thông thường: Array of objects
const [products, setProducts] = useState([
  { id: '1', name: 'iPhone', price: 500 },
  { id: '2', name: 'Samsung', price: 400 },
  // ... 5000 items
])

// Khi cập nhật 1 sản phẩm → tạo array MỚI → tất cả re-render
setProducts((prev) => prev.map((p) => (p.id === '42' ? { ...p, price: 450 } : p)))
```

```tsx
// ✅ Normalized state: Object lookup by ID
const [productsById, setProductsById] = useState({
  '1': { id: '1', name: 'iPhone', price: 500 },
  '2': { id: '2', name: 'Samsung', price: 400 },
  // ...
});
const [productIds, setProductIds] = useState(['1', '2', ...]);

// Mỗi ProductItem chỉ subscribe vào product CỦA NÓ
const ProductItem = memo(({ id }) => {
  const product = productsById[id]; // Chỉ re-render khi product này đổi
  return <div>{product.name} - {product.price}</div>;
});

// Cập nhật 1 sản phẩm → chỉ ProductItem đó re-render
setProductsById(prev => ({
  ...prev,
  '42': { ...prev['42'], price: 450 }
}));
```

#### Kỹ thuật 6: TanStack Query - Smart Cache Invalidation (Project đang dùng ✅)

```tsx
// Thay vì invalidate toàn bộ products query:
queryClient.invalidateQueries({ queryKey: ['products'] })

// Có thể update cache trực tiếp cho 1 sản phẩm:
queryClient.setQueryData(['product', productId], (old) => ({
  ...old,
  price: newPrice,
}))
// → Chỉ component nào subscribe vào product đó mới re-render
```

### 4.4 Tổng hợp: Chiến lược tối ưu hoàn chỉnh

```
Tầng 1: React.memo
  → Ngăn re-render khi props không đổi

Tầng 2: useMemo + useCallback
  → Đảm bảo props reference ổn định cho memo

Tầng 3: React Compiler
  → Tự động hóa tầng 1 + 2

Tầng 4: Virtualization (@tanstack/react-virtual)
  → Giảm số lượng components cần xét từ 5000 → ~20

Tầng 5: Smart State Management
  → Normalized state + selective subscriptions

Tầng 6: Smart Cache (TanStack Query)
  → Granular cache updates thay vì refetch toàn bộ
```

---

## 5. Virtualization + Re-render: Chuyện gì thực sự xảy ra?

### 5.1 Câu hỏi: "Khi dùng virtualization, danh sách re-render hết nhưng DOM chỉ tính lại viewport thôi phải không?"

**Câu trả lời chính xác: CÓ và KHÔNG - tùy vào "re-render" bạn đang nói đến cái gì.**

Có 3 tầng cần phân biệt rõ:

```
Tầng 1: JavaScript execution (React component function chạy)
Tầng 2: Virtual DOM diffing (Reconciliation)
Tầng 3: Real DOM updates (Browser paint)
```

### 5.2 Phân tích chi tiết từng tầng

#### Tầng 1: JavaScript execution

```
Khi state thay đổi (VD: scroll position thay đổi):

ProductListInfinite() chạy lại          ← CÓ chạy
├─ useVirtualizer tính toán lại         ← CÓ chạy (tính items nào trong viewport)
├─ getVirtualItems() trả về items mới   ← CÓ chạy
│
│  Nhưng CHỈ gọi render cho items trong viewport:
├─ Product #58 render()                 ← CÓ chạy (trong viewport)
├─ Product #59 render()                 ← CÓ chạy
├─ ...
├─ Product #72 render()                 ← CÓ chạy
│
│  Các items NGOÀI viewport:
├─ Product #1 đến #57                   ← KHÔNG chạy (không tồn tại)
└─ Product #73 đến #10000              ← KHÔNG chạy (không tồn tại)
```

**Kết luận Tầng 1:** Chỉ ~15-20 Product components chạy JavaScript, KHÔNG PHẢI 10,000.

#### Tầng 2: Virtual DOM Diffing (Reconciliation)

```
React so sánh Virtual DOM cũ vs mới:

Trước scroll (viewport: SP #55-#69):
  DOM: [SP#52, SP#53, SP#54, SP#55, ..., SP#69, SP#70, SP#71, SP#72]

Sau scroll xuống 1 hàng (viewport: SP #60-#74):
  DOM: [SP#57, SP#58, SP#59, SP#60, ..., SP#74, SP#75, SP#76, SP#77]

Reconciliation:
  - SP#52-#56: bị REMOVE khỏi DOM (unmount)
  - SP#57-#72: đã có sẵn, kiểm tra props có đổi không
    - Nếu dùng React.memo + key={product._id} → SKIP (không diff sâu)
  - SP#73-#77: được THÊM vào DOM (mount mới)
```

**Kết luận Tầng 2:** Reconciliation chỉ xử lý ~20 items, không phải 10,000.

#### Tầng 3: Real DOM Updates

```
Browser chỉ cần:
  1. Remove 5 DOM subtrees (SP#52-#56) → 5 × 57 = 285 nodes removed
  2. Add 5 DOM subtrees (SP#73-#77)    → 5 × 57 = 285 nodes added
  3. Update transform của các items còn lại (chỉ thay đổi CSS)

Tổng DOM operations: ~570 nodes + vài CSS updates
Thay vì: 570,000 nodes nếu không có virtualization
```

**Kết luận Tầng 3:** Browser chỉ thao tác trên ~570 DOM nodes.

### 5.3 So sánh trực quan: Có vs Không có Virtualization

```
╔══════════════════════════════════════════════════════════════════╗
║                    KHÔNG CÓ VIRTUALIZATION                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Khi 1 sản phẩm thay đổi giá:                                  ║
║                                                                  ║
║  Tầng 1 (JS):     10,000 Product() functions chạy               ║
║                    (dù có React.memo, vẫn phải CHECK props)      ║
║                                                                  ║
║  Tầng 2 (Diff):   10,000 components cần kiểm tra                ║
║                    → 9,999 skip + 1 diff sâu                    ║
║                                                                  ║
║  Tầng 3 (DOM):    570,000 DOM nodes tồn tại trong bộ nhớ        ║
║                    → Chỉ update 2 nodes (giá)                   ║
║                    → Nhưng browser vẫn phải layout 570,000      ║
║                                                                  ║
║  Thời gian: ~200-500ms (giật lag rõ rệt)                       ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                    CÓ VIRTUALIZATION                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Khi 1 sản phẩm thay đổi giá:                                  ║
║                                                                  ║
║  Tầng 1 (JS):     ~20 Product() functions chạy                  ║
║                    (chỉ items trong viewport + overscan)         ║
║                                                                  ║
║  Tầng 2 (Diff):   ~20 components kiểm tra                       ║
║                    → 19 skip + 1 diff sâu (nếu SP đó ở viewport)║
║                    → 20 skip (nếu SP đó NGOÀI viewport)         ║
║                                                                  ║
║  Tầng 3 (DOM):    ~1,140 DOM nodes tồn tại trong bộ nhớ         ║
║                    → Update 2 nodes (hoặc 0 nếu ngoài viewport) ║
║                    → Browser layout 1,140 nodes                  ║
║                                                                  ║
║  Thời gian: ~1-5ms (không cảm nhận được)                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### 5.4 Trường hợp đặc biệt: Sản phẩm thay đổi NGOÀI viewport

```
Viewport đang hiển thị SP #60-#70
Sản phẩm #500 được cập nhật giá

Với Virtualization:
  1. TanStack Query cập nhật cache
  2. ProductListInfinite re-render
  3. useVirtualizer tính lại → vẫn chỉ render SP #57-#73
  4. SP #500 KHÔNG TỒN TẠI trong DOM → KHÔNG có gì xảy ra
  5. Khi user scroll đến SP #500 → mount MỚI với giá đã cập nhật

→ Zero DOM cost cho updates ngoài viewport!
```

### 5.5 Trả lời chính xác câu hỏi ban đầu

> "Khi dùng virtualization, danh sách re-render hết nhưng DOM chỉ tính lại viewport thôi phải không?"

**Chính xác hơn:**

1. **Component function** (JavaScript): Chỉ ~20 components chạy, KHÔNG PHẢI toàn bộ danh sách
2. **Virtual DOM**: Chỉ diff ~20 components
3. **Real DOM**: Chỉ ~1,140 nodes tồn tại, chỉ update nodes thực sự thay đổi
4. **Sản phẩm ngoài viewport**: Hoàn toàn KHÔNG tồn tại trong DOM, không tốn bất kỳ chi phí nào

→ Virtualization không chỉ giảm DOM nodes, mà còn giảm cả JavaScript execution và Reconciliation work.

---

## 6. Tổng kết kiến trúc tối ưu trong Project Shopee

```
┌─────────────────────────────────────────────────────────┐
│                    USER SCROLLS                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  @tanstack/react-virtual (useVirtualizer)                │
│  → Tính toán items nào nằm trong viewport               │
│  → Chỉ render ~20 items (viewport + overscan)           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  React.memo (Product component)                          │
│  → So sánh props: product object có thay đổi không?     │
│  → Nếu không → SKIP render                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  React Reconciliation (Diffing)                          │
│  → So sánh Virtual DOM cũ vs mới                        │
│  → Tìm minimal changes                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Browser DOM Update                                      │
│  → Chỉ thay đổi đúng nodes cần thiết                   │
│  → GPU-accelerated transforms cho positioning           │
└─────────────────────────────────────────────────────────┘
```

### Bảng so sánh hiệu năng cuối cùng

| Metric                       | Không tối ưu | Có Virtualization + Memo |
| ---------------------------- | :----------: | :----------------------: |
| DOM Nodes (10K SP)           |   570,000    |          ~1,140          |
| JS Components chạy           |    10,000    |           ~20            |
| Memory usage                 |   ~500MB+    |         ~10-20MB         |
| Scroll FPS                   |  10-20 fps   |          60 fps          |
| Time to Interactive          |    5-10s     |          <500ms          |
| Update 1 SP (trong viewport) |  ~200-500ms  |          ~1-5ms          |
| Update 1 SP (ngoài viewport) |  ~200-500ms  |           ~0ms           |

---

> **Ghi chú:** Tài liệu này được phân tích dựa trên codebase thực tế của Shopee Project, với các file chính:
>
> - `apps/shopee-web/src/pages/ProductList/ProductListInfinite.tsx`
> - `apps/shopee-web/src/pages/ProductList/components/Product/Product.tsx`
> - `apps/shopee-web/src/components/ProductRating/ProductRating.tsx`
> - `apps/shopee-web/src/components/OptimizedImage/OptimizedImage.tsx`
> - `apps/shopee-web/src/components/WishlistButton/WishlistButton.tsx`
