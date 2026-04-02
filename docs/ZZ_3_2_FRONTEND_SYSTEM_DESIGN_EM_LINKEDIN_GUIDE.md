# FRONTEND SYSTEM DESIGN — THEO ENGINEERING MANAGER 12+ NĂM KINH NGHIỆM

> **Nguồn:** Bài chia sẻ trên LinkedIn của một Engineering Manager 12+ năm kinh nghiệm
>
> **Trích dẫn gốc:** *"This is where mid and senior levels are getting filtered now."*
>
> **Mục đích:** Phân tích sâu từng điểm trong bài chia sẻ — với lý do tại sao, cách implement, và cách trả lời trong phỏng vấn
>
> **Ngày tạo:** 02/04/2026

---

## TẠI SAO EM NÀY QUAN TRỌNG?

Engineering Manager nói thẳng: **"Đây là chỗ mid và senior bị loại."**

Không phải thuật toán. Không phải DSA. Mà là **system design + performance** ở frontend.

Lý do:
- Junior biết code component → ai cũng làm được
- Mid/Senior phải biết **thiết kế hệ thống** — tại sao đặt state ở đây, tại sao gọi API lúc này, tại sao tách component theo cách này
- Interviewer không cần bạn nhớ API, họ cần thấy bạn **suy nghĩ như người ship production**

> *"Goal: if I design a feature on a whiteboard, it should look like something we can ship, not just fancy boxes."*

---

## MỤC LỤC

