# FRONTEND SYSTEM DESIGN — THEO ENGINEERING MANAGER 12+ NĂM KINH NGHIỆM

> **Nguồn:** Bài chia sẻ trên LinkedIn của một Engineering Manager 12+ năm kinh nghiệm
>
> **Trích dẫn gốc:** _"This is where mid and senior levels are getting filtered now."_
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

> _"Goal: if I design a feature on a whiteboard, it should look like something we can ship, not just fancy boxes."_

---

## MỤC LỤC

| #                               | Chủ đề                                                                                                               | Loại         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ |
| **PHẦN A: PRACTICE DESIGNS**    |                                                                                                                      |              |
| 1                               | [Notification / Toast System](#1-notification--toast-system)                                                         | Small design |
| 2                               | [Search with Suggestions](#2-search-with-suggestions)                                                                | Small design |
| 3                               | [Carousel / Infinite Scroll](#3-carousel--infinite-scroll)                                                           | Small design |
| 4                               | [Form Flows with Complex Validation](#4-form-flows-with-complex-validation)                                          | Small design |
| **PHẦN B: THINKING FRAMEWORKS** |                                                                                                                      |              |
| 5                               | [Where to Keep State and Why](#5-where-to-keep-state-and-why)                                                        | Thinking     |
| 6                               | [How Many Network Calls Happen and When](#6-how-many-network-calls-happen-and-when)                                  | Thinking     |
| 7                               | [How to Break Features into Components and Modules](#7-how-to-break-features-into-components-and-modules)            | Thinking     |
| **PHẦN C: PERFORMANCE**         |                                                                                                                      |              |
| 8                               | [Core Web Vitals](#8-core-web-vitals)                                                                                | Performance  |
| 9                               | [Code Splitting and Lazy Loading](#9-code-splitting-and-lazy-loading)                                                | Performance  |
| 9.5                             | [Vendor Splitting — Chiến Lược Tách Chunk Nâng Cao](#95-vendor-splitting--chiến-lược-tách-chunk-nâng-cao)            | Performance  |
| 10                              | [Bundle Size Basics](#10-bundle-size-basics)                                                                         | Performance  |
| 11                              | [memo, useCallback, useMemo — Khi Nào Dùng, Khi Nào Không](#11-memo-usecallback-usememo--khi-nào-dùng-khi-nào-không) | Performance  |
| 12                              | [SSR vs CSR Tradeoffs](#12-ssr-vs-csr-tradeoffs)                                                                     | Performance  |

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
  id: string // uuid để identify
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number // ms, default 3000, 0 = không auto-dismiss
  action?: {
    // optional interactive button
    label: string
    onClick: () => void
  }
  createdAt: number // timestamp để sort
}

interface ToastState {
  toasts: Toast[]
  maxVisible: number // default 5
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
  if (toast.duration === 0) return // manual dismiss only

  const timer = setTimeout(() => {
    removeToast(toast.id)
  }, toast.duration ?? 3000)

  return () => clearTimeout(timer) // cleanup khi unmount
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

| Concern              | Solution                                              |
| -------------------- | ----------------------------------------------------- |
| Animation            | CSS transitions, `framer-motion` AnimatePresence      |
| Stacking order       | Newest on top (prepend) hoặc bottom (append)          |
| Mobile               | Full-width bottom sheet thay vì corner toast          |
| Pause on hover       | Clear timer khi hover, restart khi leave              |
| Reduced motion       | `prefers-reduced-motion` → disable animations         |
| Duplicate prevention | Hash message → skip nếu identical toast đang hiển thị |

### Câu hỏi interviewer hay hỏi thêm

- _"Nếu user offline và có 10 actions pending, toast hiển thị thế nào?"_
  → Queue với "offline" indicator, flush khi online lại
- _"Làm sao test toast system?"_
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
  category?: string // "Product", "Brand", "Category"
  icon?: string
  url?: string // direct navigation
}

interface AutocompleteState {
  query: string
  suggestions: Suggestion[]
  activeIndex: number // -1 = none selected
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
        signal: abortRef.current.signal,
      })
      const data = await res.json()

      // Lưu vào cache
      cache.current.set(normalized, data.suggestions)
      return data.suggestions
    } catch (err) {
      if (err.name === 'AbortError') return // Bỏ qua, request bị cancel
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

<ul id="suggestions-listbox" role="listbox">
  <li id="suggestion-0" role="option" aria-selected="false">Shopee</li>
  <li id="suggestion-1" role="option" aria-selected="false">Shopee Mall</li>
  <li id="suggestion-2" role="option" aria-selected="true">Shopee Pay</li>
</ul>
```

### Performance Optimizations

| Optimization               | Giải thích                           |
| -------------------------- | ------------------------------------ |
| Debounce 200-300ms         | Giảm số requests                     |
| Min query length (2 chars) | Tránh quá nhiều results              |
| In-memory LRU cache        | Instant results cho repeated queries |
| AbortController            | Cancel stale requests                |
| Virtualize suggestions     | Nếu list > 100 items                 |
| Highlight matching text    | UX tốt hơn, dùng `<mark>` tag        |

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
  src="{isNearCurrent"
  ?
  slide.url
  :
  undefined}
  loading="lazy"
  decoding="async"
  alt="{slide.alt}"
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
<div role="region" aria-label="Product images" aria-roledescription="carousel">
  <div role="group" aria-roledescription="slide" aria-label="Slide 1 of 5">
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
      rootMargin: '200px', // Trigger 200px trước khi sentinel visible
      threshold: 0,
    },
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

| Pattern                    | Giải thích                                           |
| -------------------------- | ---------------------------------------------------- |
| Inline validation          | Hiện error ngay dưới field, không đợi submit         |
| Progress indicator         | "Step 2 of 4" hoặc progress bar                      |
| Preserve data khi back     | Không xóa data khi user back về step trước           |
| Disable submit khi invalid | Nhưng vẫn show tại sao disabled (tooltip)            |
| Focus first error          | Sau submit fail → auto focus field đầu tiên có error |
| Loading state              | Disable form khi submitting, show spinner            |
| Success feedback           | Clear confirmation, next steps                       |

---

## PHẦN B: THINKING FRAMEWORKS

---

## 5. WHERE TO KEEP STATE AND WHY

> _"This is the question that separates engineers who just code from engineers who design."_

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

> _"Senior engineers think about network calls before writing a single line of code."_

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
    staleTime: 5 * 60 * 1000,
  })
}, 300)
```

### Câu hỏi hay gặp trong phỏng vấn

_"Design a page có 5 sections, mỗi section cần data khác nhau. Bạn fetch thế nào?"_

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

---

### Tổng quan các Pattern trong Shopee Web

Dự án shopee-web sử dụng **5 pattern** Lazy Loading + Code Splitting kết hợp nhau:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHOPEE-WEB LAZY LOADING MAP                      │
│                                                                     │
│  1. ROUTE-BASED SPLITTING   ←── useRouteElements.tsx               │
│     Layouts + Pages đều lazy                                        │
│                                                                     │
│  2. COMPONENT-BASED SPLITTING ←── App.tsx, MainLayout.tsx          │
│     Heavy widgets: Chatbot, SellerDashboard, BackToTop, ...         │
│                                                                     │
│  3. VENDOR CHUNK SPLITTING  ←── vite.config.ts (manualChunks)      │
│     react-vendor, motion-vendor, form-vendor, http-vendor, ...      │
│                                                                     │
│  4. DEV-ONLY SPLITTING      ←── main.tsx                           │
│     ReactQueryDevtools chỉ load trong development                   │
│                                                                     │
│  5. IMAGE LAZY LOADING      ←── OptimizedImage.tsx                 │
│     loading="lazy" + IntersectionObserver + skeleton                │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Pattern 1: Route-based Splitting (quan trọng nhất)

**File:** `useRouteElements.tsx`

Đây là pattern quan trọng nhất — mỗi **page** và **layout** đều là một chunk riêng biệt.

```typescript
// useRouteElements.tsx — Lazy load TOÀN BỘ layouts và pages

// ─── Lazy load Layouts ───────────────────────────────────────────
const MainLayout = lazy(() => import('./layouts/MainLayout'))
const RegisterLayout = lazy(() => import('./layouts/RegisterLayout'))
const CartLayout = lazy(() => import('./layouts/CartLayout'))
const UserLayout = lazy(() => import('./pages/User/layouts/UserLayout'))

// ─── Lazy load Pages ─────────────────────────────────────────────
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const ProductList = lazy(() => import('./pages/ProductList'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Compare = lazy(() => import('./pages/Compare'))
// ... và tất cả User sub-pages
const Profile = lazy(() => import('./pages/User/pages/Profile'))
const ChangePassword = lazy(() => import('./pages/User/pages/ChangePassword'))
const HistoryPurchases = lazy(() => import('./pages/User/pages/HistoryPurchases'))
const OrderList = lazy(() => import('./pages/User/pages/OrderList'))
const OrderDetail = lazy(() => import('./pages/User/pages/OrderDetail'))
const MyVouchers = lazy(() => import('./pages/User/pages/MyVouchers'))
const DailyCheckInPage = lazy(() => import('./pages/User/pages/DailyCheckIn'))
const AddressBook = lazy(() => import('./pages/User/pages/AddressBook'))
const Notifications = lazy(() => import('./pages/User/pages/Notifications'))
const ConversationHistory = lazy(() => import('./pages/User/pages/ConversationHistory'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'))
```

**Điểm đặc biệt: Nested Suspense (2 lớp)**

Dự án dùng **nested Suspense** cho các route cần layout lồng nhau — layout load trước, page load sau:

```typescript
// Cart route — 2 lớp Suspense
{
  path: path.cart,
  element: (
    <Suspense fallback={<Loader />}>   {/* ← Layout Suspense */}
      <CartLayout>
        <Suspense fallback={<Loader />}>  {/* ← Page Suspense */}
          <Cart />
        </Suspense>
      </CartLayout>
    </Suspense>
  ),
}

// User sub-routes — 3 lớp Suspense
{
  path: path.user,
  element: (
    <Suspense fallback={<Loader />}>   {/* ← MainLayout Suspense */}
      <MainLayout />
    </Suspense>
  ),
  children: [{
    path: '',
    element: (
      <Suspense fallback={<Loader />}>  {/* ← UserLayout Suspense */}
        <UserLayout />
      </Suspense>
    ),
    children: [{
      path: path.profile,
      element: (
        <Suspense>                       {/* ← Page Suspense (no fallback = silent) */}
          <Profile />
        </Suspense>
      ),
    }]
  }]
}
```

> **Tại sao nested Suspense?**
> Layout (MainLayout, CartLayout) là shell UI — load trước, hiển thị Header/Footer ngay.
> Page content (Cart, Profile) load sau — user thấy skeleton thay vì blank screen.
> Nếu chỉ dùng 1 Suspense bọc tất cả → Header cũng bị ẩn trong lúc page load.

**Fallback strategy:**

| Route group                                     | Fallback                                |
| ----------------------------------------------- | --------------------------------------- |
| Public pages (Home, ProductList, ProductDetail) | `<Loader />` — spinner toàn trang       |
| Protected pages (Cart, Checkout, Wishlist)      | `<Loader />` — spinner toàn trang       |
| User sub-pages (Profile, ChangePassword, ...)   | `<Suspense>` không có fallback (silent) |
| 404 NotFound                                    | `<Suspense>` không có fallback          |

---

### Pattern 2: Component-based Splitting

**Files:** `App.tsx`, `MainLayout.tsx`, `CartLayout.tsx`

Heavy components không cần thiết ngay khi trang load được tách riêng.

**App.tsx — Global widgets:**

```typescript
// App.tsx — Lazy load 3 heavy widgets hiển thị trên mọi trang

// Chatbot AI widget — heavy, chỉ cần sau khi page render xong
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'))

// Seller Dashboard Panel — chỉ dùng cho Admin, không cần cho user thường
const SellerDashboardPanel = lazy(
  () => import('./components/SellerDashboardPanel/SellerDashboardPanel')
)

// PWA Install Prompt — chỉ hiện khi browser support PWA
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt'))

// Render với fallback={null} → không hiện gì khi đang load
// Tránh layout shift
return (
  <>
    {routeElements}
    <Suspense fallback={null}><ChatbotWidget /></Suspense>
    <Suspense fallback={null}><SellerDashboardPanel /></Suspense>
    <Suspense fallback={null}><PWAInstallPrompt /></Suspense>
  </>
)
```

**MainLayout.tsx — Layout-level widgets:**

```typescript
// MainLayout.tsx — Lazy load UI widgets không cần thiết ngay lập tức

const CompareFloatingBar = lazy(() => import('src/components/CompareFloatingBar'))
const ConnectionStatus   = lazy(() => import('src/components/ConnectionStatus'))
const BackToTop          = lazy(() => import('src/components/BackToTop'))

return (
  <div>
    <Header />
    <Suspense fallback={null}><ConnectionStatus /></Suspense>  {/* Banner mất kết nối */}
    <PageTransition>
      <Outlet />
    </PageTransition>
    <Footer />
    <Suspense fallback={null}><CompareFloatingBar /></Suspense>  {/* Floating bar so sánh */}
    <Suspense fallback={null}><BackToTop /></Suspense>           {/* Nút cuộn lên đầu */}
  </div>
)
```

**CartLayout.tsx — Consistent pattern:**

```typescript
// CartLayout.tsx — Áp dụng cùng pattern với MainLayout
const BackToTop = lazy(() => import('src/components/BackToTop'))

return (
  <div>
    <CartHeader />
    <PageTransition>{children}</PageTransition>
    <Footer />
    <Suspense fallback={null}><BackToTop /></Suspense>
  </div>
)
```

> **Tại sao `fallback={null}` cho widgets?**
> Floating widgets (BackToTop, ChatbotWidget, CompareFloatingBar) là **enhancement**, không phải core UI.
> Nếu dùng `<Loader />` → spinner xuất hiện ở góc màn hình → confusing UX.
> `fallback={null}` → widget xuất hiện silently khi load xong → không gây distraction.

---

### Pattern 3: Vendor Chunk Splitting (Vite manualChunks)

**File:** `vite.config.ts`

Code splitting ở level build tool — tách vendor libraries thành các chunk riêng để browser cache hiệu quả.

```typescript
// vite.config.ts — rollupOptions.output.manualChunks
manualChunks(id) {
  // React core — load đầu tiên, cache lâu nhất
  if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
    return 'react-vendor'       // react-vendor.[hash].js
  }
  // Router + URL state
  if (id.includes('node_modules/react-router') || id.includes('node_modules/nuqs')) {
    return 'router-vendor'      // router-vendor.[hash].js
  }
  // Animation library — dùng trong 82+ files, tách riêng để không bloat app chunk
  if (id.includes('node_modules/framer-motion')) {
    return 'motion-vendor'      // motion-vendor.[hash].js
  }
  // UI component library
  if (id.includes('node_modules/@heroui/')) {
    return 'heroui-vendor'      // heroui-vendor.[hash].js
  }
  // Form validation
  if (id.includes('node_modules/react-hook-form') ||
      id.includes('node_modules/@hookform/') ||
      id.includes('node_modules/zod')) {
    return 'form-vendor'        // form-vendor.[hash].js
  }
  // HTTP + data fetching (exclude devtools để tránh circular deps)
  if (id.includes('node_modules/axios') ||
      (id.includes('node_modules/@tanstack/react-query') && !id.includes('devtools'))) {
    return 'http-vendor'        // http-vendor.[hash].js
  }
  // Drag & Drop
  if (id.includes('node_modules/@dnd-kit/')) {
    return 'dnd-vendor'         // dnd-vendor.[hash].js
  }
  // Internationalization
  if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
    return 'i18n-vendor'        // i18n-vendor.[hash].js
  }
  // Tooltip/Popover positioning
  if (id.includes('node_modules/@floating-ui/')) {
    return 'floating-vendor'    // floating-vendor.[hash].js
  }
  // Toast
  if (id.includes('node_modules/react-toastify')) {
    return 'toast-vendor'       // toast-vendor.[hash].js
  }
  // Misc: SEO, sanitization
  if (id.includes('node_modules/react-helmet-async') ||
      id.includes('node_modules/dompurify') ||
      id.includes('node_modules/html-to-text')) {
    return 'misc-vendor'        // misc-vendor.[hash].js
  }
  // Utilities
  if (id.includes('node_modules/classnames') ||
      id.includes('node_modules/immer') ||
      id.includes('node_modules/date-fns')) {
    return 'utils-vendor'       // utils-vendor.[hash].js
  }
  // socket.io, devtools, ... → default chunks (Rollup tự quyết định)
}
```

**Tại sao tách vendor chunks?**

```
Không tách:
  app.js = 3MB (app code + react + framer-motion + axios + ...)
  → Mỗi lần deploy: user re-download toàn bộ 3MB

Có tách:
  react-vendor.[hash].js     → cache 1 năm (không đổi)
  motion-vendor.[hash].js    → cache 1 năm (không đổi)
  http-vendor.[hash].js      → cache 1 năm (không đổi)
  app.[new-hash].js          → chỉ file này thay đổi khi deploy
  → User chỉ download lại app chunk (~50-100KB) khi có update
```

**Kết quả build (ví dụ):**

```
dist/assets/
  react-vendor.[hash].js      ~140KB (gzipped ~45KB)
  motion-vendor.[hash].js     ~95KB  (gzipped ~30KB)
  http-vendor.[hash].js       ~80KB  (gzipped ~25KB)
  router-vendor.[hash].js     ~40KB  (gzipped ~13KB)
  form-vendor.[hash].js       ~35KB  (gzipped ~11KB)
  i18n-vendor.[hash].js       ~30KB  (gzipped ~10KB)
  heroui-vendor.[hash].js     ~60KB  (gzipped ~18KB)
  app.[hash].js               ~80KB  (gzipped ~25KB)  ← chỉ cái này thay đổi khi deploy
  home.[hash].js              ~20KB  (gzipped ~6KB)   ← route chunk
  product-list.[hash].js      ~25KB  (gzipped ~8KB)   ← route chunk
  ...
```

---

### Pattern 4: Dev-only Splitting

**File:** `main.tsx`

Tách tools chỉ dùng trong development ra khỏi production bundle.

```typescript
// main.tsx — ReactQueryDevtools chỉ load trong development

// Lazy load với named export extraction
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,  // extract named export thành default
  }))
)

// Chỉ render trong DEV — import.meta.env.DEV = false trong production build
{import.meta.env.DEV && (
  <Suspense fallback={null}>
    <ReactQueryDevtools initialIsOpen={false} />
  </Suspense>
)}
```

> **Tại sao cần lazy ở đây?**
> Dù `import.meta.env.DEV` = false trong production, Vite vẫn có thể include module nếu import tĩnh.
> Dùng `lazy()` + conditional render → Vite tree-shakes toàn bộ devtools khỏi production bundle.
> Kết quả: production bundle nhỏ hơn ~100KB.

---

### Pattern 5: Image Lazy Loading

**File:** `OptimizedImage.tsx`

Lazy loading cho images sử dụng HTML native `loading="lazy"` + skeleton placeholder.

```typescript
// OptimizedImage.tsx — Image lazy loading với skeleton

export default function OptimizedImage({
  src,
  alt,
  loading = 'lazy',    // ← default là lazy cho tất cả images
  showSkeleton = true, // ← hiện skeleton khi đang load
  blurPlaceholder = true,
  webpSrc,             // ← support modern formats
  avifSrc,
  ...
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<ImageState>('loading')

  // Check browser cache — nếu đã cache thì skip skeleton
  useEffect(() => {
    const img = new Image()
    img.src = src
    if (img.complete && img.naturalWidth > 0) {
      setImageState('loaded')  // ← already cached, no skeleton needed
      return
    }
    setImageState('loading')
  }, [src])

  // Skeleton khi đang load
  const renderSkeleton = () =>
    showSkeleton && isLoading ? (
      <div className="absolute inset-0 animate-pulse rounded-sm bg-gray-200" />
    ) : null

  // Support <picture> với multiple formats (avif > webp > jpg fallback)
  if (webpSrc || avifSrc) {
    return (
      <picture>
        {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img src={src} loading={loading} ... />
      </picture>
    )
  }

  return <img src={src} loading={loading} ... />
}
```

**Sử dụng trong Home.tsx:**

```typescript
// Home.tsx — Tất cả product images đều lazy load
<OptimizedImage
  src={product.image}
  alt={product.name}
  className="h-40 w-full"
  loading="lazy"        // ← browser chỉ load khi image vào viewport
  showSkeleton={true}   // ← hiện skeleton trước khi image load xong
/>
```

---

### Pattern 6: LazyMotion (Framer Motion Code Splitting)

**File:** `main.tsx`

Framer Motion cung cấp `LazyMotion` để chỉ load animation features khi cần.

```typescript
// main.tsx — LazyMotion với domAnimation feature set
import { domAnimation, LazyMotion } from 'framer-motion'

<LazyMotion features={domAnimation}>
  <App />
</LazyMotion>
```

> **`domAnimation` vs `domMax`:**
>
> - `domAnimation` (~15KB gzipped): animations cơ bản — translate, scale, opacity, rotate
> - `domMax` (~25KB gzipped): thêm drag, layout animations, advanced gestures
>   Dự án dùng `domAnimation` — đủ cho tất cả animations hiện tại, tiết kiệm ~10KB.

---

### Tổng kết: Toàn bộ Pattern trong Shopee Web

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FILE                  │  PATTERN                │  MỤC ĐÍCH                │
├──────────────────────────────────────────────────────────────────────────────┤
│  useRouteElements.tsx  │  Route-based splitting  │  Mỗi page = 1 chunk      │
│                        │  Nested Suspense        │  Layout load trước page  │
├──────────────────────────────────────────────────────────────────────────────┤
│  App.tsx               │  Component splitting    │  ChatBot, PWA, Seller    │
│                        │  fallback={null}        │  Silent load cho widgets │
├──────────────────────────────────────────────────────────────────────────────┤
│  MainLayout.tsx        │  Component splitting    │  BackToTop, Compare bar  │
│  CartLayout.tsx        │  fallback={null}        │  Connection status       │
├──────────────────────────────────────────────────────────────────────────────┤
│  vite.config.ts        │  Vendor chunk splitting │  12 vendor chunks        │
│                        │  manualChunks           │  Browser cache hiệu quả  │
├──────────────────────────────────────────────────────────────────────────────┤
│  main.tsx              │  Dev-only splitting     │  DevTools khỏi prod      │
│                        │  LazyMotion             │  Framer Motion nhỏ hơn   │
├──────────────────────────────────────────────────────────────────────────────┤
│  OptimizedImage.tsx    │  Image lazy loading     │  loading="lazy" native   │
│                        │  Skeleton placeholder   │  Cache detection         │
│                        │  <picture> multi-format │  avif > webp > jpg       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Fallback Strategy Summary:**

```
Fallback = <Loader />   → Page-level routes (user thấy spinner, biết đang load)
Fallback = null         → Floating widgets (silent load, không gây layout shift)
Fallback = <Suspense>   → User sub-pages (silent, layout đã có sẵn từ UserLayout)
```

---

### Route-based Splitting (quan trọng nhất) — Lý thuyết tổng quát

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

### Component-based Splitting — Lý thuyết tổng quát

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

### Library Splitting — Lý thuyết tổng quát

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

## 9.5. VENDOR SPLITTING — CHIẾN LƯỢC TÁCH CHUNK NÂNG CAO

> **Vendor Splitting** là một nhánh chuyên biệt của Code Splitting — thay vì tách theo route hay component, ta tách theo **nguồn gốc code**: code của mình (app code) vs code của thư viện bên thứ ba (vendor code). Đây là kỹ thuật tối ưu **browser cache** quan trọng nhất trong production.

---

### Tại sao Vendor Splitting quan trọng hơn bạn nghĩ?

**Vấn đề cốt lõi:** App code và vendor code có **vòng đời thay đổi hoàn toàn khác nhau**.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    VÒNG ĐỜI THAY ĐỔI CỦA CODE                       │
│                                                                      │
│  Vendor code (react, axios, framer-motion...)                        │
│  ──────────────────────────────────────────────────────────────────  │
│  v18.2.0   v18.2.0   v18.2.0   v18.2.0   v18.2.0   v18.3.0         │
│  deploy1   deploy2   deploy3   deploy4   deploy5   deploy6           │
│  │         │         │         │         │         │                 │
│  └─────────┴─────────┴─────────┴─────────┘         └── thay đổi     │
│  ← 5 lần deploy, vendor KHÔNG đổi →                                 │
│                                                                      │
│  App code (pages, components, business logic...)                     │
│  ──────────────────────────────────────────────────────────────────  │
│  v1.0      v1.1      v1.2      v1.3      v1.4      v1.5             │
│  deploy1   deploy2   deploy3   deploy4   deploy5   deploy6           │
│  │         │         │         │         │         │                 │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴── thay đổi     │
│  ← Mỗi lần deploy, app code ĐỀU đổi →                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Kết luận:** Nếu trộn lẫn vendor + app code vào 1 file → mỗi lần deploy user phải re-download **cả vendor lẫn app**, dù vendor không hề thay đổi.

---

### Cơ chế: Content Hash + HTTP Cache

Vendor Splitting hoạt động nhờ kết hợp **content-based hashing** và **HTTP Cache-Control**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CƠ CHẾ HOẠT ĐỘNG                                  │
│                                                                      │
│  BUILD TIME:                                                         │
│  Vite hash file theo nội dung:                                       │
│    react-vendor.abc123.js  ← hash = "abc123" (từ nội dung file)     │
│    app.xyz789.js           ← hash = "xyz789"                        │
│                                                                      │
│  DEPLOY 1 (user lần đầu vào):                                        │
│    Browser download: react-vendor.abc123.js ✓                       │
│    Browser download: app.xyz789.js ✓                                 │
│    Cache-Control: max-age=31536000 (1 năm)                           │
│    → Browser lưu cả 2 vào cache                                      │
│                                                                      │
│  DEPLOY 2 (chỉ app code thay đổi):                                   │
│    react-vendor.abc123.js → HASH KHÔNG ĐỔI                          │
│    app.def456.js          → HASH MỚI (nội dung đổi)                 │
│                                                                      │
│    Browser check cache:                                              │
│    react-vendor.abc123.js → CÓ trong cache → SKIP download ✓        │
│    app.def456.js          → KHÔNG có trong cache → DOWNLOAD ✓       │
│                                                                      │
│  KẾT QUẢ: User chỉ download ~80KB thay vì 3MB                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Hai cách implement Vendor Splitting trong Vite/Rollup

**Cách 1: Static object (đơn giản, phù hợp dự án nhỏ)**

```typescript
// vite.config.ts — Static manualChunks
rollupOptions: {
  output: {
    manualChunks: {
      'react-vendor': ['react', 'react-dom'],
      'router-vendor': ['react-router'],
      'ui-vendor': ['@heroui/system', 'framer-motion'],
      'query-vendor': ['@tanstack/react-query', 'axios'],
      'form-vendor': ['react-hook-form', 'zod'],
      'i18n-vendor': ['i18next', 'react-i18next'],
    }
  }
}
```

> **Nhược điểm:** Không linh hoạt — phải biết trước tên package. Nếu package A import package B mà B không được khai báo trong cùng chunk, Rollup có thể tạo circular dependency hoặc duplicate module.

**Cách 2: Function (linh hoạt, phù hợp dự án lớn — cách dự án shopee-web dùng)**

```typescript
// vite.config.ts — Function-based manualChunks
rollupOptions: {
  output: {
    manualChunks(id) {
      // id = đường dẫn tuyệt đối của module
      // VD: "/Users/.../node_modules/react/index.js"

      // Kiểm tra theo path pattern thay vì tên package cứng
      if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
        return 'react-vendor'
      }
      if (id.includes('node_modules/framer-motion')) {
        return 'motion-vendor'
      }
      // ...
      // Nếu return undefined → Rollup tự quyết định chunk
    }
  }
}
```

> **Ưu điểm:** Linh hoạt hơn — có thể dùng regex, điều kiện phức tạp. Xử lý được edge cases như exclude devtools khỏi http-vendor chunk (tránh circular deps).

---

### Chiến lược phân nhóm Vendor Chunks

Không phải cứ mỗi library là 1 chunk — cần **cân bằng** giữa số lượng HTTP requests và cache granularity:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CHIẾN LƯỢC PHÂN NHÓM                              │
│                                                                      │
│  QUÁ NHIỀU CHUNK (anti-pattern):                                     │
│    react.js, react-dom.js, react-router.js, axios.js,               │
│    react-query.js, zod.js, react-hook-form.js, ...                  │
│    → 20+ HTTP requests → HTTP/1.1 bị nghẽn                          │
│    → HTTP/2 OK nhưng overhead header vẫn tốn                        │
│                                                                      │
│  QUÁ ÍT CHUNK (anti-pattern):                                        │
│    vendor.js = react + framer-motion + heroui + axios + ...          │
│    → 1 request nhưng 2MB → cache miss = re-download 2MB             │
│                                                                      │
│  BALANCED (best practice — shopee-web approach):                     │
│    Nhóm theo: tần suất thay đổi + kích thước + dependency graph     │
│    react-vendor   → ít thay đổi nhất, nhỏ, core                     │
│    motion-vendor  → ít thay đổi, lớn (95KB), dùng khắp nơi         │
│    http-vendor    → ít thay đổi, medium, critical path              │
│    form-vendor    → ít thay đổi, chỉ dùng ở form pages             │
│    i18n-vendor    → ít thay đổi, medium                             │
│    ...                                                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Tiêu chí quyết định nhóm một library vào chunk riêng:**

| Tiêu chí        | Nên tách riêng     | Nên gộp chung       |
| --------------- | ------------------ | ------------------- |
| Kích thước      | > 30KB gzipped     | < 10KB gzipped      |
| Tần suất dùng   | Dùng ở nhiều pages | Chỉ dùng 1-2 pages  |
| Tần suất update | Hiếm khi update    | Update thường xuyên |
| Dependency      | Độc lập            | Phụ thuộc lẫn nhau  |

---

### Vendor Splitting trong Shopee Web — Phân tích từng chunk

```
┌──────────────────────────────────────────────────────────────────────┐
│  CHUNK            │ LIBRARIES                    │ LÝ DO TÁCH RIÊNG  │
├──────────────────────────────────────────────────────────────────────┤
│  react-vendor     │ react, react-dom             │ Core runtime,      │
│                   │                              │ cực kỳ stable,     │
│                   │                              │ load đầu tiên      │
├──────────────────────────────────────────────────────────────────────┤
│  router-vendor    │ react-router, nuqs           │ Routing + URL      │
│                   │                              │ state, load sớm    │
├──────────────────────────────────────────────────────────────────────┤
│  motion-vendor    │ framer-motion                │ Dùng trong 82+     │
│                   │                              │ files, ~95KB,      │
│                   │                              │ tách để không      │
│                   │                              │ bloat app chunk    │
├──────────────────────────────────────────────────────────────────────┤
│  heroui-vendor    │ @heroui/*                    │ UI lib, lớn,       │
│                   │                              │ stable             │
├──────────────────────────────────────────────────────────────────────┤
│  http-vendor      │ axios,                       │ Critical path —    │
│                   │ @tanstack/react-query        │ mọi page đều cần   │
│                   │ (exclude devtools!)          │ fetch data         │
├──────────────────────────────────────────────────────────────────────┤
│  form-vendor      │ react-hook-form,             │ Chỉ load ở pages   │
│                   │ @hookform/resolvers, zod     │ có form (Login,    │
│                   │                              │ Register, Profile) │
├──────────────────────────────────────────────────────────────────────┤
│  i18n-vendor      │ i18next, react-i18next       │ Internationali-    │
│                   │                              │ zation, stable     │
├──────────────────────────────────────────────────────────────────────┤
│  dnd-vendor       │ @dnd-kit/*                   │ Drag & Drop,       │
│                   │                              │ chỉ dùng ở         │
│                   │                              │ specific pages     │
├──────────────────────────────────────────────────────────────────────┤
│  floating-vendor  │ @floating-ui/*               │ Tooltip/Popover    │
│                   │                              │ positioning        │
├──────────────────────────────────────────────────────────────────────┤
│  toast-vendor     │ react-toastify               │ Notification UI    │
├──────────────────────────────────────────────────────────────────────┤
│  misc-vendor      │ react-helmet-async,          │ SEO + sanitization │
│                   │ dompurify, html-to-text      │ nhóm lại vì nhỏ   │
├──────────────────────────────────────────────────────────────────────┤
│  utils-vendor     │ classnames, immer, date-fns  │ Utilities nhỏ,     │
│                   │                              │ không có React dep │
├──────────────────────────────────────────────────────────────────────┤
│  (default)        │ socket.io, devtools, ...     │ Rollup tự quyết    │
│                   │                              │ định — ít dùng     │
└──────────────────────────────────────────────────────────────────────┘
```

**Chú ý đặc biệt — tại sao exclude `devtools` khỏi `http-vendor`:**

```typescript
// ĐÚNG:
if (
  id.includes('node_modules/axios') ||
  (id.includes('node_modules/@tanstack/react-query') && !id.includes('devtools'))
) {
  return 'http-vendor'
}

// SAI (nếu include devtools):
// @tanstack/react-query-devtools import từ @tanstack/react-query
// → Circular dependency: http-vendor → devtools → http-vendor
// → Rollup warning hoặc duplicate module
```

---

### Vendor Splitting vs Code Splitting — Phân biệt rõ ràng

```
┌──────────────────────────────────────────────────────────────────────┐
│              CODE SPLITTING vs VENDOR SPLITTING                      │
│                                                                      │
│  CODE SPLITTING                  VENDOR SPLITTING                    │
│  ─────────────────────────────   ──────────────────────────────────  │
│  Mục tiêu: Giảm initial load     Mục tiêu: Tối ưu browser cache     │
│  Tách theo: Route / Component    Tách theo: Nguồn gốc (app/vendor)  │
│  Trigger: User navigation        Trigger: Build time                 │
│  Kỹ thuật: React.lazy()         Kỹ thuật: manualChunks              │
│  Benefit: Faster FCP/LCP        Benefit: Faster repeat visits       │
│                                                                      │
│  Ví dụ:                          Ví dụ:                              │
│  Home.js → load khi vào /        react-vendor.js → cache 1 năm     │
│  Cart.js → load khi vào /cart    motion-vendor.js → cache 1 năm    │
│                                                                      │
│  DÙNG KẾT HỢP:                                                       │
│  Code Splitting → giảm lượng JS cần load lần đầu                    │
│  Vendor Splitting → tối ưu cache cho các lần visit sau              │
│  → Cả hai cùng nhau = tốt nhất                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### HTTP Caching Headers — Nền tảng của Vendor Splitting

Vendor Splitting chỉ có giá trị khi server cấu hình đúng HTTP cache headers:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HTTP CACHE STRATEGY                               │
│                                                                      │
│  Vendor chunks (hash trong tên file):                                │
│  Cache-Control: public, max-age=31536000, immutable                  │
│  ↑ 1 năm, immutable = browser không cần revalidate                   │
│                                                                      │
│  App chunks (hash trong tên file):                                   │
│  Cache-Control: public, max-age=31536000, immutable                  │
│  ↑ Cũng 1 năm — nhưng hash thay đổi mỗi deploy                      │
│  → URL mới = browser coi là file mới = download lại                  │
│                                                                      │
│  index.html (KHÔNG có hash):                                         │
│  Cache-Control: no-cache, no-store                                   │
│  ↑ Luôn fetch mới — để browser biết hash mới nhất                    │
│                                                                      │
│  FLOW:                                                               │
│  1. Browser fetch index.html (no-cache) → luôn mới nhất             │
│  2. index.html reference react-vendor.abc123.js                      │
│  3. Browser check cache: abc123 có không?                            │
│     → Có → dùng cache (0ms, 0 bytes)                                 │
│     → Không → download (1 lần duy nhất)                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Đo lường hiệu quả Vendor Splitting

**Công cụ phân tích bundle:**

```typescript
// vite.config.ts — rollup-plugin-visualizer (shopee-web đã cài)
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer(), // ← tạo stats.html sau khi build
]
```

Sau khi chạy `vite build`, mở `stats.html` để thấy:

- Chunk nào lớn nhất
- Library nào chiếm nhiều nhất trong mỗi chunk
- Có module nào bị duplicate giữa các chunks không

**Metrics cần theo dõi:**

```
Trước Vendor Splitting:
  main.js = 2.8MB (gzipped 850KB)
  Repeat visit: 850KB mỗi lần deploy

Sau Vendor Splitting:
  react-vendor.js  = 140KB (gzipped 45KB)   → cache hit sau lần đầu
  motion-vendor.js = 95KB  (gzipped 30KB)   → cache hit sau lần đầu
  http-vendor.js   = 80KB  (gzipped 25KB)   → cache hit sau lần đầu
  app.js           = 80KB  (gzipped 25KB)   → download mỗi deploy
  route chunks     = 200KB (gzipped 60KB)   → download khi navigate

  First visit:   850KB (như cũ)
  Repeat visit:  25KB  (chỉ app.js thay đổi)
  → 97% bandwidth saved on repeat visits
```

---

### Anti-patterns cần tránh

```
❌ Anti-pattern 1: Tách quá nhỏ
   Mỗi component là 1 chunk → 200 HTTP requests → network overhead

❌ Anti-pattern 2: Không exclude devtools
   @tanstack/react-query-devtools vào production bundle
   → +100KB không cần thiết

❌ Anti-pattern 3: Vendor chunk quá lớn
   Gộp tất cả vào 1 "vendor.js" = 2MB
   → Nếu update 1 library nhỏ → invalidate toàn bộ 2MB cache

❌ Anti-pattern 4: Không dùng content hash
   react-vendor.js (không có hash)
   → Browser không biết file đã thay đổi chưa
   → Phải dùng ETag hoặc Last-Modified → thêm round-trip

✅ Best practice: Tách theo "nhóm thay đổi cùng nhau"
   Libraries cùng ecosystem (react + react-dom) → 1 chunk
   Libraries độc lập, lớn (framer-motion) → chunk riêng
   Libraries nhỏ, cùng mục đích (classnames + immer) → gộp
```

---

### Trả lời phỏng vấn về Vendor Splitting

**Q: "Vendor splitting là gì và tại sao dùng?"**

```
Vendor splitting là kỹ thuật tách third-party libraries (react, axios, ...)
thành các JS chunk riêng biệt, tách khỏi application code.

Lý do: App code thay đổi mỗi lần deploy, vendor code thay đổi rất ít.
Nếu tách riêng + dùng content hash trong tên file:
- Vendor chunks có thể cache ở browser 1 năm
- Khi deploy, user chỉ download lại app chunk (~50-100KB)
- Thay vì re-download toàn bộ bundle (2-3MB)

Kết quả: Repeat visits nhanh hơn đáng kể — 97% bandwidth saved.
```

**Q: "Tại sao không tách mỗi library thành 1 chunk?"**

```
Vì HTTP requests có overhead — mỗi request tốn:
- DNS lookup, TCP handshake, TLS negotiation (lần đầu)
- HTTP header overhead (mỗi request)

Dù HTTP/2 multiplexing giảm overhead, vẫn cần cân bằng:
- Quá nhiều chunks → nhiều requests → overhead tăng
- Quá ít chunks → cache granularity kém → cache miss lớn

Best practice: Nhóm theo tần suất thay đổi và kích thước.
Trong shopee-web: 12 vendor chunks — cân bằng giữa cache granularity
và số lượng HTTP requests.
```

**Q: "Vendor splitting khác code splitting như thế nào?"**

```
Code splitting: tách theo route/component → giảm initial JS load
Vendor splitting: tách theo nguồn gốc (app vs vendor) → tối ưu browser cache

Chúng bổ sung cho nhau:
- Code splitting giúp lần đầu vào trang nhanh hơn (ít JS hơn)
- Vendor splitting giúp lần thứ 2, 3, ... nhanh hơn (cache hit)
Dùng cả hai = tối ưu toàn diện.
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

> _"The biggest mistake is adding memoization everywhere 'just in case'."_

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
    return items.filter((i) => i.active) // 5 items, instant
  }, [items])

  // ❌ Không cần: primitive value
  const total = useMemo(() => {
    return items.length // không cần memo
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

> _"If I design a feature on a whiteboard, it should look like something we can ship, not just fancy boxes."_

Đây là tiêu chí quan trọng nhất. Khi bạn vẽ diagram trong phỏng vấn, interviewer phải thấy:

| Interviewer thấy                | Ý nghĩa                                      |
| ------------------------------- | -------------------------------------------- |
| Bạn hỏi clarifying questions    | Bạn không assume, bạn verify                 |
| Bạn đề cập error states         | Bạn biết production không bao giờ happy path |
| Bạn nói về loading states       | Bạn nghĩ về UX, không chỉ data               |
| Bạn mention accessibility       | Bạn build cho mọi người                      |
| Bạn discuss trade-offs          | Bạn có engineering judgment                  |
| Bạn biết khi nào KHÔNG optimize | Bạn không over-engineer                      |
| Bạn nói về network calls        | Bạn hiểu performance từ gốc                  |

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

> **Lời khuyên cuối:** Engineering Manager nói _"keep your thinking clear"_.
> Trong phỏng vấn, clarity > completeness. Một design đơn giản được giải thích rõ ràng
> tốt hơn một design phức tạp được giải thích lộn xộn.
>
> Practice bằng cách nói to ra trong khi design — đó là cách interviewer đánh giá bạn.
