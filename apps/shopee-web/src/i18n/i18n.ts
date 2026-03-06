import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import COMMON_VI from 'src/locales/vi/common.json'
import HOME_VI from 'src/locales/vi/home.json'
import PRODUCT_VI from 'src/locales/vi/product.json'
import NAV_VI from 'src/locales/vi/nav.json'
import AUTH_VI from 'src/locales/vi/auth.json'
import CART_VI from 'src/locales/vi/cart.json'
import USER_VI from 'src/locales/vi/user.json'
import PAYMENT_VI from 'src/locales/vi/payment.json'
import NOTIFICATION_VI from 'src/locales/vi/notification.json'
import CHAT_VI from 'src/locales/vi/chat.json'
import ORDER_VI from 'src/locales/vi/order.json'
import CHECKOUT_VI from 'src/locales/vi/checkout.json'
import ADDRESS_VI from 'src/locales/vi/address.json'
import QA_VI from 'src/locales/vi/qa.json'
import SHIPPING_VI from 'src/locales/vi/shipping.json'
import CHECKIN_VI from 'src/locales/vi/checkin.json'
import WISHLIST_VI from 'src/locales/vi/wishlist.json'
import COMPARE_VI from 'src/locales/vi/compare.json'
import VALIDATION_VI from 'src/locales/vi/validation.json'

export const locales = {
  en: 'English',
  vi: 'Tiếng Việt'
} as const

export const resources = {
  vi: {
    common: COMMON_VI,
    home: HOME_VI,
    product: PRODUCT_VI,
    nav: NAV_VI,
    auth: AUTH_VI,
    cart: CART_VI,
    user: USER_VI,
    payment: PAYMENT_VI,
    notification: NOTIFICATION_VI,
    chat: CHAT_VI,
    order: ORDER_VI,
    checkout: CHECKOUT_VI,
    address: ADDRESS_VI,
    qa: QA_VI,
    shipping: SHIPPING_VI,
    checkin: CHECKIN_VI,
    wishlist: WISHLIST_VI,
    compare: COMPARE_VI,
    validation: VALIDATION_VI
  }
} as const

export const defaultNS = 'home'

const allNamespaces = [
  'common',
  'home',
  'product',
  'nav',
  'auth',
  'cart',
  'user',
  'payment',
  'notification',
  'chat',
  'order',
  'checkout',
  'address',
  'qa',
  'shipping',
  'checkin',
  'wishlist',
  'compare',
  'validation'
] as const

// Khởi tạo i18n chỉ khi không phải test environment
// Sử dụng import.meta.env của Vite thay vì process.env
const isTestEnvironment =
  import.meta.env.MODE === 'test' || (typeof window !== 'undefined' && window.location.href.includes('vitest'))

if (!isTestEnvironment) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'vi',
    ns: [...allNamespaces],
    fallbackLng: 'vi',
    defaultNS,
    interpolation: {
      escapeValue: false // react already does escaping
    }
  })
}

/**
 * Lazy load non-default language resources.
 * Vietnamese (default) is eagerly loaded above.
 * English is loaded on-demand when user switches language.
 */
export async function loadLanguage(lng: string): Promise<void> {
  if (lng === 'vi') {
    // Vietnamese is already loaded statically
    await i18n.changeLanguage('vi')
    document.documentElement.lang = lng
    return
  }

  // Check if all resources are already loaded (cached by i18n)
  const allLoaded = allNamespaces.every((ns) => i18n.hasResourceBundle(lng, ns))
  if (allLoaded) {
    await i18n.changeLanguage(lng)
    document.documentElement.lang = lng
    return
  }

  // Dynamically import English translations
  const [
    commonModule,
    homeModule,
    productModule,
    navModule,
    authModule,
    cartModule,
    userModule,
    paymentModule,
    notificationModule,
    chatModule,
    orderModule,
    checkoutModule,
    addressModule,
    qaModule,
    shippingModule,
    checkinModule,
    wishlistModule,
    compareModule,
    validationModule
  ] = await Promise.all([
    import('src/locales/en/common.json'),
    import('src/locales/en/home.json'),
    import('src/locales/en/product.json'),
    import('src/locales/en/nav.json'),
    import('src/locales/en/auth.json'),
    import('src/locales/en/cart.json'),
    import('src/locales/en/user.json'),
    import('src/locales/en/payment.json'),
    import('src/locales/en/notification.json'),
    import('src/locales/en/chat.json'),
    import('src/locales/en/order.json'),
    import('src/locales/en/checkout.json'),
    import('src/locales/en/address.json'),
    import('src/locales/en/qa.json'),
    import('src/locales/en/shipping.json'),
    import('src/locales/en/checkin.json'),
    import('src/locales/en/wishlist.json'),
    import('src/locales/en/compare.json'),
    import('src/locales/en/validation.json')
  ])

  i18n.addResourceBundle(lng, 'common', commonModule.default, true, true)
  i18n.addResourceBundle(lng, 'home', homeModule.default, true, true)
  i18n.addResourceBundle(lng, 'product', productModule.default, true, true)
  i18n.addResourceBundle(lng, 'nav', navModule.default, true, true)
  i18n.addResourceBundle(lng, 'auth', authModule.default, true, true)
  i18n.addResourceBundle(lng, 'cart', cartModule.default, true, true)
  i18n.addResourceBundle(lng, 'user', userModule.default, true, true)
  i18n.addResourceBundle(lng, 'payment', paymentModule.default, true, true)
  i18n.addResourceBundle(lng, 'notification', notificationModule.default, true, true)
  i18n.addResourceBundle(lng, 'chat', chatModule.default, true, true)
  i18n.addResourceBundle(lng, 'order', orderModule.default, true, true)
  i18n.addResourceBundle(lng, 'checkout', checkoutModule.default, true, true)
  i18n.addResourceBundle(lng, 'address', addressModule.default, true, true)
  i18n.addResourceBundle(lng, 'qa', qaModule.default, true, true)
  i18n.addResourceBundle(lng, 'shipping', shippingModule.default, true, true)
  i18n.addResourceBundle(lng, 'checkin', checkinModule.default, true, true)
  i18n.addResourceBundle(lng, 'wishlist', wishlistModule.default, true, true)
  i18n.addResourceBundle(lng, 'compare', compareModule.default, true, true)
  i18n.addResourceBundle(lng, 'validation', validationModule.default, true, true)
  await i18n.changeLanguage(lng)
  document.documentElement.lang = lng
}

export default i18n
