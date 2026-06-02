# 🖥️ SERVER-SIDE RENDERING (SSR) - RENDER PHÍA SERVER

> **Tài liệu chi tiết về Server-side Rendering cho dự án Shopee Clone**
>
> **Tác giả:** AI Assistant | **Ngày:** 20/03/2026 | **Version:** 1.0

---

## 📑 MỤC LỤC

1. [Giới thiệu về SSR](#1-giới-thiệu-về-ssr)
2. [SSR vs CSR vs SSG](#2-ssr-vs-csr-vs-ssg)
3. [React Server Components](#3-react-server-components)
4. [SSR với Vite](#4-ssr-với-vite)
5. [Hydration](#5-hydration)
6. [Streaming SSR](#6-streaming-ssr)
7. [Data Fetching Strategies](#7-data-fetching-strategies)
8. [SEO Optimization](#8-seo-optimization)
9. [Performance Optimization](#9-performance-optimization)
10. [Best Practices](#10-best-practices)

---

## 1. GIỚI THIỆU VỀ SSR

### 1.1. SSR là gì?

**Server-Side Rendering (SSR)** là kỹ thuật render React components trên server thành HTML, sau đó gửi về client.

### 1.2. Tại sao cần SSR?

**Problems với CSR (Client-Side Rendering):**

- **SEO**: Search engines khó crawl JavaScript-heavy sites
- **Performance**: Slow initial page load (phải download, parse, execute JS)
- **User Experience**: Blank screen cho đến khi JS load xong

**Benefits của SSR:**

- **Better SEO**: HTML content available ngay lập tức
- **Faster First Contentful Paint (FCP)**: Users thấy content nhanh hơn
- **Better Performance on slow devices**: Server render nhanh hơn client
- **Social Media Sharing**: Meta tags available cho preview

### 1.3. Trade-offs

**Pros:**

- ✅ Better SEO
- ✅ Faster initial load
- ✅ Better UX on slow connections

**Cons:**

- ❌ Increased server load
- ❌ More complex setup
- ❌ Slower Time to Interactive (TTI)
- ❌ Higher hosting costs

---

## 2. SSR VS CSR VS SSG

### 2.1. Client-Side Rendering (CSR)

```
User Request → Server → HTML Shell + JS Bundle → Browser
                                                    ↓
                                            Execute JS → Render
```

**Characteristics:**

- Server chỉ gửi HTML shell + JS bundle
- Browser execute JS để render content
- Slow initial load, fast subsequent navigations

**Use cases:**

- Admin dashboards
- Internal tools
- Apps không cần SEO

### 2.2. Server-Side Rendering (SSR)

```
User Request → Server → Fetch Data → Render HTML → Browser
                                                      ↓
                                                  Hydrate
```

**Characteristics:**

- Server render HTML với data
- Browser nhận HTML đã render
- Fast initial load, hydration required

**Use cases:**

- E-commerce sites (Shopee)
- News sites
- Content-heavy sites cần SEO

### 2.3. Static Site Generation (SSG)

```
Build Time → Fetch Data → Generate HTML → Deploy
User Request → CDN → Pre-rendered HTML → Browser
```

**Characteristics:**

- HTML generated tại build time
- Serve static files từ CDN
- Fastest load time, không có server rendering

**Use cases:**

- Blogs
- Documentation sites
- Marketing pages

### 2.4. Incremental Static Regeneration (ISR)

```
User Request → CDN → Stale HTML (if exists)
                ↓
            Background Revalidation → Update Cache
```

**Characteristics:**

- Combine benefits của SSG và SSR
- Serve stale content while revalidating
- Best of both worlds

**Use cases:**

- E-commerce product pages
- News articles
- Content thay đổi không thường xuyên

### 2.5. So sánh

| Feature             | CSR     | SSR     | SSG          | ISR          |
| ------------------- | ------- | ------- | ------------ | ------------ |
| **SEO**             | ❌ Poor | ✅ Good | ✅ Excellent | ✅ Excellent |
| **Initial Load**    | ❌ Slow | ✅ Fast | ✅ Fastest   | ✅ Fastest   |
| **TTI**             | ✅ Fast | ❌ Slow | ✅ Fast      | ✅ Fast      |
| **Server Load**     | ✅ Low  | ❌ High | ✅ None      | ⚠️ Medium    |
| **Dynamic Content** | ✅ Yes  | ✅ Yes  | ❌ No        | ⚠️ Delayed   |
| **Hosting Cost**    | ✅ Low  | ❌ High | ✅ Low       | ⚠️ Medium    |

---

## 3. REACT SERVER COMPONENTS

### 3.1. Khái niệm

**React Server Components (RSC)** là components render exclusively trên server, không ship JavaScript to client.

### 3.2. Server Components vs Client Components

**Server Components:**

```typescript
// app/ProductList.server.tsx
import { getProducts } from './api'

// Server Component (default)
export default async function ProductList() {
  // Fetch data directly on server
  const products = await getProducts()

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**Client Components:**

```typescript
// app/AddToCartButton.client.tsx
'use client' // Mark as Client Component

import { useState } from 'react'

export default function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await addToCart(productId)
    setLoading(false)
  }

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}
```

### 3.3. Khi nào dùng Server Components?

**✅ Server Components:**

- Fetch data
- Access backend resources (database, file system)
- Keep sensitive information on server (API keys, tokens)
- Large dependencies (không ship to client)

**✅ Client Components:**

- Interactivity (onClick, onChange)
- State management (useState, useReducer)
- Effects (useEffect)
- Browser APIs (localStorage, window)
- Custom hooks

### 3.4. Composition Pattern

```typescript
// app/ProductDetail.server.tsx (Server Component)
import AddToCartButton from './AddToCartButton.client'

export default async function ProductDetail({ id }: { id: string }) {
  // Fetch on server
  const product = await getProduct(id)

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Client Component for interactivity */}
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

---

## 4. SSR VỚI VITE

### 4.1. Setup SSR với Vite

**File structure:**

```
shopee-ssr/
├── src/
│   ├── entry-client.tsx    # Client entry
│   ├── entry-server.tsx    # Server entry
│   ├── App.tsx
│   └── pages/
├── server.js               # Express server
├── vite.config.ts
└── package.json
```

### 4.2. Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Generate manifest for production
    manifest: true,
    rollupOptions: {
      // Separate entry for server
      input: {
        client: './src/entry-client.tsx',
        server: './src/entry-server.tsx',
      },
    },
  },
  ssr: {
    // Externalize dependencies for SSR
    noExternal: ['react', 'react-dom'],
  },
})
```

### 4.3. Server Entry

```typescript
// src/entry-server.tsx
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'

export function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  )

  return { html }
}
```

### 4.4. Client Entry

```typescript
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

hydrateRoot(
  document.getElementById('root')!,
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

### 4.5. Express Server

```typescript
// server.js
import express from 'express'
import { createServer as createViteServer } from 'vite'
import fs from 'fs'
import path from 'path'

const app = express()

// Development mode
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl

    try {
      // Load HTML template
      let template = fs.readFileSync(path.resolve('./index.html'), 'utf-8')

      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template)

      // Load server entry
      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')

      // Render app HTML
      const { html: appHtml } = render(url)

      // Inject app HTML into template
      const html = template.replace('<!--app-html-->', appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })
}
// Production mode
else {
  app.use(express.static('dist/client'))

  app.use('*', async (req, res) => {
    const url = req.originalUrl

    try {
      const template = fs.readFileSync(path.resolve('dist/client/index.html'), 'utf-8')

      const { render } = await import('./dist/server/entry-server.js')
      const { html: appHtml } = render(url)

      const html = template.replace('<!--app-html-->', appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      console.error(e)
      res.status(500).end(e.message)
    }
  })
}

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### 4.6. HTML Template

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shopee Clone</title>
  </head>
  <body>
    <div id="root"><!--app-html--></div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>
```

---

## 5. HYDRATION

### 5.1. Khái niệm

**Hydration** là quá trình React "attach" event listeners và state vào server-rendered HTML.

```
Server → HTML (static) → Browser
                           ↓
                    Hydration (attach JS)
                           ↓
                    Interactive App
```

### 5.2. Hydration Mismatch

**Problem:**

```typescript
// ❌ BAD: Server và client render khác nhau
const Component = () => {
  // Server: undefined, Client: actual date
  const date = new Date().toLocaleString()

  return <div>{date}</div>
}
```

**Solution:**

```typescript
// ✅ GOOD: Consistent rendering
const Component = () => {
  const [date, setDate] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client
    setDate(new Date().toLocaleString())
  }, [])

  return <div>{date || 'Loading...'}</div>
}
```

### 5.3. Selective Hydration

```typescript
// React 18: Selective Hydration
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

const App = () => {
  return (
    <div>
      <Header /> {/* Hydrate immediately */}
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent /> {/* Hydrate when needed */}
      </Suspense>
    </div>
  )
}
```

---

## 6. STREAMING SSR

### 6.1. Khái niệm

**Streaming SSR** cho phép server gửi HTML chunks dần dần thay vì đợi toàn bộ page render xong.

```
Traditional SSR:
Server → [Wait for all data] → Send complete HTML

Streaming SSR:
Server → Send HTML shell → Stream components as ready
```

### 6.2. Implementation với React 18

```typescript
// src/entry-server.tsx
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'

export function render(url: string, res: Response) {
  const { pipe } = renderToPipeableStream(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
    {
      onShellReady() {
        // Shell ready, start streaming
        res.setHeader('Content-Type', 'text/html')
        pipe(res)
      },
      onError(error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
      }
    }
  )
}
```

### 6.3. Suspense Boundaries

```typescript
// app/ProductDetail.tsx
import { Suspense } from 'react'

const ProductDetail = ({ id }: { id: string }) => {
  return (
    <div>
      <ProductInfo id={id} /> {/* Render immediately */}

      <Suspense fallback={<div>Loading reviews...</div>}>
        <ProductReviews id={id} /> {/* Stream when ready */}
      </Suspense>

      <Suspense fallback={<div>Loading recommendations...</div>}>
        <ProductRecommendations id={id} /> {/* Stream when ready */}
      </Suspense>
    </div>
  )
}
```

---

## 7. DATA FETCHING STRATEGIES

### 7.1. Fetch on Server

```typescript
// src/pages/ProductList.server.tsx
export default async function ProductList() {
  // Fetch on server
  const products = await fetch('https://api.shopee.com/products').then((res) =>
    res.json()
  )

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 7.2. Parallel Data Fetching

```typescript
// Fetch multiple data sources in parallel
export default async function ProductDetail({ id }: { id: string }) {
  const [product, reviews, recommendations] = await Promise.all([
    getProduct(id),
    getReviews(id),
    getRecommendations(id)
  ])

  return (
    <div>
      <ProductInfo product={product} />
      <ProductReviews reviews={reviews} />
      <ProductRecommendations recommendations={recommendations} />
    </div>
  )
}
```

### 7.3. Waterfall vs Parallel

```typescript
// ❌ BAD: Waterfall (sequential)
export default async function ProductDetail({ id }: { id: string }) {
  const product = await getProduct(id)
  const reviews = await getReviews(id) // Wait for product first
  const recommendations = await getRecommendations(id) // Wait for reviews

  return <div>...</div>
}

// ✅ GOOD: Parallel
export default async function ProductDetail({ id }: { id: string }) {
  const [product, reviews, recommendations] = await Promise.all([
    getProduct(id),
    getReviews(id),
    getRecommendations(id)
  ])

  return <div>...</div>
}
```

### 7.4. Deferred Data Loading

```typescript
// Load critical data first, defer non-critical
export default async function ProductDetail({ id }: { id: string }) {
  // Critical data
  const product = await getProduct(id)

  return (
    <div>
      <ProductInfo product={product} />

      {/* Defer non-critical data */}
      <Suspense fallback={<div>Loading reviews...</div>}>
        <DeferredReviews id={id} />
      </Suspense>
    </div>
  )
}

async function DeferredReviews({ id }: { id: string }) {
  const reviews = await getReviews(id)
  return <ProductReviews reviews={reviews} />
}
```

---

## 8. SEO OPTIMIZATION

### 8.1. Meta Tags

```typescript
// src/components/SEO.tsx
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  image?: string
  url?: string
}

export const SEO = ({ title, description, image, url }: SEOProps) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph (Facebook) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}

// Usage
const ProductDetail = ({ product }: { product: Product }) => {
  return (
    <>
      <SEO
        title={`${product.name} - Shopee Clone`}
        description={product.description}
        image={product.image}
        url={`https://shopee.com/products/${product.id}`}
      />
      <div>{/* Product content */}</div>
    </>
  )
}
```

### 8.2. Structured Data (JSON-LD)

```typescript
// src/components/StructuredData.tsx
interface ProductStructuredDataProps {
  product: Product
}

export const ProductStructuredData = ({ product }: ProductStructuredDataProps) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

### 8.3. Canonical URLs

```typescript
<Helmet>
  <link rel="canonical" href={`https://shopee.com/products/${product.id}`} />
</Helmet>
```

---

## 9. PERFORMANCE OPTIMIZATION

### 9.1. Code Splitting

```typescript
// Lazy load non-critical components
const ProductReviews = lazy(() => import('./ProductReviews'))

const ProductDetail = () => {
  return (
    <div>
      <ProductInfo />
      <Suspense fallback={<div>Loading reviews...</div>}>
        <ProductReviews />
      </Suspense>
    </div>
  )
}
```

### 9.2. Caching Strategies

```typescript
// server.js
import { createCache } from 'node-cache'

const cache = createCache({ stdTTL: 600 }) // 10 minutes

app.use('*', async (req, res) => {
  const url = req.originalUrl

  // Check cache
  const cached = cache.get(url)
  if (cached) {
    return res.status(200).set({ 'Content-Type': 'text/html' }).end(cached)
  }

  // Render
  const html = await renderPage(url)

  // Cache result
  cache.set(url, html)

  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})
```

### 9.3. Resource Hints

```html
<!-- Preconnect to API -->
<link rel="preconnect" href="https://api.shopee.com" />

<!-- Prefetch next page -->
<link rel="prefetch" href="/products/123" />

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

---

## 10. BEST PRACTICES

### 10.1. Do's

✅ **Use SSR for:**

- E-commerce product pages
- Content-heavy pages
- Pages cần SEO

✅ **Optimize:**

- Use streaming SSR
- Implement caching
- Code splitting
- Resource hints

✅ **SEO:**

- Meta tags
- Structured data
- Canonical URLs
- Sitemap

### 10.2. Don'ts

❌ **Avoid:**

- SSR cho admin dashboards
- SSR cho highly interactive apps
- Fetching data on client after SSR (double fetch)
- Hydration mismatches

### 10.3. Monitoring

```typescript
// Track SSR performance
app.use('*', async (req, res) => {
  const start = Date.now()

  const html = await renderPage(req.originalUrl)

  const duration = Date.now() - start
  console.log(`SSR took ${duration}ms for ${req.originalUrl}`)

  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})
```

---

**Kết luận:**

SSR là powerful technique cho SEO và performance, nhưng cần cân nhắc trade-offs:

**Khi nào dùng SSR:**

- E-commerce sites
- Content-heavy sites
- SEO là priority
- Slow client devices

**Khi nào dùng CSR:**

- Admin dashboards
- Internal tools
- Highly interactive apps
- SEO không quan trọng

**Khi nào dùng SSG:**

- Blogs
- Documentation
- Marketing pages
- Content ít thay đổi

**Tài liệu tham khảo:**

- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Vite SSR](https://vitejs.dev/guide/ssr.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [Web.dev - Rendering on the Web](https://web.dev/rendering-on-the-web/)
