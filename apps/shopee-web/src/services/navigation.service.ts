/**
 * NavigationService - Centralized navigation handling for SPA
 *
 * Provides:
 * - Type-safe navigation methods
 * - Query params handling
 * - Redirect after login
 * - History management
 * - Navigation guards
 */

// Types
export interface NavigationOptions {
  replace?: boolean
  state?: Record<string, unknown>
  preserveQuery?: boolean
}

export interface RedirectConfig {
  returnUrl?: string
  message?: string
}

// Store for navigation history (for redirect after login)
let pendingRedirect: string | null = null
let navigationHistory: string[] = []

// Navigation paths constants
export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/user/profile',
  CART: '/cart',
  PRODUCT_DETAIL: (nameId: string) => `/${nameId}`,
  CATEGORY: (categoryId: string) => `/?category=${categoryId}`,
  SEARCH: (query: string) => `/?name=${encodeURIComponent(query)}`,
  CHECKOUT: '/checkout',
  ORDERS: '/user/purchase',
  WISHLIST: '/wishlist',
  CHANGE_PASSWORD: '/user/password',
  NOT_FOUND: '/404'
} as const

class NavigationService {
  private navigate: ((path: string, options?: { replace?: boolean; state?: Record<string, unknown> }) => void) | null =
    null

  init(navigateFn: (path: string, options?: { replace?: boolean; state?: Record<string, unknown> }) => void) {
    this.navigate = navigateFn
  }

  to(path: string, options?: NavigationOptions) {
    if (!this.navigate) {
      console.warn('NavigationService not initialized')
      return
    }

    navigationHistory.push(path)
    this.navigate(path, { replace: options?.replace, state: options?.state })
  }

  toLogin(returnUrl?: string) {
    pendingRedirect = returnUrl || window.location.pathname
    this.to(PATHS.LOGIN)
  }

  handlePostLoginRedirect() {
    const redirect = pendingRedirect || PATHS.HOME
    pendingRedirect = null
    this.to(redirect, { replace: true })
  }

  getPendingRedirect(): string | null {
    return pendingRedirect
  }

  clearPendingRedirect() {
    pendingRedirect = null
  }

  goBack() {
    if (navigationHistory.length > 1) {
      navigationHistory.pop()
      window.history.back()
    } else {
      this.to(PATHS.HOME)
    }
  }

  toProduct(nameId: string) {
    this.to(PATHS.PRODUCT_DETAIL(nameId))
  }

  toSearch(query: string) {
    this.to(PATHS.SEARCH(query))
  }

  toCategory(categoryId: string) {
    this.to(PATHS.CATEGORY(categoryId))
  }

  canGoBack(): boolean {
    return navigationHistory.length > 1
  }

  getCurrentPath(): string {
    return window.location.pathname
  }

  buildUrl(basePath: string, params: Record<string, string | number | undefined>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
  }
}

// Singleton instance
export const navigationService = new NavigationService()

export default navigationService
