# 🔒 SECURITY BEST PRACTICES - HƯỚNG DẪN BẢO MẬT

> **Tài liệu chi tiết về Security Best Practices cho dự án Shopee Clone**
>
> **Tác giả:** AI Assistant | **Ngày:** 20/03/2026 | **Version:** 1.0

---

## 📑 MỤC LỤC

1. [XSS Prevention](#1-xss-prevention)
2. [CSRF Protection](#2-csrf-protection)
3. [Authentication Security](#3-authentication-security)
4. [Authorization & Access Control](#4-authorization--access-control)
5. [Input Validation & Sanitization](#5-input-validation--sanitization)
6. [Secure HTTP Headers](#6-secure-http-headers)
7. [Content Security Policy](#7-content-security-policy)
8. [HTTPS & SSL/TLS](#8-https--ssltls)
9. [Dependency Security](#9-dependency-security)
10. [OWASP Top 10](#10-owasp-top-10)
11. [Security Checklist](#11-security-checklist)

---

## 1. XSS PREVENTION

### 1.1. Khái niệm XSS (Cross-Site Scripting)

**XSS** là lỗ hổng cho phép attacker inject malicious scripts vào web pages.

**3 loại XSS:**
- **Stored XSS**: Script được lưu trong database
- **Reflected XSS**: Script trong URL parameters
- **DOM-based XSS**: Script thực thi trong DOM

### 1.2. React Built-in Protection

React tự động escape content trong JSX:

```typescript
// ✅ SAFE: React auto-escapes
const userInput = '<script>alert("XSS")</script>'
return <div>{userInput}</div>
// Renders: &lt;script&gt;alert("XSS")&lt;/script&gt;

// ❌ DANGEROUS: dangerouslySetInnerHTML
return <div dangerouslySetInnerHTML={{ __html: userInput }} />
// Executes the script!
```

### 1.3. Sanitize HTML Content

**File:** `src/utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify'

// Sanitize HTML trước khi render
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  })
}

// Usage trong component
const ProductDescription = ({ description }: { description: string }) => {
  const cleanHTML = sanitizeHTML(description)

  return (
    <div
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
      className="product-description"
    />
  )
}
```

### 1.4. URL Sanitization

```typescript
// ❌ DANGEROUS: User-controlled URL
<a href={userInput}>Click here</a>

// ✅ SAFE: Validate URL protocol
const isSafeURL = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Usage
<a href={isSafeURL(userInput) ? userInput : '#'}>Click here</a>
```

### 1.5. Prevent XSS in Event Handlers

```typescript
// ❌ DANGEROUS: eval() or Function()
const handleClick = () => {
  eval(userInput) // NEVER DO THIS!
}

// ✅ SAFE: Use proper event handlers
const handleClick = () => {
  // Safe logic here
  console.log('Button clicked')
}
```

---

## 2. CSRF PROTECTION

### 2.1. Khái niệm CSRF (Cross-Site Request Forgery)

**CSRF** là attack buộc user thực hiện unwanted actions trên authenticated website.

### 2.2. CSRF Token Implementation

**Backend (NestJS):**

```typescript
// src/guards/csrf.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const csrfToken = request.headers['x-csrf-token']
    const sessionToken = request.session.csrfToken

    if (!csrfToken || csrfToken !== sessionToken) {
      throw new ForbiddenException('Invalid CSRF token')
    }

    return true
  }
}
```

**Frontend:**

```typescript
// src/utils/csrf.ts
export const getCsrfToken = (): string | null => {
  return localStorage.getItem('csrf_token')
}

// Add CSRF token to requests
// src/utils/http.ts
this.instance.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken()
  if (csrfToken && config.headers) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})
```

### 2.3. SameSite Cookie Attribute

```typescript
// Backend: Set SameSite attribute
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // or 'lax'
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
})
```

---

## 3. AUTHENTICATION SECURITY

### 3.1. Secure Token Storage

**❌ BAD: localStorage (vulnerable to XSS)**

```typescript
// DON'T DO THIS for sensitive tokens
localStorage.setItem('access_token', token)
```

**✅ GOOD: httpOnly Cookies**

```typescript
// Backend: Set httpOnly cookie
res.cookie('access_token', token, {
  httpOnly: true,  // Không thể access từ JavaScript
  secure: true,    // Chỉ gửi qua HTTPS
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
})
```

**⚠️ ACCEPTABLE: localStorage với encryption (cho demo/development)**

```typescript
// src/utils/auth.ts
import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY

export const setAccessTokenToLS = (token: string) => {
  const encrypted = CryptoJS.AES.encrypt(token, SECRET_KEY).toString()
  localStorage.setItem('access_token', encrypted)
}

export const getAccessTokenFromLS = (): string => {
  const encrypted = localStorage.getItem('access_token')
  if (!encrypted) return ''

  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}
```

### 3.2. JWT Best Practices

```typescript
// ✅ Short-lived access tokens
const accessToken = jwt.sign(payload, SECRET, { expiresIn: '15m' })

// ✅ Long-lived refresh tokens
const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })

// ✅ Verify token signature
try {
  const decoded = jwt.verify(token, SECRET)
  return decoded
} catch (error) {
  throw new UnauthorizedException('Invalid token')
}
```

### 3.3. Password Security

```typescript
// Backend: Hash passwords với bcrypt
import * as bcrypt from 'bcrypt'

// Hash password
const saltRounds = 12
const hashedPassword = await bcrypt.hash(password, saltRounds)

// Verify password
const isMatch = await bcrypt.compare(password, hashedPassword)
```

**Frontend: Password strength validation**

```typescript
// src/utils/password.ts
export const validatePasswordStrength = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 số')
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### 3.4. Rate Limiting

```typescript
// Backend: Rate limiting với @nestjs/throttler
import { ThrottlerGuard } from '@nestjs/throttler'

@UseGuards(ThrottlerGuard)
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto)
}

// Configuration
ThrottlerModule.forRoot({
  ttl: 60,      // Time window (seconds)
  limit: 5      // Max requests per ttl
})
```

---

## 4. AUTHORIZATION & ACCESS CONTROL

### 4.1. Role-Based Access Control (RBAC)

```typescript
// src/types/user.type.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SELLER = 'seller'
}

export interface User {
  _id: string
  email: string
  role: UserRole
  permissions: string[]
}
```

**Backend Guard:**

```typescript
// src/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    )

    if (!requiredRoles) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user

    return requiredRoles.some((role) => user.role === role)
  }
}

// Usage
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Delete('products/:id')
async deleteProduct(@Param('id') id: string) {
  return this.productsService.delete(id)
}
```

**Frontend Route Protection:**

```typescript
// src/components/ProtectedRoute.tsx
const AdminRoute = () => {
  const { profile } = useContext(AppContext)

  if (profile?.role !== UserRole.ADMIN) {
    return <Navigate to="/403" />
  }

  return <Outlet />
}

// Usage in routes
{
  path: '/admin',
  element: <AdminRoute />,
  children: [
    { path: 'dashboard', element: <AdminDashboard /> },
    { path: 'products', element: <ProductManagement /> }
  ]
}
```

### 4.2. Permission-Based Access Control

```typescript
// src/hooks/usePermission.ts
export const usePermission = (permission: string): boolean => {
  const { profile } = useContext(AppContext)
  return profile?.permissions.includes(permission) ?? false
}

// Usage
const ProductActions = ({ product }) => {
  const canEdit = usePermission('products:edit')
  const canDelete = usePermission('products:delete')

  return (
    <div>
      {canEdit && <button onClick={handleEdit}>Edit</button>}
      {canDelete && <button onClick={handleDelete}>Delete</button>}
    </div>
  )
}
```

---

## 5. INPUT VALIDATION & SANITIZATION

### 5.1. Frontend Validation với Zod

```typescript
// src/utils/rules.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ')
    .max(160, 'Email tối đa 160 ký tự'),

  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(160, 'Mật khẩu tối đa 160 ký tự')
})

export type LoginFormData = z.infer<typeof loginSchema>
```

**Usage với React Hook Form:**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = (data: LoginFormData) => {
    // Data đã được validate
    loginMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  )
}
```

### 5.2. Backend Validation

```typescript
// Backend: DTO validation với class-validator
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(160, { message: 'Email tối đa 160 ký tự' })
  email: string

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(160, { message: 'Mật khẩu tối đa 160 ký tự' })
  password: string
}
```

### 5.3. Sanitize User Input

```typescript
// src/utils/sanitize.ts
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Usage
const handleSearch = (query: string) => {
  const sanitized = sanitizeInput(query)
  searchProducts(sanitized)
}
```

---

## 6. SECURE HTTP HEADERS

### 6.1. Security Headers Configuration

**Backend (NestJS):**

```typescript
// src/main.ts
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Apply security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.example.com'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }))

  await app.listen(3000)
}
```

### 6.2. CORS Configuration

```typescript
// src/main.ts
app.enableCors({
  origin: [
    'http://localhost:4000',
    'https://shop.lehoangtrong.online'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
})
```

---

## 7. CONTENT SECURITY POLICY

### 7.1. CSP Configuration

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.example.com wss://socket.example.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  "
/>
```

### 7.2. CSP Reporting

```typescript
// Backend: CSP violation reporting endpoint
@Post('csp-report')
async reportCSPViolation(@Body() report: any) {
  console.error('CSP Violation:', report)
  // Log to monitoring service
  return { received: true }
}
```

---

## 8. HTTPS & SSL/TLS

### 8.1. Force HTTPS

```typescript
// Backend: Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`)
  } else {
    next()
  }
})
```

### 8.2. HSTS (HTTP Strict Transport Security)

```typescript
// Already configured in helmet
hsts: {
  maxAge: 31536000,        // 1 year
  includeSubDomains: true,
  preload: true
}
```

---

## 9. DEPENDENCY SECURITY

### 9.1. Audit Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

### 9.2. Keep Dependencies Updated

```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update to latest (breaking changes)
npm install package@latest
```

### 9.3. Use Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## 10. OWASP TOP 10

### 10.1. A01:2021 – Broken Access Control

**Prevention:**
- Implement proper authorization checks
- Deny by default
- Log access control failures

### 10.2. A02:2021 – Cryptographic Failures

**Prevention:**
- Use HTTPS everywhere
- Encrypt sensitive data at rest
- Use strong encryption algorithms

### 10.3. A03:2021 – Injection

**Prevention:**
- Use parameterized queries
- Validate and sanitize input
- Use ORM/ODM

### 10.4. A04:2021 – Insecure Design

**Prevention:**
- Threat modeling
- Secure design patterns
- Security requirements

### 10.5. A05:2021 – Security Misconfiguration

**Prevention:**
- Remove default accounts
- Disable unnecessary features
- Keep software updated

### 10.6. A06:2021 – Vulnerable Components

**Prevention:**
- Regular dependency audits
- Use only trusted sources
- Monitor for vulnerabilities

### 10.7. A07:2021 – Authentication Failures

**Prevention:**
- Multi-factor authentication
- Strong password policies
- Rate limiting

### 10.8. A08:2021 – Software and Data Integrity Failures

**Prevention:**
- Verify software signatures
- Use CI/CD security
- Integrity checks

### 10.9. A09:2021 – Security Logging Failures

**Prevention:**
- Log security events
- Protect log data
- Monitor logs

### 10.10. A10:2021 – Server-Side Request Forgery (SSRF)

**Prevention:**
- Validate URLs
- Whitelist allowed domains
- Network segmentation

---

## 11. SECURITY CHECKLIST

### ✅ Authentication & Authorization
- [ ] Passwords hashed với bcrypt (saltRounds >= 12)
- [ ] JWT tokens với short expiration (15 minutes)
- [ ] Refresh tokens implemented
- [ ] Rate limiting on login endpoint
- [ ] Account lockout after failed attempts
- [ ] Multi-factor authentication (optional)
- [ ] Role-based access control
- [ ] Permission-based access control

### ✅ Input Validation
- [ ] Frontend validation với Zod
- [ ] Backend validation với class-validator
- [ ] Sanitize HTML content với DOMPurify
- [ ] Validate URLs before use
- [ ] Escape user input in JSX

### ✅ XSS Prevention
- [ ] Never use dangerouslySetInnerHTML without sanitization
- [ ] Validate URL protocols
- [ ] Avoid eval() and Function()
- [ ] Content Security Policy configured

### ✅ CSRF Protection
- [ ] CSRF tokens implemented
- [ ] SameSite cookie attribute set
- [ ] Verify origin header

### ✅ Secure Headers
- [ ] Helmet.js configured
- [ ] HSTS enabled
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy configured

### ✅ HTTPS & SSL/TLS
- [ ] Force HTTPS in production
- [ ] Valid SSL certificate
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites

### ✅ Dependencies
- [ ] Regular npm audit
- [ ] Dependabot enabled
- [ ] No known vulnerabilities
- [ ] Dependencies up to date

### ✅ Logging & Monitoring
- [ ] Log security events
- [ ] Monitor for suspicious activity
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

---

**Kết luận:**

Security là một quá trình liên tục, không phải một lần setup xong. Hãy:
- Regular security audits
- Keep dependencies updated
- Follow OWASP guidelines
- Educate team về security
- Implement defense in depth

**Tài liệu tham khảo:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Helmet.js Documentation](https://helmetjs.github.io/)