| # | Chủ đề | Loại |
|---|--------|------|
| **PHẦN A: PRACTICE DESIGNS** | | |
| 1 | [Notification / Toast System](#1-notification--toast-system) | Small design |
| 2 | [Search with Suggestions](#2-search-with-suggestions) | Small design |
| 3 | [Carousel / Infinite Scroll](#3-carousel--infinite-scroll) | Small design |
| 4 | [Form Flows with Complex Validation](#4-form-flows-with-complex-validation) | Small design |
| **PHẦN B: THINKING FRAMEWORKS** | | |
| 5 | [Where to Keep State and Why](#5-where-to-keep-state-and-why) | Thinking |
| 6 | [How Many Network Calls Happen and When](#6-how-many-network-calls-happen-and-when) | Thinking |
| 7 | [How to Break Features into Components and Modules](#7-how-to-break-features-into-components-and-modules) | Thinking |
| **PHẦN C: PERFORMANCE** | | |
| 8 | [Core Web Vitals](#8-core-web-vitals) | Performance |
| 9 | [Code Splitting and Lazy Loading](#9-code-splitting-and-lazy-loading) | Performance |
| 10 | [Bundle Size Basics](#10-bundle-size-basics) | Performance |
| 11 | [memo, useCallback, useMemo — Khi Nào Dùng, Khi Nào Không](#11-memo-usecallback-usememo--khi-nào-dùng-khi-nào-không) | Performance |
| 12 | [SSR vs CSR Tradeoffs](#12-ssr-vs-csr-tradeoffs) | Performance |

---

## PHẦN A: PRACTICE DESIGNS

---

## 1. NOTIFICATION / TOAST SYSTEM

### Tại sao quan trọng?

Toast system là bài tập **"nhỏ nhưng lộ hết"** — nó test:
- Bạn có hiểu **global state** không?
- Bạn có nghĩ đến **accessibility** không?
- Bạn có handle **edge cases** (nhiều toast cùng lúc, memory leak, animation) không?

### Clarifying Questions (hỏi trước khi thiết kế)

```
1. Toast có interactive elements không? (nút "Undo", "View", link)
2. Vị trí hiển thị? (top-right, bottom-center, mobile full-width)
3. Tối đa bao nhiêu toast cùng lúc? (queue hay discard cũ?)
4. Auto-dismiss timeout có customize được không?
5. Trigger từ đâu? (chỉ React components hay cả plain JS utilities?)
6. Animation cần không?
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App Root                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  ToastProvider                        │  │
│  │  (Global state: toasts[], add(), remove(), clear())  │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────▼──────────────────────────┐  │
│  │                  ToastContainer                       │  │
│  │  (Portal → renders outside normal DOM tree)          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  Toast   │  │  Toast   │  │  Toast   │          │  │
│  │  │ success  │  │  error   │  │  info    │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Bất kỳ component nào cũng có thể gọi:                     │
│  toast.success("Saved!") / toast.error("Failed!")           │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface Toast {
  id: string           // uuid để identify
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number    // ms, default 3000, 0 = không auto-dismiss
  action?: {           // optional interactive button
    label: string
    onClick: () => void
  }
  createdAt: number    // timestamp để sort
}

interface ToastState {
  toasts: Toast[]
  maxVisible: number   // default 5
}
```

### Interface (API)

```typescript
// Global toast API — gọi từ bất kỳ đâu
const toast = {
  success: (message: string, options?: ToastOptions) => string,
  error:   (message: string, options?: ToastOptions) => string,
  warning: (message: string, options?: ToastOptions) => string,
  info:    (message: string, options?: ToastOptions) => string,
  dismiss: (id: string) => void,
  clear:   () => void,
}

// Usage
toast.success("Item added to cart")
toast.error("Network error. Please retry.", { duration: 0 })
toast.success("File saved", {
  action: { label: "Undo", onClick: handleUndo }
})
```

### Key Technical Decisions

**1. Tại sao dùng Portal?**
```
Toast phải render ở top of z-index stack.
Nếu render trong component tree bình thường → có thể bị clip bởi
overflow:hidden của ancestor, hoặc z-index bị ảnh hưởng bởi
stacking context của parent.

ReactDOM.createPortal(<ToastContainer />, document.body)
→ Render trực tiếp vào body, thoát khỏi mọi stacking context.
```

**2. Timer management — tránh memory leak**
```typescript
useEffect(() => {
  if (toast.duration === 0) return  // manual dismiss only

  const timer = setTimeout(() => {
    removeToast(toast.id)
  }, toast.duration ?? 3000)

  return () => clearTimeout(timer)  // cleanup khi unmount
}, [toast.id])
```

**3. Queue vs Discard khi quá nhiều toast**
```
Option A — Queue: Lưu pending toasts, hiển thị khi slot trống
  → UX tốt hơn, không mất notifications
  → Phức tạp hơn

Option B — Discard oldest: Xóa toast cũ nhất khi đạt maxVisible
  → Đơn giản hơn
  → Có thể mất thông tin quan trọng

→ Nên hỏi interviewer: toast nào là critical? (error → không discard)
```

**4. Accessibility (ARIA)**
```html
<!-- Container: aria-live để screen reader announce -->
<div
  role="region"
  aria-label="Notifications"
  aria-live="polite"      <!-- info/success: polite (không interrupt) -->
  aria-atomic="false"     <!-- announce từng toast riêng lẻ -->
>

<!-- Error toast: assertive (interrupt ngay) -->
<div role="alert" aria-live="assertive">
  Network error. Please retry.
</div>

<!-- Close button -->
<button aria-label="Dismiss notification">×</button>
```

### Optimizations

| Concern | Solution |
|---------|----------|
| Animation | CSS transitions, `framer-motion` AnimatePresence |
| Stacking order | Newest on top (prepend) hoặc bottom (append) |
| Mobile | Full-width bottom sheet thay vì corner toast |
| Pause on hover | Clear timer khi hover, restart khi leave |
| Reduced motion | `prefers-reduced-motion` → disable animations |
| Duplicate prevention | Hash message → skip nếu identical toast đang hiển thị |

### Câu hỏi interviewer hay hỏi thêm

- *"Nếu user offline và có 10 actions pending, toast hiển thị thế nào?"*
  → Queue với "offline" indicator, flush khi online lại
- *"Làm sao test toast system?"*
  → Mock timer (jest.useFakeTimers), test ARIA announcements, test queue behavior

---

## 2. SEARCH WITH SUGGESTIONS

### Tại sao quan trọng?

Search with suggestions là bài test **networking + UX + performance** cùng lúc. Nó xuất hiện ở mọi nơi: Google, Shopee, Grab, Facebook.

### Clarifying Questions

```
1. Suggestions từ API hay local data?
2. Cần highlight matching text không?
3. Cần recent searches / trending không?
4. Keyboard navigation cần không?
5. Mobile support? (virtual keyboard behavior)
6. Debounce delay acceptable? (200ms? 300ms?)
7. Minimum query length? (1 char? 2 chars?)
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SearchBox Component                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SearchInput                                          │  │
│  │  - Controlled input                                   │  │
│  │  - Debounced onChange                                 │  │
│  │  - Keyboard event handler                             │  │
│  │  - ARIA: role="combobox", aria-expanded               │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────▼──────────────────────────┐  │
│  │  SuggestionsDropdown (conditional render)             │  │
│  │  - role="listbox"                                     │  │
│  │  - SuggestionItem (role="option", aria-selected)      │  │
│  │  - Loading skeleton                                   │  │
│  │  - Empty state                                        │  │
│  │  - Error state                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useAutocomplete Hook (logic layer)                   │  │
│  │  - Debounce                                           │  │
│  │  - Fetch + AbortController                            │  │
│  │  - In-memory cache (Map)                              │  │
│  │  - activeIndex state                                  │  │
│  │  - isOpen state                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface Suggestion {
  id: string
  text: string
  category?: string    // "Product", "Brand", "Category"
  icon?: string
  url?: string         // direct navigation
}

interface AutocompleteState {
  query: string
  suggestions: Suggestion[]
  activeIndex: number   // -1 = none selected
  isOpen: boolean
  isLoading: boolean
  error: string | null
}
```

### Critical Implementation: Race Condition

```
User types: "sh" → "sho" → "shop" → "shopee"
                                          │
Debounce 300ms: chỉ gửi request cho ─── "shopee"

Nhưng nếu user type nhanh hơn debounce:
  Request A: "sho"  → gửi đi
  Request B: "shop" → gửi đi
  Request C: "shopee" → gửi đi

  Response B đến trước Response A → hiển thị kết quả sai!

SOLUTION: AbortController
```

```typescript
const useAutocomplete = (query: string) => {
  const cache = useRef(new Map<string, Suggestion[]>())
  const abortRef = useRef<AbortController | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    // Check cache trước
    const normalized = q.trim().toLowerCase()
    if (cache.current.has(normalized)) {
      return cache.current.get(normalized)!
    }

    // Cancel request trước đó
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/suggestions?q=${q}`, {
        signal: abortRef.current.signal
      })
      const data = await res.json()

      // Lưu vào cache
      cache.current.set(normalized, data.suggestions)
      return data.suggestions
    } catch (err) {
      if (err.name === 'AbortError') return  // Bỏ qua, request bị cancel
      throw err
    }
  }, [])

  // Cleanup khi unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])
}
```

### Keyboard Navigation

```
State: activeIndex (default -1 = input focused, nothing selected)

ArrowDown → activeIndex++  (wrap: nếu ở cuối → về -1)
ArrowUp   → activeIndex--  (wrap: nếu ở -1 → về cuối)
Enter     → select suggestions[activeIndex] hoặc submit form
Escape    → close dropdown, activeIndex = -1
Tab       → close dropdown (user muốn rời đi)

Visual: scroll active item into view
  document.getElementById(`suggestion-${activeIndex}`)
    ?.scrollIntoView({ block: 'nearest' })
```

### ARIA Pattern (Combobox)

```html
<input
  role="combobox"
  aria-expanded="true"
  aria-autocomplete="list"
  aria-controls="suggestions-listbox"
  aria-activedescendant="suggestion-2"
/>

<ul
  id="suggestions-listbox"
  role="listbox"
>
  <li id="suggestion-0" role="option" aria-selected="false">Shopee</li>
  <li id="suggestion-1" role="option" aria-selected="false">Shopee Mall</li>
  <li id="suggestion-2" role="option" aria-selected="true">Shopee Pay</li>
</ul>
```

### Performance Optimizations

| Optimization | Giải thích |
|-------------|-----------|
| Debounce 200-300ms | Giảm số requests |
| Min query length (2 chars) | Tránh quá nhiều results |
| In-memory LRU cache | Instant results cho repeated queries |
| AbortController | Cancel stale requests |
| Virtualize suggestions | Nếu list > 100 items |
| Highlight matching text | UX tốt hơn, dùng `<mark>` tag |

---

## 3. CAROUSEL / INFINITE SCROLL

### Tại sao quan trọng?

Hai bài này test **DOM performance** — đây là chỗ nhiều dev viết code chạy được nhưng **chậm kinh khủng** ở production với real data.

---

### 3A. Image Carousel

#### Clarifying Questions

```
1. Bao nhiêu images? (5 hay 5000?)
2. Auto-play cần không?
3. Touch/swipe support?
4. Thumbnail navigation?
5. Fullscreen mode?
6. Video support?
```

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Carousel                                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SlideTrack (overflow: hidden)                        │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │  │
│  │  │ -1   │ │  0   │ │  1   │ │  2   │ │  3   │      │  │
│  │  │(prev)│ │(curr)│ │(next)│ │      │ │      │      │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │  │
│  │  transform: translateX(-100%)  ← CSS transition      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ← Prev Button    Indicators (●●○○○)    Next Button →      │
└─────────────────────────────────────────────────────────────┘
```

#### Key Decisions

**Lazy loading images:**
```html
<!-- Chỉ load current + adjacent slides -->
<img
  src={isNearCurrent ? slide.url : undefined}
  loading="lazy"
  decoding="async"
  alt={slide.alt}
/>
```

**Virtualization cho large carousels (1000+ slides):**
```
Thay vì render tất cả slides → chỉ render 3 DOM nodes:
  [prev slide] [current slide] [next slide]

Khi navigate: swap DOM nodes + update content
→ Không quan trọng có 10 hay 10,000 slides
```

**CSS transition vs JS animation:**
```
CSS: transform + transition
  → GPU-accelerated (composite layer)
  → Không block main thread
  → 60fps smooth

JS: setInterval + left/margin
  → Main thread
  → Janky nếu main thread busy
  → TRÁNH
```

**Accessibility:**
```html
<div
  role="region"
  aria-label="Product images"
  aria-roledescription="carousel"
>
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="Slide 1 of 5"
  >
    <img alt="Product front view" />
  </div>
</div>

<!-- Auto-play control -->
<button aria-label="Pause auto-play">⏸</button>
<!-- WCAG: user phải có thể pause auto-moving content -->
```

---

### 3B. Infinite Scroll

#### Clarifying Questions

```
1. Bao nhiêu total items? (100? 1 triệu?)
2. Items có fixed height không? (virtualization dễ hơn)
3. Cần "scroll to top" button không?
4. Cần preserve scroll position khi back navigate không?
5. Pull-to-refresh trên mobile?
6. Filter/sort reset scroll về đầu không?
```

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    InfiniteScrollList                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Item 1                                               │  │
│  │  Item 2                                               │  │
│  │  Item 3                                               │  │
│  │  ...                                                  │  │
│  │  Item N                                               │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  Sentinel Element (height: 1px)               │    │  │
│  │  │  ← IntersectionObserver watches this          │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │  [Loading skeleton] ← hiển thị khi fetching          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### IntersectionObserver Pattern

```typescript
const sentinelRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isFetching) {
        fetchNextPage()
      }
    },
    {
      rootMargin: '200px',  // Trigger 200px trước khi sentinel visible
      threshold: 0
    }
  )

  if (sentinelRef.current) {
    observer.observe(sentinelRef.current)
  }

  return () => observer.disconnect()
}, [hasMore, isFetching, fetchNextPage])
```

#### Virtualization khi list quá lớn

```
Vấn đề: 1000 items trong DOM → scroll lag, memory cao

Solution: Chỉ render items visible trong viewport + buffer

┌─────────────────────┐
│ Spacer (height = N  │  ← Giả lập height của items phía trên
│ items × item height)│
├─────────────────────┤
│ Item 45             │  ← Chỉ render ~20 items
│ Item 46             │
│ Item 47             │
│ ...                 │
│ Item 65             │
├─────────────────────┤
│ Spacer (height = M  │  ← Giả lập height của items phía dưới
│ items × item height)│
└─────────────────────┘

Library: react-window, react-virtuoso, TanStack Virtual
```

#### Cursor-based Pagination (không dùng offset)

```
Tại sao KHÔNG dùng offset?
  GET /products?page=3&limit=20
  → Nếu item mới được thêm vào giữa lúc user scroll
  → Items bị lặp hoặc bị bỏ qua

Dùng cursor:
  GET /products?cursor=lastItemId&limit=20
  → Luôn consistent, không bị ảnh hưởng bởi insertions
  → Phù hợp hơn cho real-time feeds
```

---

## 4. FORM FLOWS WITH COMPLEX VALIDATION

### Tại sao quan trọng?

Form là thứ user tương tác nhiều nhất. Complex form (checkout, onboarding, survey) test khả năng **manage state machine**, **validation strategy**, và **UX thinking**.

### Clarifying Questions

```
1. Bao nhiêu steps?
2. Có conditional steps không? (step 3 chỉ hiện nếu step 2 chọn X)
3. Draft saving cần không? (user có thể quay lại sau)
4. Validation: on blur, on change, hay on submit?
5. Async validation cần không? (check email uniqueness)
6. File upload cần không?
7. Cần progress indicator không?
```

### Architecture: State Machine Pattern

```
Thay vì nhiều boolean flags:
  isStep1Done = true
  isStep2Visible = false
  isReviewMode = true
  isSubmitting = false
  → Impossible states có thể xảy ra!

Dùng State Machine:
  type FormStep = 'personal' | 'address' | 'payment' | 'review' | 'success' | 'error'

  Transitions:
  personal  → address  (khi step 1 valid)
  address   → payment  (khi step 2 valid)
  payment   → review   (khi step 3 valid)
  review    → success  (khi submit OK)
  review    → error    (khi submit fail)
  error     → review   (retry)
  any       → personal (reset)
```

### Multi-Step Form State

```typescript
interface MultiStepFormState {
  currentStep: FormStep
  steps: {
    personal: PersonalData | null
    address: AddressData | null
    payment: PaymentData | null
  }
  errors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
  submitError: string | null
}
```

### Validation Layers

```
Layer 1: HTML5 native validation
  required, minLength, maxLength, pattern, type="email"
  → Instant, no JS needed
  → Customize với CSS :invalid

Layer 2: Sync validation (on blur)
  → Zod schema validation
  → Immediate feedback khi user rời field

Layer 3: Async validation (debounced, on blur)
  → Check email uniqueness: GET /api/check-email?email=...
  → Debounce 500ms để tránh quá nhiều requests
  → Show loading indicator trong field

Layer 4: Cross-field validation (on submit)
  → password === confirmPassword
  → endDate > startDate
  → Chỉ check khi user submit
```

### Conditional Steps

```typescript
const getVisibleSteps = (formData: FormData): FormStep[] => {
  const steps: FormStep[] = ['personal', 'address']

  // Conditional: chỉ show payment nếu không chọn "pay later"
  if (formData.paymentMethod !== 'pay_later') {
    steps.push('payment')
  }

  steps.push('review')
  return steps
}
```

### Draft Saving

```
Strategy 1: localStorage (đơn giản)
  → Lưu sau mỗi step hoặc debounced onChange
  → Restore khi user quay lại
  → Vấn đề: sensitive data (card number) không nên lưu localStorage

Strategy 2: Backend draft
  → POST /api/drafts → nhận draft_id
  → URL: /checkout?draft=abc123
  → User có thể tiếp tục trên device khác
  → Phức tạp hơn nhưng secure hơn

Strategy 3: Hybrid
  → Non-sensitive fields → localStorage
  → Payment info → không lưu, phải nhập lại
```

### UX Best Practices

| Pattern | Giải thích |
|---------|-----------|
| Inline validation | Hiện error ngay dưới field, không đợi submit |
| Progress indicator | "Step 2 of 4" hoặc progress bar |
| Preserve data khi back | Không xóa data khi user back về step trước |
| Disable submit khi invalid | Nhưng vẫn show tại sao disabled (tooltip) |
| Focus first error | Sau submit fail → auto focus field đầu tiên có error |
| Loading state | Disable form khi submitting, show spinner |
| Success feedback | Clear confirmation, next steps |

---

## PHẦN B: THINKING FRAMEWORKS

---

## 5. WHERE TO KEEP STATE AND WHY

> *"This is the question that separates engineers who just code from engineers who design."*

### Decision Framework

```
Khi gặp một piece of state, hỏi 5 câu:

1. Có cần share với component khác không?
   → Không: local useState
   → Có: tiếp tục...

2. Có cần persist qua page refresh không?
   → Không: in-memory state (Zustand, Context)
   → Có: tiếp tục...

3. Có cần shareable URL không?
   → Có: URL query params
   → Không: tiếp tục...

4. Có sensitive hay quá lớn cho URL không?
   → Không sensitive + nhỏ: URL
   → Sensitive hoặc lớn: localStorage / backend

5. Có cần sync across devices không?
   → Có: backend
   → Không: localStorage
```

### State Types và Nơi Lưu

```
┌──────────────────────────────────────────────────────────────┐
│  State Type          │ Nơi lưu          │ Ví dụ             │
├──────────────────────┼──────────────────┼───────────────────┤
│ Ephemeral UI state   │ useState          │ isOpen, hover     │
│ Shared UI state      │ Zustand/Context   │ cart, theme       │
│ Server data          │ TanStack Query    │ products, user    │
│ URL-shareable state  │ URL query params  │ filters, page     │
│ User preferences     │ localStorage      │ language, theme   │
│ Auth tokens          │ HttpOnly cookie   │ access_token      │
│ Critical user data   │ Backend           │ profile, orders   │
│ Form state           │ React Hook Form   │ inputs, errors    │
└──────────────────────┴──────────────────┴───────────────────┘
```

### Tại sao URL là "source of truth" tốt nhất cho filters?

```
Scenario: User đang xem /products?category=phone&price_max=5000000&page=3

URL state:
  ✅ User copy link → gửi cho bạn → bạn thấy đúng trang đó
  ✅ User back/forward → filters preserved
  ✅ User refresh → filters preserved
  ✅ SEO-friendly (nếu public page)
  ✅ Dễ debug (nhìn URL là biết state)

In-memory state:
  ❌ Refresh → mất filters
  ❌ Copy link → không share được state
  ❌ Back button → behavior không predictable
```

### Anti-patterns phổ biến

```
❌ Duplicate state:
  const [products, setProducts] = useState([])  // server data
  const [filteredProducts, setFilteredProducts] = useState([])  // derived

  → filteredProducts là derived state, không cần useState
  → Dùng useMemo: const filteredProducts = useMemo(() => filter(products), [products, filters])

❌ State quá cao trong tree:
  App → Page → Section → List → Item
  Đặt "selectedItemId" ở App level → mọi component re-render khi chọn item
  → Colocate state: đặt ở component thấp nhất có thể

❌ Server state trong client state:
  const [user, setUser] = useState(null)
  useEffect(() => { fetch('/api/user').then(setUser) }, [])
  → Không có caching, loading state, error handling, refetching
  → Dùng TanStack Query / SWR
```

---

## 6. HOW MANY NETWORK CALLS HAPPEN AND WHEN

> *"Senior engineers think about network calls before writing a single line of code."*

### Request Waterfall — Kẻ Thù Của Performance

```
Waterfall (BAD):
  Component A mount → fetch /user
                          ↓ (đợi)
                      Component B mount → fetch /products
                                              ↓ (đợi)
                                          Component C mount → fetch /cart
  Total time: 300ms + 200ms + 150ms = 650ms

Parallel (GOOD):
  Component A mount → fetch /user    ─┐
  Component A mount → fetch /products ─┼─ Promise.all()
  Component A mount → fetch /cart    ─┘
  Total time: max(300ms, 200ms, 150ms) = 300ms
```

### Phân loại Network Calls

```
1. CRITICAL PATH (block render):
   → Fetch trước khi render, hoặc SSR
   → Ví dụ: user profile, page data

2. SECONDARY (không block):
   → Fetch sau khi render, lazy
   → Ví dụ: recommendations, ads, analytics

3. PREFETCH (anticipatory):
   → Fetch trước khi user cần
   → Ví dụ: hover product → prefetch detail page
   → Ví dụ: page 1 loaded → prefetch page 2

4. ON-DEMAND (user triggered):
   → Chỉ fetch khi user action
   → Ví dụ: load more comments, expand section
```

### Strategies để Giảm Network Calls

**1. Request Deduplication**
```
Nhiều components cùng cần /api/user
→ TanStack Query tự động deduplicate: chỉ gửi 1 request
→ Tất cả subscribers nhận cùng data
```

**2. Batch Requests**
```
Thay vì:
  GET /api/user/1
  GET /api/user/2
  GET /api/user/3

Dùng:
  GET /api/users?ids=1,2,3
  → 1 request thay vì 3
```

**3. GraphQL / BFF (Backend for Frontend)**
```
Vấn đề REST: over-fetching (lấy nhiều hơn cần) và under-fetching (cần nhiều requests)

GraphQL: 1 query lấy đúng data cần
  query {
    user { name, avatar }
    cart { items { product { name, price }, quantity } }
    notifications(unread: true) { count }
  }
  → 1 request thay vì 3
```

**4. Caching Strategy**
```
Browser Cache (HTTP):
  Cache-Control: max-age=3600
  → Không gửi request nếu cache còn fresh

Application Cache (TanStack Query):
  staleTime: 5 * 60 * 1000  // 5 phút
  → Không refetch nếu data chưa stale

CDN Cache:
  Static assets → cache ở edge server
  → Giảm latency cho global users
```

**5. Prefetching**
```typescript
// Prefetch khi hover (300ms delay để tránh accidental hovers)
const handleMouseEnter = debounce(() => {
  queryClient.prefetchQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    staleTime: 5 * 60 * 1000
  })
}, 300)
```

### Câu hỏi hay gặp trong phỏng vấn

*"Design a page có 5 sections, mỗi section cần data khác nhau. Bạn fetch thế nào?"*

```
Trả lời theo 3 bước:

1. Phân loại: section nào critical (above the fold)?
   → Critical: fetch trước, có thể SSR
   → Non-critical: fetch lazy khi scroll đến

2. Parallel hay sequential?
   → Independent data → Promise.all() hoặc parallel queries
   → Dependent data (B cần ID từ A) → sequential, hoặc redesign API

3. Caching:
   → Shared data (user info) → 1 query, nhiều components subscribe
   → Page-specific data → cache với staleTime phù hợp
```

---

## 7. HOW TO BREAK FEATURES INTO COMPONENTS AND MODULES

### Tại sao quan trọng?

Đây là câu hỏi **"bạn có thể làm việc trong team không?"**. Code chạy được là 1 chuyện. Code người khác đọc được, maintain được, extend được là chuyện khác.

### 3 Levels of Decomposition

```
Level 1: UI Decomposition (nhìn thấy được)
  → Nhìn mockup → identify visual blocks
  → Mỗi block → 1 component

Level 2: Logic Decomposition (nhìn không thấy)
  → Tách business logic ra khỏi UI
  → Custom hooks, services, utilities

Level 3: Feature Decomposition (architectural)
  → Nhóm related components + logic + API thành 1 feature module
  → Feature có public API (index.ts)
```

### Ví dụ: Decompose Product Page

```
Mockup: Product page có header, gallery, info, reviews, recommendations

Step 1: UI Decomposition
  ProductPage
  ├── ProductHeader (breadcrumbs, share button)
  ├── ProductGallery (images, zoom, thumbnails)
  ├── ProductInfo
  │   ├── ProductTitle
  │   ├── ProductPrice (original, discounted, savings)
  │   ├── ProductVariants (size, color selector)
  │   ├── ProductQuantity
  │   └── AddToCartButton
  ├── ProductReviews
  │   ├── ReviewSummary (rating distribution)
  │   ├── ReviewList (infinite scroll)
  │   └── ReviewForm
  └── ProductRecommendations (lazy loaded)

Step 2: Logic Decomposition
  hooks/
  ├── useProductDetail(id)     → fetch + cache product data
  ├── useProductVariants()     → variant selection logic
  ├── useAddToCart()           → mutation + optimistic update
  └── useProductReviews(id)    → fetch + paginate reviews

Step 3: Feature Module
  features/product/
  ├── components/              → UI components
  ├── hooks/                   → logic hooks
  ├── api/                     → API calls
  ├── types/                   → TypeScript types
  └── index.ts                 → public API (export only what's needed)
```

### Rules để Biết Khi Nào Tách Component

```
Tách component khi:
  ✅ Component > 200-300 lines → khó đọc
  ✅ Logic có thể reuse ở nơi khác
  ✅ Phần này có thể lazy load (code splitting)
  ✅ Phần này có independent state
  ✅ Phần này cần test riêng

KHÔNG tách khi:
  ❌ Chỉ để "clean up" mà không có lý do rõ ràng
  ❌ Component quá nhỏ (3-5 lines) → overhead không đáng
  ❌ Tạo ra prop drilling phức tạp hơn
```

### Dependency Rules (Unidirectional)

```
ALLOWED:
  pages/ → features/ → shared/
  features/ → shared/
  shared/ → lib/ (utilities)

FORBIDDEN:
  shared/ → features/   (shared không biết về business logic)
  features/ → pages/    (features không biết về routing)
  lib/ → features/      (utilities không biết về app logic)

Tại sao?
  → Circular dependencies → build fails, testing nightmare
  → Predictable architecture → new team member hiểu ngay
  → Easier to extract → feature có thể move sang app khác
```

---

## PHẦN C: PERFORMANCE

---

## 8. CORE WEB VITALS

### 3 Metrics Quan Trọng Nhất (2024+)

```
┌─────────────────────────────────────────────────────────────┐
│  LCP — Largest Contentful Paint                              │
│  Đo: Thời gian render element lớn nhất visible trong viewport│
│  Target: < 2.5s (Good) | 2.5-4s (Needs work) | > 4s (Poor) │
│  Thường là: Hero image, H1, large text block                 │
├─────────────────────────────────────────────────────────────┤
│  INP — Interaction to Next Paint (thay FID từ 2024)         │
│  Đo: Độ trễ từ user interaction đến visual response         │
│  Target: < 200ms (Good) | 200-500ms (Needs work) | > 500ms  │
│  Thường bị vi phạm: Long tasks trên main thread             │
├─────────────────────────────────────────────────────────────┤
│  CLS — Cumulative Layout Shift                               │
│  Đo: Tổng lượng layout shift không mong đợi                 │
│  Target: < 0.1 (Good) | 0.1-0.25 (Needs work) | > 0.25     │
│  Thường gây ra: Images không có dimensions, dynamic content  │
└─────────────────────────────────────────────────────────────┘
```

### Fix LCP

```
1. Identify LCP element (Chrome DevTools → Performance → LCP)

2. Nếu là image:
   <img fetchpriority="high" src="hero.webp" alt="..." />
   → fetchpriority="high" nói browser load ngay, không đợi

3. Preload:
   <link rel="preload" as="image" href="hero.webp" />

4. Format: AVIF > WebP > JPEG
   <picture>
     <source srcset="hero.avif" type="image/avif" />
     <source srcset="hero.webp" type="image/webp" />
     <img src="hero.jpg" alt="..." />
   </picture>

5. CDN: serve từ edge server gần user

6. SSR/SSG: HTML có content sẵn, không đợi JS
```

### Fix INP

```
Nguyên nhân: Long tasks (> 50ms) trên main thread

1. Break long tasks:
   // BAD: 1 task dài 300ms
   processAllItems(items)  // blocks UI

   // GOOD: chia nhỏ
   for (const chunk of chunks(items, 50)) {
     await new Promise(r => setTimeout(r, 0))  // yield to browser
     processChunk(chunk)
   }

2. Web Workers:
   → Offload CPU-intensive work (image processing, data parsing)
   → Main thread free cho user interactions

3. React 18+ startTransition:
   startTransition(() => {
     setSearchResults(results)  // low-priority update
   })
   → User input không bị block bởi re-render

4. Debounce/Throttle event handlers
```

### Fix CLS

```
1. Explicit dimensions cho images/videos:
   <img width="800" height="600" src="..." />
   hoặc
   .image-container { aspect-ratio: 4/3; }

2. Reserve space cho dynamic content:
   .ad-slot { min-height: 250px; }

3. Font loading:
   font-display: swap  → FOUT (Flash of Unstyled Text) nhưng không shift
   font-display: optional  → Tốt nhất cho CLS

4. Skeleton screens:
   → Giữ chỗ cho content đang load
   → Dimensions phải match content thật
```

---

## 9. CODE SPLITTING AND LAZY LOADING

### Tại sao?

```
Không có code splitting:
  main.js = 3MB → User đợi 15s trên 3G → Bounce

Có code splitting:
  main.js = 200KB (chỉ code cần cho trang đầu)
  + home.js, product.js, cart.js (load khi cần)
  → User thấy content sau 2s
```

### Route-based Splitting (quan trọng nhất)

```typescript
// Mỗi route là 1 chunk riêng
const Home = lazy(() => import('./pages/Home'))
const ProductList = lazy(() => import('./pages/ProductList'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))

// Wrap với Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<ProductList />} />
    <Route path="/cart" element={<Cart />} />
  </Routes>
</Suspense>
```

### Component-based Splitting

```typescript
// Heavy components: chỉ load khi cần
const RichTextEditor = lazy(() => import('./components/RichTextEditor'))
const VideoPlayer = lazy(() => import('./components/VideoPlayer'))
const ChartDashboard = lazy(() => import('./components/ChartDashboard'))

// Conditional render
{isEditing && (
  <Suspense fallback={<EditorSkeleton />}>
    <RichTextEditor />
  </Suspense>
)}
```

### Library Splitting

```typescript
// BAD: import ngay lập tức (vào main bundle)
import { Chart } from 'chart.js'
import { io } from 'socket.io-client'

// GOOD: dynamic import khi cần
const loadChart = async () => {
  const { Chart } = await import('chart.js')
  return new Chart(...)
}

const connectSocket = async () => {
  const { io } = await import('socket.io-client')
  return io(socketUrl)
}
```

### Preloading (Predictive)

```typescript
// Preload khi user hover → instant navigation
const handleMouseEnter = () => {
  // Preload JS chunk
  import('./pages/ProductDetail')
  // Preload data
  queryClient.prefetchQuery(['product', id], fetchProduct)
}

<Link to={`/products/${id}`} onMouseEnter={handleMouseEnter}>
  {product.name}
</Link>
```

---

## 10. BUNDLE SIZE BASICS

### Nguyên tắc

```
1. Đo trước khi optimize
   → vite-bundle-visualizer, webpack-bundle-analyzer
   → Biết cái gì chiếm nhiều nhất

2. Dependencies là kẻ thù thầm lặng
   → Trước khi npm install: check bundlephobia.com
   → moment.js (67KB) → date-fns (13KB) hoặc dayjs (2KB)
   → lodash (70KB) → lodash-es + tree shaking, hoặc native JS

3. Tree shaking
   → Import named exports, không import default object
   → BAD:  import _ from 'lodash'
   → GOOD: import { debounce } from 'lodash-es'

4. Vendor chunking
   → Tách vendor code (react, react-dom) vào chunk riêng
   → User cache vendor chunk lâu dài (không thay đổi thường xuyên)
   → App code thay đổi thường → chunk riêng với content hash
```

### Bundle Size Budget

```
Gợi ý cho e-commerce web:
  Initial JS (gzipped):    < 150KB
  Per-route JS (gzipped):  < 50KB
  Total CSS (gzipped):     < 30KB
  Hero image:              < 200KB
  Total page weight:       < 1MB

Đo bằng:
  Lighthouse → Performance tab
  Chrome DevTools → Network tab → Disable cache → Reload
  CI/CD: bundlesize, size-limit package
```

---

## 11. MEMO, USECALLBACK, USEMEMO — KHI NÀO DÙNG, KHI NÀO KHÔNG

> *"The biggest mistake is adding memoization everywhere 'just in case'."*

### Nguyên tắc vàng: **Profile trước, optimize sau**

```
Quy trình đúng:
  1. Viết code đơn giản, không optimize
  2. Chạy app, cảm nhận performance
  3. Nếu có vấn đề → mở React DevTools Profiler
  4. Identify component re-render nhiều nhất
  5. Chỉ lúc đó mới thêm memoization

Quy trình sai:
  1. Wrap mọi thứ bằng memo/useCallback/useMemo "cho chắc"
  2. Code khó đọc, khó maintain
  3. Memoization overhead có thể còn tệ hơn re-render
```

### React.memo

```typescript
// Dùng khi:
// 1. Component render nhiều lần với cùng props
// 2. Component có expensive render (nhiều DOM nodes, complex logic)
// 3. Component là child của parent re-render thường xuyên

const ProductCard = React.memo(({ product, onAddToCart }) => {
  return (
    <div>
      <img src={product.image} />
      <h3>{product.name}</h3>
      <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
    </div>
  )
})

// KHÔNG dùng khi:
// - Component render nhanh (< 1ms)
// - Props thay đổi mỗi lần parent render anyway
// - Component ở leaf node với ít DOM
```

### useCallback

```typescript
// Dùng khi:
// 1. Function được pass vào React.memo component (cần stable reference)
// 2. Function trong useEffect dependency array

const Cart = () => {
  // ✅ Cần: onRemove pass vào CartItem (React.memo)
  const handleRemove = useCallback((itemId: string) => {
    removeItem(itemId)
  }, [removeItem])  // stable reference

  // ❌ Không cần: function chỉ dùng trong component này
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0)
  }

  return items.map(item => (
    <CartItem key={item.id} item={item} onRemove={handleRemove} />
  ))
}
```

### useMemo

```typescript
// Dùng khi:
// 1. Expensive computation (sort 10K items, complex filter, heavy transform)
// 2. Tạo object/array pass vào React.memo component

const ProductList = ({ products, filters }) => {
  // ✅ Cần: sort 10K products là expensive
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => b.sold - a.sold)
  }, [products])

  // ❌ Không cần: simple filter trên small array
  const activeItems = useMemo(() => {
    return items.filter(i => i.active)  // 5 items, instant
  }, [items])

  // ❌ Không cần: primitive value
  const total = useMemo(() => {
    return items.length  // không cần memo
  }, [items])
}
```

### React 19: Compiler thay đổi mọi thứ

```
React 19 Compiler tự động memoize:
  → Không cần viết useMemo/useCallback thủ công
  → Compiler phân tích code và tự quyết định

Ý nghĩa:
  → Viết code đơn giản, không cần nghĩ về memo
  → Compiler làm tốt hơn human trong hầu hết cases
  → Chỉ cần manual memo cho edge cases đặc biệt
```

---

## 12. SSR VS CSR TRADEOFFS

### Simple Decision Matrix

```
                    SEO     Speed   Interactivity   Server Cost
CSR (React SPA)     ❌ Kém  ❌ Chậm  ✅ Tốt          ✅ Thấp
SSR (Next.js)       ✅ Tốt  ✅ Nhanh ✅ Tốt           ❌ Cao
SSG (Static)        ✅ Tốt  ✅✅ Nhất ✅ Tốt           ✅✅ Thấp nhất
ISR (Incremental)   ✅ Tốt  ✅✅ Nhất ✅ Tốt           ✅ Thấp
```

### Khi Nào Dùng Cái Gì?

```
CSR (Vite + React):
  → Dashboard, admin panel (behind auth, no SEO)
  → Highly interactive app (real-time collaboration)
  → Khi không có budget cho server

SSR (Next.js App Router):
  → E-commerce product pages (SEO critical)
  → News/blog với dynamic content
  → Personalized pages (user-specific data)

SSG (Next.js static export, Astro):
  → Marketing/landing pages
  → Documentation
  → Blog với infrequent updates

ISR:
  → E-commerce với large catalog (10K+ products)
  → News archives
  → Content thay đổi nhưng không cần real-time
```

### Hydration — Cái Bẫy Hay Gặp

```
SSR flow:
  Server render HTML → Client nhận HTML → Hiển thị ngay (fast FCP)
  → Client download JS → React "hydrate" HTML
  → App trở nên interactive (TTI)

Vấn đề: Hydration mismatch
  → Server render khác client render → React throw error
  → Nguyên nhân: Date.now(), Math.random(), window object, browser-only APIs

Fix:
  → Không dùng browser-only APIs trong server-rendered components
  → useEffect cho browser-only code (chỉ chạy ở client)
  → suppressHydrationWarning cho dynamic content (dùng cẩn thận)
```

---

## TỔNG KẾT: GOAL CỦA EM

> *"If I design a feature on a whiteboard, it should look like something we can ship, not just fancy boxes."*

Đây là tiêu chí quan trọng nhất. Khi bạn vẽ diagram trong phỏng vấn, interviewer phải thấy:

| Interviewer thấy | Ý nghĩa |
|-----------------|---------|
| Bạn hỏi clarifying questions | Bạn không assume, bạn verify |
| Bạn đề cập error states | Bạn biết production không bao giờ happy path |
| Bạn nói về loading states | Bạn nghĩ về UX, không chỉ data |
| Bạn mention accessibility | Bạn build cho mọi người |
| Bạn discuss trade-offs | Bạn có engineering judgment |
| Bạn biết khi nào KHÔNG optimize | Bạn không over-engineer |
| Bạn nói về network calls | Bạn hiểu performance từ gốc |

---

## CHECKLIST TRƯỚC PHỎNG VẤN

### Nhỏ nhưng thực tế (practice designs)
- [ ] Tôi có thể design Toast system trong 15 phút không?
- [ ] Tôi có thể giải thích race condition trong Autocomplete không?
- [ ] Tôi có thể nói về Intersection Observer vs scroll event không?
- [ ] Tôi có thể design multi-step form với state machine không?

### Thinking frameworks
- [ ] Tôi có thể giải thích tại sao đặt state ở URL vs localStorage vs memory không?
- [ ] Tôi có thể identify waterfall requests và fix chúng không?
- [ ] Tôi có thể decompose một feature thành components + hooks + API không?

### Performance
- [ ] Tôi biết LCP, INP, CLS là gì và cách fix không?
- [ ] Tôi có thể giải thích code splitting và khi nào cần không?
- [ ] Tôi biết khi nào KHÔNG dùng useMemo/useCallback không?
- [ ] Tôi có thể giải thích SSR vs CSR với trade-offs không?

---

> **Lời khuyên cuối:** Engineering Manager nói *"keep your thinking clear"*.
> Trong phỏng vấn, clarity > completeness. Một design đơn giản được giải thích rõ ràng
> tốt hơn một design phức tạp được giải thích lộn xộn.
>
> Practice bằng cách nói to ra trong khi design — đó là cách interviewer đánh giá bạn.
