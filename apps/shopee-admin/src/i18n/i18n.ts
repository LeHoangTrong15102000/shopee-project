import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Vietnamese (default) — eagerly loaded
import commonVI from 'src/locales/vi/common.json'
import layoutVI from 'src/locales/vi/layout.json'
import dashboardVI from 'src/locales/vi/dashboard.json'
import loginVI from 'src/locales/vi/login.json'
import settingsVI from 'src/locales/vi/settings.json'
import productsVI from 'src/locales/vi/products.json'
import ordersVI from 'src/locales/vi/orders.json'
import usersVI from 'src/locales/vi/users.json'
import categoriesVI from 'src/locales/vi/categories.json'
import vouchersVI from 'src/locales/vi/vouchers.json'
import reviewsVI from 'src/locales/vi/reviews.json'
import loyaltyVI from 'src/locales/vi/loyalty.json'
import inventoryVI from 'src/locales/vi/inventory.json'
import analyticsVI from 'src/locales/vi/analytics.json'
import notificationsVI from 'src/locales/vi/notifications.json'
import qaVI from 'src/locales/vi/qa.json'
import importVI from 'src/locales/vi/import.json'
import shippingVI from 'src/locales/vi/shipping.json'
import paymentsVI from 'src/locales/vi/payments.json'
import shopsVI from 'src/locales/vi/shops.json'
import systemHealthVI from 'src/locales/vi/system-health.json'
import searchAnalyticsVI from 'src/locales/vi/search-analytics.json'
import wishlistAnalyticsVI from 'src/locales/vi/wishlist-analytics.json'
import shopChatVI from 'src/locales/vi/shop-chat.json'
import activityLogVI from 'src/locales/vi/activity-log.json'

// English — eagerly loaded (admin app is small, no need for lazy loading)
import commonEN from 'src/locales/en/common.json'
import layoutEN from 'src/locales/en/layout.json'
import dashboardEN from 'src/locales/en/dashboard.json'
import loginEN from 'src/locales/en/login.json'
import settingsEN from 'src/locales/en/settings.json'
import productsEN from 'src/locales/en/products.json'
import ordersEN from 'src/locales/en/orders.json'
import usersEN from 'src/locales/en/users.json'
import categoriesEN from 'src/locales/en/categories.json'
import vouchersEN from 'src/locales/en/vouchers.json'
import reviewsEN from 'src/locales/en/reviews.json'
import loyaltyEN from 'src/locales/en/loyalty.json'
import inventoryEN from 'src/locales/en/inventory.json'
import analyticsEN from 'src/locales/en/analytics.json'
import notificationsEN from 'src/locales/en/notifications.json'
import qaEN from 'src/locales/en/qa.json'
import importEN from 'src/locales/en/import.json'
import shippingEN from 'src/locales/en/shipping.json'
import paymentsEN from 'src/locales/en/payments.json'
import shopsEN from 'src/locales/en/shops.json'
import systemHealthEN from 'src/locales/en/system-health.json'
import searchAnalyticsEN from 'src/locales/en/search-analytics.json'
import wishlistAnalyticsEN from 'src/locales/en/wishlist-analytics.json'
import shopChatEN from 'src/locales/en/shop-chat.json'
import activityLogEN from 'src/locales/en/activity-log.json'

export const locales = {
  en: 'English',
  vi: 'Tiếng Việt',
} as const

export const resources = {
  vi: {
    common: commonVI,
    layout: layoutVI,
    dashboard: dashboardVI,
    login: loginVI,
    settings: settingsVI,
    products: productsVI,
    orders: ordersVI,
    users: usersVI,
    categories: categoriesVI,
    vouchers: vouchersVI,
    reviews: reviewsVI,
    loyalty: loyaltyVI,
    inventory: inventoryVI,
    analytics: analyticsVI,
    notifications: notificationsVI,
    qa: qaVI,
    import: importVI,
    shipping: shippingVI,
    payments: paymentsVI,
    shops: shopsVI,
    'system-health': systemHealthVI,
    'search-analytics': searchAnalyticsVI,
    'wishlist-analytics': wishlistAnalyticsVI,
    'shop-chat': shopChatVI,
    'activity-log': activityLogVI,
  },
  en: {
    common: commonEN,
    layout: layoutEN,
    dashboard: dashboardEN,
    login: loginEN,
    settings: settingsEN,
    products: productsEN,
    orders: ordersEN,
    users: usersEN,
    categories: categoriesEN,
    vouchers: vouchersEN,
    reviews: reviewsEN,
    loyalty: loyaltyEN,
    inventory: inventoryEN,
    analytics: analyticsEN,
    notifications: notificationsEN,
    qa: qaEN,
    import: importEN,
    shipping: shippingEN,
    payments: paymentsEN,
    shops: shopsEN,
    'system-health': systemHealthEN,
    'search-analytics': searchAnalyticsEN,
    'wishlist-analytics': wishlistAnalyticsEN,
    'shop-chat': shopChatEN,
    'activity-log': activityLogEN,
  },
} as const

export const defaultNS = 'common'

function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem('admin_lng')
    if (stored && stored in locales) {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return 'vi'
}

const initialLng = getStoredLanguage()

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'vi',
  defaultNS,
  interpolation: { escapeValue: false },
})

document.documentElement.lang = initialLng

export function changeLanguage(lng: string) {
  i18n.changeLanguage(lng)
  document.documentElement.lang = lng
  try {
    localStorage.setItem('admin_lng', lng)
  } catch {
    // incognito
  }
}

export default i18n
