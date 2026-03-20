# ♿ ACCESSIBILITY GUIDE - HƯỚNG DẪN ACCESSIBILITY

> **Tài liệu chi tiết về Accessibility Best Practices cho dự án Shopee Clone**
>
> **Tác giả:** AI Assistant | **Ngày:** 20/03/2026 | **Version:** 1.0

---

## 📑 MỤC LỤC

1. [Giới thiệu về Accessibility](#1-giới-thiệu-về-accessibility)
2. [WCAG 2.1 Guidelines](#2-wcag-21-guidelines)
3. [Semantic HTML](#3-semantic-html)
4. [ARIA Attributes](#4-aria-attributes)
5. [Keyboard Navigation](#5-keyboard-navigation)
6. [Screen Reader Support](#6-screen-reader-support)
7. [Color Contrast & Visual Design](#7-color-contrast--visual-design)
8. [Focus Management](#8-focus-management)
9. [Form Accessibility](#9-form-accessibility)
10. [Image Accessibility](#10-image-accessibility)
11. [Testing Tools](#11-testing-tools)
12. [Accessibility Checklist](#12-accessibility-checklist)

---

## 1. GIỚI THIỆU VỀ ACCESSIBILITY

### 1.1. Accessibility là gì?

**Accessibility (A11y)** là việc thiết kế và phát triển web để mọi người, bao gồm cả người khuyết tật, có thể sử dụng được.

### 1.2. Tại sao Accessibility quan trọng?

- **Pháp lý**: Nhiều quốc gia yêu cầu websites phải accessible
- **Đạo đức**: Mọi người đều có quyền truy cập thông tin
- **Kinh doanh**: Mở rộng audience, tăng conversion rate
- **SEO**: Semantic HTML giúp SEO tốt hơn
- **UX**: Accessibility tốt = UX tốt cho tất cả users

### 1.3. Các loại khuyết tật cần hỗ trợ

- **Visual**: Mù, yếu thị, mù màu
- **Auditory**: Điếc, khó nghe
- **Motor**: Khó sử dụng chuột, keyboard only
- **Cognitive**: Khó tập trung, khó đọc, khó hiểu

---

## 2. WCAG 2.1 GUIDELINES

### 2.1. 4 Nguyên tắc POUR

**WCAG 2.1** (Web Content Accessibility Guidelines) dựa trên 4 nguyên tắc:

#### 1. Perceivable (Có thể nhận biết)

Content phải được trình bày theo cách mà users có thể nhận biết được.

```typescript
// ✅ GOOD: Alt text cho images
<img src="product.jpg" alt="iPhone 15 Pro Max 256GB màu xanh" />

// ❌ BAD: Không có alt text
<img src="product.jpg" />
```

#### 2. Operable (Có thể vận hành)

Interface phải có thể vận hành được bằng nhiều cách (keyboard, mouse, touch, voice).

```typescript
// ✅ GOOD: Keyboard accessible button
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Add to Cart
</button>

// ❌ BAD: Div không thể keyboard navigate
<div onClick={handleClick}>Add to Cart</div>
```

#### 3. Understandable (Có thể hiểu được)

Content và interface phải dễ hiểu.

```typescript
// ✅ GOOD: Clear error message
<span role="alert" aria-live="polite">
  Email không hợp lệ. Vui lòng nhập email đúng định dạng.
</span>

// ❌ BAD: Vague error
<span>Error</span>
```

#### 4. Robust (Bền vững)

Content phải tương thích với nhiều technologies, bao gồm assistive technologies.

```typescript
// ✅ GOOD: Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// ❌ BAD: Div soup
<div class="nav">
  <div class="item">Home</div>
</div>
```

### 2.2. 3 Levels of Conformance

- **Level A**: Minimum level (must have)
- **Level AA**: Mid level (should have) - **Target cho dự án**
- **Level AAA**: Highest level (nice to have)

---

## 3. SEMANTIC HTML

### 3.1. Sử dụng đúng HTML elements

```typescript
// ✅ GOOD: Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Product Title</h1>
    <p>Product description...</p>
  </article>
</main>

<footer>
  <p>&copy; 2026 Shopee Clone</p>
</footer>

// ❌ BAD: Div soup
<div class="header">
  <div class="nav">
    <div class="item">Home</div>
  </div>
</div>
```

### 3.2. Heading Hierarchy

```typescript
// ✅ GOOD: Proper heading hierarchy
<h1>Shopee Clone</h1>
  <h2>Electronics</h2>
    <h3>Smartphones</h3>
      <h4>iPhone</h4>
    <h3>Laptops</h3>

// ❌ BAD: Skipping levels
<h1>Shopee Clone</h1>
  <h4>Electronics</h4> {/* Skipped h2, h3 */}
```

### 3.3. Buttons vs Links

```typescript
// ✅ GOOD: Button cho actions
<button onClick={handleAddToCart}>Add to Cart</button>

// ✅ GOOD: Link cho navigation
<a href="/products">View Products</a>

// ❌ BAD: Link cho actions
<a href="#" onClick={handleAddToCart}>Add to Cart</a>

// ❌ BAD: Button cho navigation
<button onClick={() => navigate('/products')}>View Products</button>
```

---

## 4. ARIA ATTRIBUTES

### 4.1. ARIA Roles

**ARIA** (Accessible Rich Internet Applications) giúp screen readers hiểu content tốt hơn.

```typescript
// Navigation
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Search
<form role="search" aria-label="Search products">
  <input type="search" aria-label="Search query" />
  <button type="submit">Search</button>
</form>

// Alert
<div role="alert" aria-live="polite">
  Product added to cart successfully!
</div>

// Dialog/Modal
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Delete</h2>
  <p>Are you sure you want to delete this item?</p>
</div>
```

### 4.2. ARIA Labels

```typescript
// aria-label: Cung cấp label cho element
<button aria-label="Close modal" onClick={handleClose}>
  <XIcon />
</button>

// aria-labelledby: Reference đến element khác
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
</div>

// aria-describedby: Cung cấp description
<input
  type="email"
  aria-describedby="email-help"
/>
<span id="email-help">We'll never share your email</span>
```

### 4.3. ARIA States

```typescript
// aria-expanded: Cho collapsible content
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
  onClick={toggleDropdown}
>
  Menu
</button>
<div id="dropdown-menu" hidden={!isOpen}>
  {/* Menu items */}
</div>

// aria-selected: Cho tabs
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'tab1'}
    aria-controls="panel1"
  >
    Tab 1
  </button>
</div>

// aria-checked: Cho checkboxes
<div
  role="checkbox"
  aria-checked={isChecked}
  onClick={toggleCheck}
  tabIndex={0}
>
  {isChecked ? <CheckIcon /> : null}
</div>
```

### 4.4. ARIA Live Regions

```typescript
// Thông báo cho screen reader khi content thay đổi
<div aria-live="polite" aria-atomic="true">
  {cartCount} items in cart
</div>

// aria-live="polite": Đợi screen reader đọc xong
// aria-live="assertive": Ngắt ngay lập tức
// aria-atomic="true": Đọc toàn bộ content, không chỉ phần thay đổi
```

---

## 5. KEYBOARD NAVIGATION

### 5.1. Tab Order

```typescript
// ✅ GOOD: Logical tab order
<form>
  <input type="text" tabIndex={0} /> {/* Tab 1 */}
  <input type="email" tabIndex={0} /> {/* Tab 2 */}
  <button type="submit" tabIndex={0}> {/* Tab 3 */}
    Submit
  </button>
</form>

// ❌ BAD: Custom tab order (avoid unless necessary)
<input type="text" tabIndex={3} />
<input type="email" tabIndex={1} />
<button tabIndex={2}>Submit</button>
```

### 5.2. Keyboard Event Handlers

```typescript
// src/components/AccessibleButton.tsx
const AccessibleButton = ({ onClick, children }: Props) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter or Space key
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </button>
  )
}
```

### 5.3. Skip Links

```typescript
// src/components/SkipLink.tsx
const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 999,
        padding: '1rem',
        backgroundColor: '#000',
        color: '#fff',
        textDecoration: 'none'
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px'
      }}
    >
      Skip to main content
    </a>
  )
}

// Usage in layout
<SkipLink />
<Header />
<main id="main-content">
  {/* Content */}
</main>
```

### 5.4. Focus Trap trong Modal

```typescript
// src/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react'

export const useFocusTrap = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const container = containerRef.current
    if (!container) return

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus first element
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return containerRef
}

// Usage
const Modal = ({ isOpen, onClose }: Props) => {
  const containerRef = useFocusTrap(isOpen)

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  )
}
```

---

## 6. SCREEN READER SUPPORT

### 6.1. Visually Hidden Text

```typescript
// src/utils/visuallyHidden.ts
export const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
}

// Usage
<button>
  <TrashIcon />
  <span style={visuallyHiddenStyles}>Delete item</span>
</button>
```

### 6.2. Screen Reader Only Content

```typescript
// src/components/ScreenReaderOnly.tsx
const ScreenReaderOnly = ({ children }: { children: React.ReactNode }) => {
  return (
    <span
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      {children}
    </span>
  )
}

// Usage
<button>
  <HeartIcon />
  <ScreenReaderOnly>Add to wishlist</ScreenReaderOnly>
</button>
```

### 6.3. Announce Dynamic Content

```typescript
// src/components/LiveRegion.tsx
const LiveRegion = ({ message, priority = 'polite' }: Props) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      style={visuallyHiddenStyles}
    >
      {message}
    </div>
  )
}

// Usage
const Cart = () => {
  const [announcement, setAnnouncement] = useState('')

  const handleAddToCart = () => {
    // Add to cart logic
    setAnnouncement('Product added to cart')
    setTimeout(() => setAnnouncement(''), 3000)
  }

  return (
    <>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <LiveRegion message={announcement} />
    </>
  )
}
```

---

## 7. COLOR CONTRAST & VISUAL DESIGN

### 7.1. WCAG Color Contrast Requirements

**WCAG AA (Target):**
- Normal text (< 18pt): Contrast ratio ≥ 4.5:1
- Large text (≥ 18pt or bold ≥ 14pt): Contrast ratio ≥ 3:1

**WCAG AAA:**
- Normal text: Contrast ratio ≥ 7:1
- Large text: Contrast ratio ≥ 4.5:1

```typescript
// ✅ GOOD: High contrast
<button
  style={{
    backgroundColor: '#ee4d2d', // Shopee orange
    color: '#ffffff' // White text
  }}
>
  Add to Cart
</button>
// Contrast ratio: 4.52:1 (Pass AA)

// ❌ BAD: Low contrast
<button
  style={{
    backgroundColor: '#ffcccc', // Light pink
    color: '#ffffff' // White text
  }}
>
  Add to Cart
</button>
// Contrast ratio: 1.5:1 (Fail)
```

### 7.2. Don't Rely on Color Alone

```typescript
// ❌ BAD: Color only
<span style={{ color: 'red' }}>Error</span>
<span style={{ color: 'green' }}>Success</span>

// ✅ GOOD: Color + icon + text
<span style={{ color: 'red' }}>
  <ErrorIcon aria-hidden="true" />
  <span>Error: Invalid email</span>
</span>

<span style={{ color: 'green' }}>
  <SuccessIcon aria-hidden="true" />
  <span>Success: Email sent</span>
</span>
```

### 7.3. Focus Indicators

```css
/* ✅ GOOD: Visible focus indicator */
button:focus-visible {
  outline: 2px solid #ee4d2d;
  outline-offset: 2px;
}

/* ❌ BAD: Removing focus outline */
button:focus {
  outline: none; /* NEVER DO THIS! */
}
```

---

## 8. FOCUS MANAGEMENT

### 8.1. Focus on Route Change

```typescript
// src/hooks/useFocusOnRouteChange.ts
import { useEffect } from 'react'
import { useLocation } from 'react-router'

export const useFocusOnRouteChange = () => {
  const location = useLocation()

  useEffect(() => {
    // Focus on main content after route change
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }, [location.pathname])
}

// Usage in App.tsx
const App = () => {
  useFocusOnRouteChange()

  return (
    <div>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
```

### 8.2. Focus on Modal Open

```typescript
// src/components/Modal.tsx
const Modal = ({ isOpen, onClose, title, children }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus on modal
      modalRef.current?.focus()
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

---

## 9. FORM ACCESSIBILITY

### 9.1. Label Association

```typescript
// ✅ GOOD: Explicit label association
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  name="email"
  aria-required="true"
/>

// ✅ GOOD: Implicit label association
<label>
  Email
  <input type="email" name="email" aria-required="true" />
</label>

// ❌ BAD: No label
<input type="email" placeholder="Email" />
```

### 9.2. Error Messages

```typescript
// src/components/AccessibleInput.tsx
const AccessibleInput = ({ label, error, ...props }: Props) => {
  const inputId = useId()
  const errorId = `${inputId}-error`

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ color: 'red' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

// Usage
<AccessibleInput
  label="Email"
  type="email"
  error={errors.email?.message}
/>
```

### 9.3. Required Fields

```typescript
// ✅ GOOD: aria-required + visual indicator
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
/>

// ❌ BAD: Visual indicator only
<label htmlFor="email">Email *</label>
<input id="email" type="email" />
```

### 9.4. Fieldset & Legend

```typescript
// ✅ GOOD: Group related inputs
<fieldset>
  <legend>Shipping Address</legend>
  <label htmlFor="street">Street</label>
  <input id="street" type="text" />

  <label htmlFor="city">City</label>
  <input id="city" type="text" />
</fieldset>
```

---

## 10. IMAGE ACCESSIBILITY

### 10.1. Alt Text Best Practices

```typescript
// ✅ GOOD: Descriptive alt text
<img
  src="iphone-15-pro.jpg"
  alt="iPhone 15 Pro Max 256GB màu xanh titanium"
/>

// ✅ GOOD: Decorative image (empty alt)
<img
  src="decorative-pattern.svg"
  alt=""
  role="presentation"
/>

// ❌ BAD: No alt text
<img src="product.jpg" />

// ❌ BAD: Redundant alt text
<img src="image.jpg" alt="Image of product" />
```

### 10.2. Complex Images

```typescript
// ✅ GOOD: Long description for complex images
<figure>
  <img
    src="sales-chart.png"
    alt="Sales chart showing growth from 2020 to 2026"
    aria-describedby="chart-description"
  />
  <figcaption id="chart-description">
    The chart shows sales growth from $1M in 2020 to $5M in 2026,
    with steady increase each year.
  </figcaption>
</figure>
```

### 10.3. Background Images

```typescript
// ❌ BAD: Important content in background image
<div style={{ backgroundImage: 'url(banner.jpg)' }}>
  {/* No text alternative */}
</div>

// ✅ GOOD: Add text alternative
<div
  style={{ backgroundImage: 'url(banner.jpg)' }}
  role="img"
  aria-label="Summer sale: Up to 50% off on all products"
>
  {/* Visual content */}
</div>
```

---

## 11. TESTING TOOLS

### 11.1. Automated Testing

```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/react
```

```typescript
// src/main.tsx (Development only)
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000)
  })
}
```

### 11.2. Manual Testing Checklist

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate menus

**Screen Reader:**
- [ ] Test với NVDA (Windows) hoặc VoiceOver (Mac)
- [ ] All content được đọc đúng
- [ ] Headings có hierarchy đúng
- [ ] Form labels được announce

**Visual:**
- [ ] Zoom to 200% - content vẫn readable
- [ ] Color contrast pass WCAG AA
- [ ] Focus indicators visible
- [ ] No content loss khi zoom

### 11.3. Browser Extensions

- **axe DevTools**: Automated accessibility testing
- **WAVE**: Visual feedback về accessibility issues
- **Lighthouse**: Accessibility audit trong Chrome DevTools
- **Color Contrast Analyzer**: Check color contrast ratios

---

## 12. ACCESSIBILITY CHECKLIST

### ✅ Semantic HTML
- [ ] Sử dụng semantic elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [ ] Heading hierarchy đúng (h1 → h2 → h3)
- [ ] Buttons cho actions, links cho navigation
- [ ] Lists sử dụng `<ul>`, `<ol>`, `<li>`

### ✅ ARIA
- [ ] ARIA roles khi cần thiết
- [ ] ARIA labels cho icon buttons
- [ ] ARIA states (expanded, selected, checked)
- [ ] ARIA live regions cho dynamic content

### ✅ Keyboard Navigation
- [ ] Tất cả interactive elements có thể tab được
- [ ] Tab order logical
- [ ] Skip links implemented
- [ ] Focus trap trong modals
- [ ] Keyboard shortcuts documented

### ✅ Screen Reader
- [ ] Alt text cho tất cả images
- [ ] Visually hidden text cho icon-only buttons
- [ ] Form labels associated với inputs
- [ ] Error messages announced
- [ ] Loading states announced

### ✅ Visual Design
- [ ] Color contrast ≥ 4.5:1 (normal text)
- [ ] Color contrast ≥ 3:1 (large text)
- [ ] Don't rely on color alone
- [ ] Focus indicators visible
- [ ] Text resizable to 200%

### ✅ Forms
- [ ] Labels associated với inputs
- [ ] Required fields marked
- [ ] Error messages descriptive
- [ ] Fieldsets cho grouped inputs
- [ ] Autocomplete attributes

### ✅ Testing
- [ ] Automated testing với axe-core
- [ ] Manual keyboard testing
- [ ] Screen reader testing
- [ ] Lighthouse accessibility score ≥ 90

---

**Kết luận:**

Accessibility không phải là "nice to have", mà là **requirement**. Hãy:
- Implement accessibility từ đầu, không phải sau
- Test với real users (bao gồm người khuyết tật)
- Keep learning và improving
- Educate team về accessibility

**Tài liệu tham khảo:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [React Accessibility](https://react.dev/learn/accessibility)
