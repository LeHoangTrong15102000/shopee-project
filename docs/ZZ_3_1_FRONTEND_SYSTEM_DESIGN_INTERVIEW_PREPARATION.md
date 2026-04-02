# FRONTEND SYSTEM DESIGN — INTERVIEW PREPARATION GUIDE

> **Tài liệu ôn luyện toàn diện cho Frontend System Design Interview**
>
> **Mục đích:** Chuẩn bị phỏng vấn tại các công ty top (FAANG, Shopee, Grab, ByteDance, v.v.)
>
> **Ngày tạo:** 02/04/2026

---

## MỤC LỤC

| # | Chủ đề | Mô tả |
|---|--------|-------|
| 1 | [Framework trả lời phỏng vấn](#1-framework-trả-lời-phỏng-vấn) | RADIO Framework, cấu trúc 60 phút |
| 2 | [Rendering Strategies](#2-rendering-strategies) | CSR, SSR, SSG, ISR, Streaming, Partial Hydration |
| 3 | [State Management](#3-state-management) | Client state, Server state, URL state, Form state |
| 4 | [Data Fetching & API Design](#4-data-fetching--api-design) | REST, GraphQL, caching, pagination, optimistic updates |
| 5 | [Networking & Real-time Communication](#5-networking--real-time-communication) | HTTP/2, HTTP/3, WebSocket, SSE, Long Polling |
| 6 | [Performance Optimization](#6-performance-optimization) | Core Web Vitals, code splitting, lazy loading, virtualization |
| 7 | [Caching Strategies](#7-caching-strategies) | Browser cache, CDN, service worker, in-memory |
| 8 | [Component Architecture](#8-component-architecture) | Design patterns, composition, scalability |
| 9 | [Security](#9-security) | XSS, CSRF, CSP, CORS, authentication |
| 10 | [Accessibility (A11y)](#10-accessibility-a11y) | WCAG, ARIA, keyboard navigation, screen readers |
| 11 | [Internationalization (i18n)](#11-internationalization-i18n) | Locale, RTL, dynamic loading, SEO |
| 12 | [Offline-First & PWA](#12-offline-first--pwa) | Service Workers, caching patterns, background sync |
| 13 | [Micro-Frontends](#13-micro-frontends) | Module Federation, Web Components, iframe |
| 14 | [Testing & Observability](#14-testing--observability) | Testing pyramid, monitoring, error tracking, logging |
| 15 | [Design Patterns](#15-design-patterns) | Observer, Pub/Sub, MVC/MVVM/Flux, HOC, Render Props |
| 16 | [Scalability](#16-scalability) | Data scale, feature scale, team scale, device scale |
| 17 | [Câu hỏi thực hành](#17-câu-hỏi-thực-hành) | 25+ bài system design thực tế với hướng dẫn |
| 18 | [Tiêu chí đánh giá](#18-tiêu-chí-đánh-giá) | Interviewer đánh giá gì? |
| 19 | [Tài liệu tham khảo](#19-tài-liệu-tham-khảo) | Sách, khóa học, website |

---

## 1. FRAMEWORK TRẢ LỜI PHỎNG VẤN

### 1.1. RADIO Framework

RADIO là framework phổ biến nhất để trả lời câu hỏi Frontend System Design, được phát triển bởi GreatFrontEnd.

```
R — Requirements Exploration     (~10-15% thời gian, ~5-8 phút)
A — Architecture / High-Level Design  (~20% thời gian, ~10-12 phút)
D — Data Model                   (~10-15% thời gian, ~5-8 phút)
I — Interface Definition (API)   (~15% thời gian, ~8-10 phút)
O — Optimizations & Deep Dive    (~30-40% thời gian, ~15-20 phút)
```

#### R — Requirements Exploration

Hỏi rõ ràng trước khi thiết kế:

**Functional Requirements (FR):**
- User có thể làm gì? (core features)
- User flow chính là gì?
- Cái gì in-scope, cái gì out-of-scope?
- Có cần real-time không?
- Có cần collaborative editing không?

**Non-Functional Requirements (NFR):**
- Performance targets? (load time < 3s? TTI < 5s?)
- Scale? (bao nhiêu users? bao nhiêu data?)
- SEO quan trọng không?
- Accessibility level? (WCAG AA? AAA?)
- Offline support cần không?
- Internationalization? (bao nhiêu ngôn ngữ?)
- Mobile support? (responsive? native app?)
- Browser support? (IE11? modern only?)

**Ví dụ với "Design Facebook News Feed":**
```
FR:
- User xem feed posts (text, image, video)
- Infinite scroll
- Like, comment, share
- Real-time updates khi có post mới
- Compose new post

NFR:
- Performance: Feed load < 2s, smooth 60fps scroll
- Scale: 1 tỷ users, millions posts/day
- SEO: Không quan trọng (behind auth)
- Mobile: Responsive web
- Accessibility: WCAG AA
```

#### A — Architecture / High-Level Design

Vẽ component diagram:

```
┌─────────────────────────────────────────────────┐
│                    App Shell                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Header   │  │  Sidebar │  │  Main Content│  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              State Management Layer               │
│  ┌────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Client │  │  Server  │  │  URL / Form    │  │
│  │ State  │  │  State   │  │  State         │  │
│  └────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  Service Layer                    │
│  ┌────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  API   │  │  Cache   │  │  WebSocket     │  │
│  │ Client │  │  Layer   │  │  Client        │  │
│  └────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### D — Data Model

Xác định entities, fields, relationships:

```typescript
interface Post {
  id: string
  author: User
  content: string
  media: Media[]
  reactions: ReactionSummary
  comments: CommentSummary
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  name: string
  avatar: string
}

interface FeedState {
  posts: Post[]
  cursor: string | null
  hasMore: boolean
  isLoading: boolean
}
```

#### I — Interface Definition (API)

Xác định API contracts giữa client và server:

```typescript
// REST API
GET /api/feed?cursor={cursor}&limit={limit}
→ { posts: Post[], nextCursor: string | null }

POST /api/posts
→ { post: Post }

POST /api/posts/{id}/reactions
→ { reaction: Reaction }

// WebSocket Events
socket.on('feed:new-post', (post: Post) => void)
socket.on('post:reaction-update', (data: { postId, reactions }) => void)
```

#### O — Optimizations & Deep Dive

Đây là phần chiếm nhiều thời gian nhất và là nơi phân biệt senior vs junior:

- Virtualized list cho infinite scroll
- Image lazy loading + responsive images
- Optimistic updates cho like/comment
- Request deduplication
- Skeleton loading states
- Prefetching next page
- Offline queue cho pending actions

### 1.2. Cấu trúc phiên phỏng vấn 60 phút

```
00:00 - 08:00  │  Requirements clarification
08:00 - 20:00  │  Architecture & High-level design
20:00 - 28:00  │  Data model & Interface definition
28:00 - 50:00  │  Optimizations & Deep dive
50:00 - 60:00  │  Q&A, interviewer questions, wrap-up
```

### 1.3. Những sai lầm thường gặp

| Sai lầm | Nên làm |
|---------|---------|
| Nhảy thẳng vào solution | Hỏi requirements trước |
| Không vẽ diagram | Luôn vẽ architecture diagram |
| Chỉ nói 1 solution duy nhất | Nêu trade-offs giữa 2-3 options |
| Im lặng khi suy nghĩ | Think out loud, giải thích reasoning |
| Dùng buzzwords mà không giải thích | Giải thích WHY chứ không chỉ WHAT |
| Đi quá sâu vào 1 chi tiết | Bao quát trước, deep dive sau |
| Không đề cập edge cases | Luôn consider error states, loading, empty states |

---

## 2. RENDERING STRATEGIES

### 2.1. Tổng quan

| Strategy | Render ở đâu | Khi nào render | SEO | TTFB | FCP | TTI |
|----------|--------------|----------------|-----|------|-----|-----|
| **CSR** | Browser | Mỗi lần visit | Kém | Nhanh | Chậm | Chậm |
| **SSR** | Server | Mỗi request | Tốt | Chậm hơn | Nhanh | Trung bình |
| **SSG** | Build time | Lúc build | Tốt | Rất nhanh | Rất nhanh | Nhanh |
| **ISR** | Build + Background | Định kỳ | Tốt | Rất nhanh | Rất nhanh | Nhanh |
| **Streaming** | Server → Client | Progressively | Tốt | Nhanh | Rất nhanh | Nhanh |

### 2.2. Client-Side Rendering (CSR)

```
Browser nhận HTML shell → Download JS bundle → Execute JS → Render UI
```

**Khi nào dùng:**
- SPA (Single Page App) với nhiều tương tác
- Dashboard, admin panel
- App behind authentication (không cần SEO)
- Real-time collaborative tools

**Ưu điểm:** Rich interactivity, giảm server load, smooth navigation
**Nhược điểm:** Slow FCP, poor SEO, large JS bundle, blank screen khi loading

### 2.3. Server-Side Rendering (SSR)

```
Browser request → Server render full HTML → Gửi HTML → Browser hiển thị → Hydrate JS
```

**Khi nào dùng:**
- Content-heavy pages cần SEO (product pages, blog)
- Dynamic data thay đổi theo user (personalized content)
- Social media sharing cần meta tags đúng

**Ưu điểm:** Fast FCP, good SEO, accessible content ngay
**Nhược điểm:** Tăng server load, TTFB chậm hơn, hydration cost

### 2.4. Static Site Generation (SSG)

```
Build time: Generate HTML files → Deploy to CDN → Browser nhận pre-built HTML
```

**Khi nào dùng:**
- Blog, documentation
- Marketing/landing pages
- Content hiếm khi thay đổi

**Ưu điểm:** Fastest load time, cheapest hosting, excellent SEO
**Nhược điểm:** Build time tăng theo số pages, content stale cho đến lần build sau

### 2.5. Incremental Static Regeneration (ISR)

```
First visit: Serve static page → Background: Regenerate sau N giây → Next visit: Serve updated page
```

**Khi nào dùng:**
- E-commerce product pages (hàng nghìn products)
- News articles
- Content thay đổi nhưng không cần real-time

**Ưu điểm:** SSG speed + near-fresh data
**Nhược điểm:** Stale content window, complexity tăng

### 2.6. Streaming & Partial Hydration

```
Server bắt đầu stream HTML → Browser render progressively → Chỉ hydrate interactive parts
```

**React Server Components (RSC):**
- Server Components: render trên server, không gửi JS đến client
- Client Components: render + hydrate trên client
- Giảm JS bundle size đáng kể

**Selective/Partial Hydration:**
- Chỉ hydrate components cần interactive
- Islands Architecture (Astro): static HTML + interactive "islands"

### 2.7. Decision Matrix

```
Cần SEO? ─── Không ──► CSR
    │
    Có
    │
Content static? ─── Có ──► SSG
    │
    Không
    │
Thay đổi thường xuyên? ─── Ít ──► ISR
    │
    Nhiều
    │
    └──► SSR (hoặc Streaming SSR)
```

---

## 3. STATE MANAGEMENT

### 3.1. Phân loại State

```
┌─────────────────────────────────────────────────────┐
│                    Frontend State                      │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Client State│  │ Server State │  │  URL State │  │
│  │             │  │              │  │            │  │
│  │ UI toggles  │  │ API data     │  │ Query      │  │
│  │ Form inputs │  │ User profile │  │ params     │  │
│  │ Selected    │  │ Products     │  │ Filters    │  │
│  │ items       │  │ Orders       │  │ Pagination │  │
│  │ Theme       │  │ Notifications│  │ Sort       │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐                   │
│  │ Form State  │  │ Derived      │                   │
│  │             │  │ State        │                   │
│  │ Validation  │  │              │                   │
│  │ Dirty       │  │ Computed     │                   │
│  │ Touched     │  │ values from  │                   │
│  │ Errors      │  │ other states │                   │
│  └─────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────┘
```

### 3.2. Client State Solutions

| Tool | Bundle Size | Boilerplate | Learning Curve | Best For |
|------|-------------|-------------|----------------|----------|
| `useState/useReducer` | 0 | Thấp | Thấp | Component-local state |
| Context API | 0 | Trung bình | Thấp | Global state ít thay đổi |
| Zustand | ~1KB | Rất thấp | Thấp | Client state cần performance |
| Redux Toolkit | ~10KB | Trung bình | Trung bình | Complex state, large teams |
| Jotai | ~3KB | Thấp | Thấp | Atomic state |
| Valtio | ~3KB | Thấp | Thấp | Proxy-based reactive state |

### 3.3. Server State Solutions

| Tool | Caching | Dedup | Background Refetch | Optimistic Updates |
|------|---------|-------|--------------------|--------------------|
| TanStack Query | Built-in | Built-in | Built-in | Built-in |
| SWR | Built-in | Built-in | Built-in | Manual |
| Apollo Client | Normalized | Built-in | Built-in | Built-in |
| RTK Query | Built-in | Built-in | Built-in | Manual |

### 3.4. Câu hỏi phỏng vấn thường gặp

- **"Khi nào dùng Redux vs Context API vs Zustand?"**
  - Context: global state đơn giản, ít update (theme, auth, locale)
  - Redux: complex state logic, large teams cần predictability, time-travel debugging
  - Zustand: client state cần performance, ít boilerplate, không cần Provider

- **"Server state vs Client state — tại sao phải tách?"**
  - Server state có lifecycle riêng: stale, cached, refetching, error
  - Client state synchronous, server state asynchronous
  - Mixing chúng tạo ra complexity không cần thiết

- **"Làm sao tránh prop drilling?"**
  - Context API cho cross-cutting concerns
  - Composition pattern (children/render props)
  - State management library
  - Component collocation (move state down)

---

## 4. DATA FETCHING & API DESIGN

### 4.1. REST vs GraphQL

| Aspect | REST | GraphQL |
|--------|------|---------|
| Endpoint | Multiple (1 per resource) | Single endpoint |
| Data shape | Server quyết định | Client quyết định |
| Over-fetching | Có thể | Không (chỉ lấy fields cần) |
| Under-fetching | Có thể | Không (1 query lấy nhiều resources) |
| Caching | HTTP caching dễ | Cache phức tạp hơn (normalized) |
| File upload | Native support | Cần thêm library |
| Learning curve | Thấp | Trung bình |
| Versioning | URL versioning (/v1/) | Schema evolution |
| Error handling | HTTP status codes | 200 OK + errors array |

### 4.2. Pagination Strategies

**Offset-based:**
```
GET /products?page=3&limit=20
```
- Dễ implement
- Cho phép jump to page
- Inconsistent khi data thay đổi (items bị lặp/mất)

**Cursor-based:**
```
GET /products?cursor=abc123&limit=20
```
- Consistent results
- Better performance (không cần COUNT)
- Không cho phép jump to page
- Phù hợp infinite scroll

**Keyset-based:**
```
GET /products?after_id=abc123&limit=20&sort=created_at
```
- Variant của cursor-based
- Sort key + unique ID

**Khi nào dùng cái nào:**
| Use Case | Strategy |
|----------|----------|
| Traditional pagination (page 1, 2, 3) | Offset |
| Infinite scroll | Cursor |
| Real-time feed | Cursor |
| Search results | Offset hoặc Cursor |
| Admin tables | Offset |

### 4.3. Optimistic Updates

```
User Action
    │
    ├─► Cập nhật UI ngay lập tức (optimistic)
    │
    ├─► Gửi API request
    │       │
    │       ├─► Success → Thay thế optimistic data bằng real data
    │       │
    │       └─► Error → Rollback về state trước đó + show error
    │
    └─► Show visual feedback (loading indicator on affected item)
```

**Nên dùng khi:** Like, bookmark, add to cart, toggle, reorder
**Không nên dùng khi:** Payment, delete account, send money

### 4.4. Request Deduplication & Cancellation

- **Deduplication:** Nếu 2 components cùng fetch `/products`, chỉ gửi 1 request
- **Cancellation:** Khi user type nhanh trong search bar, cancel request cũ bằng AbortController
- **Debounce/Throttle:** Giảm tần suất request

```
User types: "l" → "la" → "lap" → "lapt" → "lapto" → "laptop"
                                                          │
Debounce 300ms: chỉ gửi request cho ─────────────────── "laptop"
```

### 4.5. Error Handling Patterns

```
┌─────────────┐
│ API Request  │
└──────┬──────┘
       │
  ┌────▼────┐
  │ Success? │
  └────┬────┘
    Yes│    No
       │    │
       │  ┌─▼──────────┐
       │  │ Error Type? │
       │  └─┬──────────┘
       │    │
       │    ├─ 401 → Refresh token → Retry
       │    ├─ 403 → Show "no permission"
       │    ├─ 404 → Show "not found"
       │    ├─ 422 → Show validation errors
       │    ├─ 429 → Retry with backoff
       │    ├─ 5xx → Retry with exponential backoff
       │    └─ Network error → Show offline state
       │
  ┌────▼─────┐
  │ Render UI │
  └──────────┘
```

---

## 5. NETWORKING & REAL-TIME COMMUNICATION

### 5.1. Protocol Comparison

```
                    Bidirectional?    Latency    Complexity    Best For
─────────────────────────────────────────────────────────────────────────
HTTP/1.1            No                High       Low           Legacy
HTTP/2              No                Medium     Low           Standard APIs
HTTP/3 (QUIC)       No                Low        Medium        CDN, mobile
WebSocket           Yes               Very Low   Medium        Chat, gaming
SSE                 Server→Client     Low        Low           Notifications
Long Polling        Simulated         Medium     Medium        Fallback
GraphQL Subscriptions  Server→Client  Low        Medium        Typed events
```

### 5.2. Khi nào dùng gì?

**WebSocket:**
- Chat applications
- Multiplayer games
- Collaborative editing (Google Docs)
- Live trading/stock tickers
- Cần bidirectional real-time

**Server-Sent Events (SSE):**
- Notifications
- Live feed updates
- Progress tracking
- Server → Client one-way
- Tự động reconnect

**Long Polling:**
- Khi WebSocket/SSE không available
- Simple real-time cho older browsers
- Low-frequency updates

**GraphQL Subscriptions:**
- Khi đã dùng GraphQL
- Typed, schema-driven real-time events

### 5.3. HTTP/2 vs HTTP/3

**HTTP/2:**
- Multiplexing (nhiều requests trên 1 TCP connection)
- Header compression (HPACK)
- Server push
- Vấn đề: Head-of-line blocking ở TCP level

**HTTP/3 (QUIC):**
- Dựa trên UDP, không phải TCP
- Không còn head-of-line blocking
- 0-RTT connection resumption
- Connection migration (WiFi → 4G không mất connection)
- Tốt hơn cho mobile users

### 5.4. WebSocket Architecture Considerations

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Client  │◄────────│  WS Gateway  │────────►│ Backend  │
│ (Browser)│ WS      │ (Load Balance│  Pub/Sub│ Services │
└──────────┘         │  + Routing)  │         └──────────┘
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Redis/Kafka  │
                     │ (Message Bus)│
                     └──────────────┘
```

**Scaling WebSocket:**
- Sticky sessions (cùng user → cùng server)
- Redis Pub/Sub cho cross-server messaging
- Heartbeat/ping để detect stale connections
- Reconnection strategy với exponential backoff
- Message queue cho offline delivery

---

## 6. PERFORMANCE OPTIMIZATION

### 6.1. Core Web Vitals

```
┌────────────────────────────────────────────────────────────────┐
│                    CORE WEB VITALS (2024+)                      │
│                                                                  │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐             │
│  │   LCP    │      │   INP    │      │   CLS    │             │
│  │  < 2.5s  │      │ < 200ms  │      │  < 0.1   │             │
│  │          │      │          │      │          │             │
│  │ Largest  │      │Interaction│      │Cumulative│             │
│  │Contentful│      │ to Next  │      │ Layout   │             │
│  │  Paint   │      │  Paint   │      │  Shift   │             │
│  └──────────┘      └──────────┘      └──────────┘             │
│                                                                  │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐             │
│  │   FCP    │      │   TTFB   │      │   TBT    │             │
│  │  < 1.8s  │      │ < 800ms  │      │ < 200ms  │             │
│  │          │      │          │      │          │             │
│  │  First   │      │ Time to  │      │  Total   │             │
│  │Contentful│      │  First   │      │ Blocking │             │
│  │  Paint   │      │   Byte   │      │   Time   │             │
│  └──────────┘      └──────────┘      └──────────┘             │
└────────────────────────────────────────────────────────────────┘
```

### 6.2. Optimize LCP

| Technique | Giải thích |
|-----------|-----------|
| `fetchpriority="high"` | Ưu tiên tải hero image |
| Preload critical resources | `<link rel="preload" as="image" href="...">` |
| Responsive images | `srcset` + `sizes` cho đúng kích thước |
| Modern formats | WebP, AVIF thay cho JPEG/PNG |
| CDN | Serve images từ edge server gần user |
| SSR/SSG | HTML có content sẵn, không đợi JS |
| Font optimization | `font-display: swap`, preload fonts |

### 6.3. Optimize INP (Interaction to Next Paint)

| Technique | Giải thích |
|-----------|-----------|
| Break long tasks | Chia task lớn thành chunks < 50ms |
| `requestIdleCallback` | Chạy non-critical work khi browser rảnh |
| `startTransition` | Đánh dấu low-priority updates (React 18+) |
| Web Workers | Offload CPU-intensive work khỏi main thread |
| `requestAnimationFrame` | Sync với browser paint cycle |
| Debounce/Throttle | Giảm tần suất event handlers |
| Virtualization | Chỉ render items visible trong viewport |

### 6.4. Optimize CLS

| Technique | Giải thích |
|-----------|-----------|
| Explicit dimensions | Set `width` + `height` trên images/videos |
| `aspect-ratio` CSS | Reserve space trước khi content load |
| Font fallback | Match fallback font metrics với web font |
| Avoid injecting content | Không insert content above existing content |
| `contain: layout` | CSS containment cho dynamic content |
| Skeleton screens | Placeholder giữ chỗ cho content |

### 6.5. Code Splitting & Lazy Loading

```
┌─────────────────────────────────────────────────────────────┐
│                    CODE SPLITTING LEVELS                      │
│                                                               │
│  Level 1: Route-based                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │ Home │  │ Shop │  │ Cart │  │ User │                   │
│  │  JS  │  │  JS  │  │  JS  │  │  JS  │                   │
│  └──────┘  └──────┘  └──────┘  └──────┘                   │
│                                                               │
│  Level 2: Component-based                                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐             │
│  │  Modal   │  │  Chatbot  │  │  Rich Editor │             │
│  │ (on open)│  │(on toggle)│  │ (on focus)   │             │
│  └──────────┘  └───────────┘  └──────────────┘             │
│                                                               │
│  Level 3: Library-based                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐             │
│  │ Chart.js │  │ Socket.IO │  │   Moment.js  │             │
│  │(on render)│ │(on connect)│ │ (on format)  │             │
│  └──────────┘  └───────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### 6.6. Virtualization (Windowing)

Khi render list hàng nghìn items, chỉ render items visible trong viewport.

```
┌─────────────────────┐
│ ▲ Overscan (buffer) │  ← 5-10 items phía trên viewport
├─────────────────────┤
│ Item 45             │  ← Visible trong viewport
│ Item 46             │
│ Item 47             │
│ Item 48             │
│ Item 49             │
│ Item 50             │
│ Item 51             │
├─────────────────────┤
│ ▼ Overscan (buffer) │  ← 5-10 items phía dưới viewport
└─────────────────────┘
│ Item 52 - 10000     │  ← KHÔNG render, chỉ placeholder height
```

**Libraries:** react-window, react-virtuoso, TanStack Virtual

### 6.7. Bundle Optimization

| Technique | Công cụ/Cách |
|-----------|-------------|
| Tree Shaking | Vite/Webpack tự động loại bỏ unused exports |
| Code Splitting | `React.lazy()` + `Suspense` |
| Dynamic Imports | `import()` cho heavy libraries |
| Minification | Terser, esbuild |
| Compression | Gzip, Brotli |
| Bundle Analysis | `vite-bundle-visualizer`, `webpack-bundle-analyzer` |
| Dependency Audit | Check bundle size trước khi thêm dependency |
| Modern builds | ES2020+ cho modern browsers, fallback cho cũ |

### 6.8. Image Optimization

```
┌─────────────────────────────────────────────────────┐
│               IMAGE OPTIMIZATION STACK                │
│                                                       │
│  Format:    AVIF > WebP > JPEG/PNG                   │
│  Sizing:    srcset + sizes (responsive)              │
│  Loading:   loading="lazy" | Intersection Observer   │
│  Decoding:  decoding="async"                         │
│  Priority:  fetchpriority="high" (hero image)        │
│  Placeholder: LQIP / BlurHash / Skeleton             │
│  CDN:       Image CDN (Cloudinary, imgix)            │
│  Caching:   Cache-Control: max-age=31536000          │
└─────────────────────────────────────────────────────┘
```

---

## 7. CACHING STRATEGIES

### 7.1. Caching Layers

```
Request → [Browser Memory Cache] → [Browser Disk Cache] → [Service Worker]
       → [CDN Edge] → [API Gateway Cache] → [Origin Server]
       → [Database Cache] → [Database]
```

### 7.2. HTTP Caching

| Header | Giải thích | Ví dụ |
|--------|-----------|-------|
| `Cache-Control` | Điều khiển caching behavior | `max-age=3600, public` |
| `ETag` | Fingerprint của resource | `"abc123"` |
| `Last-Modified` | Thời gian resource thay đổi | `Thu, 01 Jan 2026 00:00:00 GMT` |
| `Expires` | Thời gian hết hạn (legacy) | Date string |

**Strategies:**
```
Static assets (JS/CSS/images):
  Cache-Control: public, max-age=31536000, immutable
  → Content-hash trong filename để bust cache

HTML:
  Cache-Control: no-cache
  → Luôn validate với server

API responses:
  Cache-Control: private, max-age=0, must-revalidate
  ETag: "response-hash"
  → Conditional requests (If-None-Match)
```

### 7.3. Stale-While-Revalidate Pattern

```
Request → Cache có data?
             │
         Yes │        No
             │         │
      ┌──────▼───┐     │
      │ Return   │     │
      │ cached   │     │
      │ data     │     │
      └──────┬───┘     │
             │         │
      ┌──────▼─────────▼──┐
      │ Revalidate in     │
      │ background        │
      └──────┬────────────┘
             │
      ┌──────▼───┐
      │ Update   │
      │ cache    │
      └──────────┘
```

### 7.4. Application-Level Caching

**TanStack Query / SWR caching model:**
```
staleTime: Thời gian data được coi là "fresh"
gcTime:    Thời gian giữ data inactive trong cache

  0s ──── staleTime ──── gcTime ──── ∞
  │          │              │
  │  FRESH   │    STALE     │  GARBAGE COLLECTED
  │ (no      │ (refetch on  │ (removed from
  │ refetch) │  triggers)   │  memory)
```

### 7.5. Cache Invalidation

"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

| Strategy | Khi nào | Cách |
|----------|---------|------|
| Time-based | Data ít thay đổi | `staleTime`, `max-age` |
| Event-based | Sau mutation | `invalidateQueries()` |
| Manual | User action | "Pull to refresh", clear cache button |
| Optimistic | Trước response | Update cache → revalidate sau |

---

## 8. COMPONENT ARCHITECTURE

### 8.1. Component Design Principles

**Single Responsibility:** Mỗi component làm 1 việc
**Composition over Inheritance:** Combine nhỏ thành lớn
**Separation of Concerns:** Logic vs Presentation vs Data
**Open-Closed:** Mở rộng được, không cần sửa code cũ

### 8.2. Component Patterns

**Container/Presentational Pattern:**
```
┌───────────────────────────┐
│    Container (Smart)       │  ← Handles data, state, logic
│  ┌─────────────────────┐  │
│  │ Presentational       │  │  ← Pure UI, receives props
│  │ (Dumb)               │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

**Compound Components:**
```tsx
<Select>
  <Select.Trigger>Choose option</Select.Trigger>
  <Select.Content>
    <Select.Item value="a">Option A</Select.Item>
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select>
```

**Render Props:**
```tsx
<DataFetcher url="/api/users">
  {({ data, loading }) => loading ? <Spinner /> : <UserList users={data} />}
</DataFetcher>
```

**Custom Hooks (Logic Extraction):**
```tsx
function useProducts(filters) {
  const { data, isLoading } = useQuery(...)
  const sortedProducts = useMemo(...)
  return { products: sortedProducts, isLoading }
}
```

**Higher-Order Components (HOC):**
```tsx
const withAuth = (Component) => (props) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
}
```

### 8.3. Component Tree Optimization

| Problem | Solution |
|---------|----------|
| Unnecessary re-renders | `React.memo`, selector hooks |
| Expensive computations | `useMemo` |
| Unstable callback refs | `useCallback` |
| Large component trees | Code splitting, lazy loading |
| Prop drilling (5+ levels) | Context, state management, composition |
| Layout thrashing | CSS containment, will-change |

---

## 9. SECURITY

### 9.1. XSS (Cross-Site Scripting)

**Loại:**
- **Stored XSS:** Script lưu trong DB, execute khi user xem
- **Reflected XSS:** Script trong URL, execute khi click link
- **DOM-based XSS:** Script manipulate DOM trực tiếp

**Phòng chống:**
```
1. Output encoding (escape HTML entities)
2. KHÔNG dùng innerHTML / dangerouslySetInnerHTML
3. Sanitize user input (DOMPurify)
4. Content Security Policy (CSP)
5. Trusted Types API
6. HttpOnly cookies (prevent JS access)
```

### 9.2. CSRF (Cross-Site Request Forgery)

```
User logged in ─► Attacker's page ─► Gửi request đến your API
                   (hidden form)      (với cookies của user)
```

**Phòng chống:**
```
1. CSRF tokens (server generate, client gửi kèm)
2. SameSite cookie attribute (Strict/Lax)
3. Check Origin/Referer header
4. Custom request headers (X-Requested-With)
```

### 9.3. Content Security Policy (CSP)

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-abc123';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://cdn.example.com;
  connect-src 'self' https://api.example.com;
  font-src 'self' https://fonts.googleapis.com;
```

### 9.4. CORS (Cross-Origin Resource Sharing)

```
Browser ─► Preflight (OPTIONS) ─► Server checks origin
                                       │
                                  ┌────▼────┐
                                  │ Allowed? │
                                  └────┬────┘
                                   Yes │ No
                                       │  │
                            ┌──────────▼┐ ▼──── Block request
                            │ Send actual│
                            │ request    │
                            └───────────┘
```

### 9.5. Authentication Patterns

| Pattern | Stateful | Where stored | Scalability |
|---------|----------|-------------|-------------|
| Session cookie | Server | Cookie | Cần session store |
| JWT (access + refresh) | Stateless | Memory/Cookie | Dễ scale |
| OAuth 2.0 / OIDC | Depends | Cookie | Third-party auth |
| BFF (Backend For Frontend) | Server | HttpOnly cookie | Secure + scalable |

**JWT Flow:**
```
Login → Server issues access_token (short-lived) + refresh_token (long-lived)
    │
    ├─► Access token in memory (NOT localStorage)
    ├─► Refresh token in HttpOnly cookie
    │
Request → Attach access_token in Authorization header
    │
    ├─► 401? → Call /refresh-token → Get new access_token → Retry
    └─► Refresh token expired? → Logout
```

### 9.6. Security Checklist cho System Design

- [ ] Sanitize all user inputs
- [ ] CSP headers configured
- [ ] CORS properly restricted
- [ ] Authentication tokens secure (HttpOnly, Secure, SameSite)
- [ ] Rate limiting on APIs
- [ ] HTTPS everywhere
- [ ] Subresource Integrity (SRI) cho third-party scripts
- [ ] No sensitive data in URL params
- [ ] Input validation on both client AND server

---

## 10. ACCESSIBILITY (A11Y)

### 10.1. WCAG Levels

| Level | Yêu cầu | Ví dụ |
|-------|---------|-------|
| **A** (minimum) | Basic accessibility | Alt text, keyboard navigable, color not only indicator |
| **AA** (standard, phổ biến nhất) | Enhanced accessibility | Contrast ratio ≥ 4.5:1, resize text 200%, focus visible |
| **AAA** (highest) | Maximum accessibility | Contrast ≥ 7:1, sign language, extended audio description |

### 10.2. Semantic HTML

```html
<!-- ❌ BAD: div soup -->
<div class="header">
  <div class="nav">
    <div class="link" onclick="navigate()">Home</div>
  </div>
</div>

<!-- ✅ GOOD: semantic HTML -->
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
  </nav>
</header>
```

### 10.3. ARIA (Accessible Rich Internet Applications)

```html
<!-- Roles -->
<div role="dialog" aria-labelledby="title" aria-modal="true">
  <h2 id="title">Confirm Delete</h2>
  <button aria-label="Close dialog">×</button>
</div>

<!-- Live regions -->
<div aria-live="polite" aria-atomic="true">
  3 items added to cart
</div>

<!-- States -->
<button aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>...</ul>
```

### 10.4. Keyboard Navigation

```
Tab        → Move focus forward
Shift+Tab  → Move focus backward
Enter      → Activate button/link
Space      → Toggle checkbox/button
Escape     → Close dialog/dropdown
Arrow keys → Navigate within widgets (tabs, menus, listbox)
```

**Focus Management:**
- Trap focus within modals
- Return focus when modal closes
- Skip-to-content link
- Visible focus indicators
- `tabindex="0"` cho custom interactive elements
- `tabindex="-1"` cho programmatic focus

### 10.5. A11y trong System Design

Khi thiết kế, luôn đề cập:
- Screen reader compatibility
- Keyboard-only navigation
- Color contrast ratios
- Focus management (modal, route changes)
- Error announcements (`aria-live`)
- Loading state announcements
- Alternative text cho images
- Reduced motion preferences (`prefers-reduced-motion`)

---

## 11. INTERNATIONALIZATION (I18N)

### 11.1. Architecture

```
┌────────────────────────────────────────────────────┐
│                  i18n Architecture                    │
│                                                      │
│  ┌─────────────┐   ┌──────────────┐                │
│  │ Locale       │   │ Translation  │                │
│  │ Detection    │   │ Files        │                │
│  │              │   │              │                │
│  │ - URL path   │   │ /en.json     │                │
│  │ - Cookie     │   │ /vi.json     │                │
│  │ - Header     │   │ /ja.json     │                │
│  │ - Browser    │   │ (lazy load)  │                │
│  └──────┬──────┘   └──────┬───────┘                │
│         │                  │                         │
│    ┌────▼──────────────────▼─────┐                  │
│    │      i18n Runtime           │                  │
│    │  (react-i18next / FormatJS) │                  │
│    │                             │                  │
│    │  - String interpolation     │                  │
│    │  - Pluralization            │                  │
│    │  - Date/Number formatting   │                  │
│    │  - RTL support              │                  │
│    └─────────────────────────────┘                  │
└────────────────────────────────────────────────────┘
```

### 11.2. Considerations

| Concern | Details |
|---------|---------|
| String externalization | Không hardcode strings, dùng keys |
| Dynamic loading | Load translation files on-demand per locale |
| Pluralization | English: 1 item / 2 items. Tiếng Ả Rập: 6 dạng số nhiều |
| RTL layout | CSS `direction: rtl`, logical properties (`margin-inline-start`) |
| Date/Number format | `Intl.DateTimeFormat`, `Intl.NumberFormat` |
| SEO | Locale-based URLs (`/en/products`, `/vi/products`), `hreflang` tags |
| Currency | Format theo locale, exchange rates |
| Content expansion | German text dài hơn English ~30% → UI phải accommodate |

---

## 12. OFFLINE-FIRST & PWA

### 12.1. Service Worker Caching Patterns

| Pattern | Behavior | Best For |
|---------|----------|----------|
| Cache First | Luôn trả cache, update background | Static assets, fonts |
| Network First | Ưu tiên network, fallback cache | API data, dynamic content |
| Stale While Revalidate | Trả cache ngay, update background | Frequently updated content |
| Cache Only | Chỉ từ cache | Offline-critical assets |
| Network Only | Chỉ từ network | Non-cacheable requests |

### 12.2. Offline Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  UI      │────►│ Service      │────►│ Network  │
│ Layer    │     │ Worker       │     │          │
└──────────┘     └──────┬───────┘     └──────────┘
                        │
                 ┌──────▼───────┐
                 │ Cache API    │
                 │ + IndexedDB  │
                 └──────────────┘
```

**Offline data sync:**
1. User tạo action offline → Queue vào IndexedDB
2. Khi online → Replay queue lên server
3. Conflict resolution: Last-write-wins / Merge / Manual resolve

### 12.3. PWA Checklist

- [ ] HTTPS
- [ ] Web App Manifest (`manifest.json`)
- [ ] Service Worker registered
- [ ] Responsive design
- [ ] Offline fallback page
- [ ] App shell cached
- [ ] Install prompt handled
- [ ] Push notifications (optional)
- [ ] Background sync (optional)

---

## 13. MICRO-FRONTENDS

### 13.1. Approaches

| Approach | Isolation | Communication | Complexity |
|----------|-----------|---------------|------------|
| Module Federation (Webpack/Vite) | Medium | Shared state/events | Medium |
| Web Components | Strong | Custom events, attributes | Medium |
| iframes | Strongest | postMessage | Low |
| Build-time integration | None | Shared modules | Low |
| Server-side composition | Medium | Shared backend | High |

### 13.2. Khi nào dùng Micro-Frontends?

**Nên dùng:**
- Multiple teams independent deploy
- Legacy migration (strangler fig pattern)
- Very large application (50+ developers)
- Different tech stacks cần coexist

**Không nên dùng:**
- Small teams (< 5 developers)
- Single product team
- Shared UI cần consistency
- Performance-critical applications

### 13.3. Shared Concerns

```
┌────────────────────────────────────────────────────┐
│                App Shell / Container                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Shared: Auth, Routing, Theme, i18n, Analytics│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Team A   │  │ Team B   │  │ Team C   │         │
│  │ Product  │  │ Cart     │  │ User     │         │
│  │ Catalog  │  │ Checkout │  │ Profile  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
│  Communication: Custom Events / Event Bus            │
└────────────────────────────────────────────────────┘
```

---

## 14. TESTING & OBSERVABILITY

### 14.1. Testing Pyramid

```
          ┌─────────┐
          │  E2E    │  ← Ít nhất, chậm nhất, đắt nhất
          │ Tests   │     (Playwright, Cypress)
         ┌┴─────────┴┐
         │Integration │  ← Trung bình
         │  Tests     │     (Testing Library, MSW)
        ┌┴────────────┴┐
        │  Unit Tests   │  ← Nhiều nhất, nhanh nhất, rẻ nhất
        │               │     (Vitest, Jest)
        └───────────────┘
```

### 14.2. Observability Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Error Tracking | Sentry, Bugsnag | Catch & report runtime errors |
| Performance Monitoring | Lighthouse CI, SpeedCurve | Core Web Vitals tracking |
| Analytics | Google Analytics, Mixpanel | User behavior tracking |
| Logging | DataDog, LogRocket | Session replay, log aggregation |
| Alerting | PagerDuty, OpsGenie | Notify on threshold breach |

### 14.3. Monitoring Checklist

- [ ] Error rate monitoring (JS errors, API failures)
- [ ] Core Web Vitals tracking (LCP, INP, CLS)
- [ ] API latency monitoring (P50, P95, P99)
- [ ] Bundle size tracking per release
- [ ] User journey funnel tracking
- [ ] Real User Monitoring (RUM)
- [ ] Synthetic monitoring (scheduled tests)

---

## 15. DESIGN PATTERNS

### 15.1. Frontend-Specific Patterns

| Pattern | Mô tả | Use Case |
|---------|--------|----------|
| **Observer** | Object notify subscribers khi state thay đổi | Event systems, reactive state |
| **Pub/Sub** | Decoupled communication qua event bus | Cross-component events, analytics |
| **Module** | Encapsulate code, expose public API | Code organization, plugins |
| **Singleton** | 1 instance duy nhất | API client, WebSocket connection, store |
| **Factory** | Tạo objects mà không specify exact class | Component factories, theme providers |
| **Strategy** | Swap algorithms at runtime | Sorting, validation, rendering strategies |
| **Decorator** | Thêm behavior mà không modify original | HOC, middleware, interceptors |
| **Proxy** | Control access to another object | Caching proxy, validation proxy, lazy loading |
| **Facade** | Simplified interface cho complex subsystem | API wrapper, SDK |
| **Command** | Encapsulate actions as objects | Undo/Redo, action queues, offline sync |

### 15.2. State Management Patterns

| Pattern | Mô tả | Framework |
|---------|--------|-----------|
| **Flux** | Unidirectional data flow: Action → Dispatcher → Store → View | Redux |
| **MVVM** | Model-View-ViewModel, two-way binding | Vue, Angular |
| **MVC** | Model-View-Controller, separation of concerns | Backbone |
| **Atomic** | State split into independent atoms | Jotai, Recoil |
| **Proxy-based** | Direct mutation with reactive tracking | Valtio, MobX |
| **Signal-based** | Fine-grained reactivity without VDOM diffing | Solid, Preact Signals, Angular Signals |

### 15.3. React-Specific Patterns

| Pattern | Mô tả |
|---------|--------|
| **Custom Hooks** | Extract reusable logic |
| **Compound Components** | Components share implicit state |
| **Render Props** | Share code via function-as-child |
| **HOC** | Wrap component to add behavior |
| **Provider Pattern** | Inject dependencies via Context |
| **Controlled/Uncontrolled** | Parent manages state vs component manages itself |
| **Ref Forwarding** | Pass refs through component layers |
| **Error Boundaries** | Catch errors in component tree |

---

## 16. SCALABILITY

### 16.1. Four Dimensions of Frontend Scalability

```
┌──────────────────────────────────────────────────────┐
│                SCALABILITY DIMENSIONS                  │
│                                                        │
│  ┌────────────┐  ┌────────────┐                      │
│  │ DATA SCALE │  │FEATURE     │                      │
│  │            │  │SCALE       │                      │
│  │ 100 items  │  │ 5 pages    │                      │
│  │ → 1M items │  │ → 200 pages│                      │
│  │            │  │            │                      │
│  │ Solutions: │  │ Solutions: │                      │
│  │ Virtual    │  │ Code split │                      │
│  │ Pagination │  │ Lazy load  │                      │
│  │ IndexedDB  │  │ Modular    │                      │
│  └────────────┘  └────────────┘                      │
│                                                        │
│  ┌────────────┐  ┌────────────┐                      │
│  │ TEAM SCALE │  │DEVICE      │                      │
│  │            │  │SCALE       │                      │
│  │ 3 devs    │  │ Latest     │                      │
│  │ → 50 devs │  │ iPhone     │                      │
│  │            │  │ → $50      │                      │
│  │ Solutions: │  │ Android    │                      │
│  │ Micro-FE  │  │            │                      │
│  │ Design    │  │ Solutions: │                      │
│  │ system    │  │ Perf       │                      │
│  │ Monorepo  │  │ budget     │                      │
│  └────────────┘  │ Adaptive  │                      │
│                   │ loading   │                      │
│                   └────────────┘                      │
└──────────────────────────────────────────────────────┘
```

### 16.2. Handling Large Data

| Technique | Khi nào | Complexity |
|-----------|---------|------------|
| Pagination | < 10K items, traditional UI | Low |
| Infinite Scroll | Social feeds, product lists | Medium |
| Virtualization | 10K+ items in single view | Medium |
| Search/Filter | Reduce visible dataset | Low |
| IndexedDB | Large offline datasets | High |
| Web Workers | CPU-intensive processing | Medium |

### 16.3. Performance Budgets

```
Budget cho từng metric:

Total JS bundle:        < 300KB (gzipped)
Per-route JS:           < 100KB
Total CSS:              < 50KB
Hero image:             < 200KB
LCP:                    < 2.5s
INP:                    < 200ms
CLS:                    < 0.1
Time to Interactive:    < 5s (on slow 3G)
API response (P95):     < 500ms
```

---

## 17. CÂU HỎI THỰC HÀNH

### 17.1. Beginner Level

| # | Câu hỏi | Focus areas |
|---|---------|-------------|
| 1 | **Design an Autocomplete/Typeahead** | Debounce, caching, keyboard a11y, request cancellation |
| 2 | **Design an Image Carousel** | Touch/swipe, lazy load, a11y, transitions |
| 3 | **Design a Star Rating Widget** | Component API, a11y, half-star, read-only mode |
| 4 | **Design a Tooltip Component** | Positioning, overflow detection, a11y, portal |
| 5 | **Design a Modal/Dialog** | Focus trap, a11y, portal, scroll lock, animations |
| 6 | **Design a Dropdown Menu** | Keyboard nav, positioning, click outside, nested menus |
| 7 | **Design a Toast/Notification System** | Queue management, auto-dismiss, stacking, a11y |

### 17.2. Intermediate Level

| # | Câu hỏi | Focus areas |
|---|---------|-------------|
| 8 | **Design Facebook News Feed** | Infinite scroll, virtualization, real-time, optimistic updates |
| 9 | **Design an E-commerce Product Page** | SEO (SSR), image gallery, reviews, add-to-cart |
| 10 | **Design E-commerce Checkout Flow** | Multi-step form, validation, payment, error recovery |
| 11 | **Design Instagram Photo Sharing** | Image upload/crop, filters, feed layout, lazy load |
| 12 | **Design a Travel Booking (Airbnb)** | Search filters, map integration, date picker, responsive |
| 13 | **Design a Kanban Board (Trello)** | Drag-and-drop, real-time sync, optimistic reorder |
| 14 | **Design an Email Client (Gmail)** | List virtualization, thread view, offline, search |
| 15 | **Design a Poll Widget** | Real-time results, vote tracking, animations |

### 17.3. Advanced Level

| # | Câu hỏi | Focus areas |
|---|---------|-------------|
| 16 | **Design Google Docs (Collaborative Editor)** | CRDT/OT, real-time, conflict resolution, cursor tracking |
| 17 | **Design a Video Streaming App (Netflix/YouTube)** | Adaptive bitrate, buffering, video player, recommendation |
| 18 | **Design Pinterest (Masonry Layout)** | Masonry/waterfall layout, infinite scroll, image loading |
| 19 | **Design a Rich Text Editor** | ContentEditable, formatting, plugins, collaborative |
| 20 | **Design a Real-time Dashboard** | WebSocket, charting, data aggregation, time-series |
| 21 | **Design Google Maps** | Tile rendering, zoom levels, markers, search, routing |
| 22 | **Design an Analytics SDK** | Event batching, queue, offline storage, payload optimization |
| 23 | **Design a Chat Application (Slack/Messenger)** | WebSocket, message queue, threads, presence, search |
| 24 | **Design a Spreadsheet (Google Sheets)** | Cell rendering, formulas, virtualization, collaboration |
| 25 | **Design a Frontend Micro-frontend Platform** | Module Federation, routing, shared state, independent deploy |

### 17.4. Hướng dẫn giải mẫu: Design Autocomplete

```
1. REQUIREMENTS
   FR: User type → show suggestions → select suggestion → navigate
   NFR: < 100ms perceived latency, mobile support, a11y (WCAG AA)

2. ARCHITECTURE
   ┌─────────────────────────────────┐
   │          Autocomplete           │
   │  ┌──────────┐  ┌────────────┐  │
   │  │  Input   │  │ Suggestion │  │
   │  │  Field   │  │   List     │  │
   │  └──────────┘  └────────────┘  │
   └─────────────────────────────────┘
   │
   ┌▼────────────────────────────────┐
   │         Controller              │
   │  - Debounce input               │
   │  - Manage request lifecycle     │
   │  - Cache results                │
   │  - Keyboard navigation state    │
   └─────────────────────────────────┘
   │
   ┌▼────────────────────────────────┐
   │         API Service             │
   │  - GET /suggestions?q={query}   │
   │  - AbortController              │
   │  - Response caching             │
   └─────────────────────────────────┘

3. DATA MODEL
   State: { query, suggestions[], selectedIndex, isOpen, isLoading }
   Suggestion: { id, text, category?, icon? }

4. INTERFACE
   GET /api/suggestions?q={query}&limit=10
   → { suggestions: Suggestion[], hasMore: boolean }

5. OPTIMIZATIONS
   - Debounce 200-300ms
   - Cancel previous request (AbortController)
   - LRU cache (in-memory, 50-100 entries)
   - Highlight matching text
   - Keyboard: Arrow up/down, Enter select, Escape close
   - ARIA: role="combobox", aria-expanded, aria-activedescendant
   - Mobile: virtual keyboard aware, touch-friendly tap targets
   - Minimum query length (2-3 chars) trước khi fetch
   - Show recent searches khi input rỗng
```

---

## 18. TIÊU CHÍ ĐÁNH GIÁ

### 18.1. Interviewer đánh giá gì?

| Tiêu chí | Weight | Mô tả |
|-----------|--------|--------|
| **Problem Exploration** | 15% | Hỏi đúng câu hỏi, clarify requirements, identify constraints |
| **Architecture** | 25% | Component breakdown hợp lý, clean separation of concerns |
| **Technical Depth** | 25% | Performance, networking, a11y, security knowledge |
| **Trade-off Analysis** | 15% | Biết pros/cons, justify decisions, explore alternatives |
| **Product Sense** | 10% | UX awareness, user-centric thinking, edge cases |
| **Communication** | 10% | Clear explanation, structured thinking, good diagrams |

### 18.2. Signals of a Strong Candidate

**Senior signals:**
- Hỏi "why" trước khi hỏi "how"
- Đề cập trade-offs tự nhiên (không đợi hỏi)
- Consider scale từ đầu
- Đề cập a11y, security, error handling tự nhiên
- Vẽ diagram rõ ràng
- "Ownership-level thinking" — không chỉ implement mà còn consider maintenance

**Red flags:**
- Nhảy thẳng vào code/implementation
- Chỉ biết 1 solution cho mọi vấn đề
- Không đề cập edge cases, error states
- Dùng buzzwords mà không giải thích được
- Không vẽ diagram
- Không hỏi clarifying questions

---

## 19. TÀI LIỆU THAM KHẢO

### 19.1. Websites

| Resource | URL | Mô tả |
|----------|-----|--------|
| **GreatFrontEnd** | greatfrontend.com | Nền tảng #1 cho frontend interview prep, RADIO framework |
| **Frontend System Design Handbook** | systemdesignhandbook.com | Comprehensive guide cho frontend SD |
| **FrontendInterviews.dev** | frontendinterviews.dev | Architecture guide, question bank |
| **Patterns.dev** | patterns.dev | JavaScript & React design patterns |
| **web.dev** | web.dev | Google's web performance & best practices |
| **Frontend Masters** | frontendmasters.com | Video courses on advanced topics |

### 19.2. GitHub Repositories

| Repo | Mô tả |
|------|--------|
| `greatfrontend/awesome-front-end-system-design` | Curated list of FE system design resources |
| `nickytonline/awesome-frontend-system-design` | Community collection |
| `ArenBjworx/awesome-frontend-interview` | Interview prep collection |

### 19.3. Books

| Book | Author | Focus |
|------|--------|-------|
| **Front End System Design Guidebook** | Yangshun Tay (GreatFrontEnd) | RADIO framework, solved questions |
| **Designing Data-Intensive Applications** | Martin Kleppmann | Distributed systems fundamentals |
| **Web Performance in Action** | Jeremy Wagner | Performance optimization |
| **Inclusive Design Patterns** | Heydon Pickering | Accessible component design |

### 19.4. Practice Plan

**Tuần 1-2: Foundations**
- Đọc RADIO framework
- Ôn luyện: Rendering strategies, State management, Data fetching
- Practice: Autocomplete, Image Carousel, Modal

**Tuần 3-4: Intermediate**
- Ôn luyện: Performance, Caching, Networking
- Practice: News Feed, E-commerce, Chat App
- Mock interviews với bạn bè

**Tuần 5-6: Advanced**
- Ôn luyện: Security, A11y, Micro-frontends, Scalability
- Practice: Google Docs, Video Streaming, Dashboard
- Focus on trade-off analysis

**Tuần 7-8: Polish**
- Review tất cả notes
- Mock interviews (aim for 4-6 mock sessions)
- Focus on communication & diagram skills
- Time management practice (60-minute sessions)

---

> **Lưu ý quan trọng:** Frontend System Design Interview không phải về việc nhớ thuộc solutions,
> mà là về khả năng **phân tích vấn đề**, **đưa ra trade-offs**, và **communicate rõ ràng**.
> Hãy tập trung vào REASONING chứ không phải memorization.
>
> Chúc bạn ôn luyện tốt và phỏng vấn thành công!
