import i18n from 'src/i18n/i18n'

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key as never, options as never)

// Toast messages - resolved at runtime for i18n support
export const TOAST_MESSAGES = {
  // Cart messages
  get ADD_TO_CART_SUCCESS() {
    return `🛒 ${t('cart:toast.addToCartSuccess')}`
  },
  get ADD_TO_CART_ERROR() {
    return `❌ ${t('cart:toast.addToCartError')}`
  },
  get UPDATE_QUANTITY_ERROR() {
    return `❌ ${t('cart:toast.updateQuantityError')}`
  },
  REMOVE_FROM_CART_SUCCESS: (count: number) =>
    `🗑️ ${count > 1 ? t('cart:toast.removeSuccessMultiple', { count }) : t('cart:toast.removeSuccess')}`,
  get REMOVE_FROM_CART_ERROR() {
    return `❌ ${t('cart:toast.removeError')}`
  },
  REMOVE_FROM_CART_FINAL_SUCCESS: (count: number) =>
    `✅ ${count > 1 ? t('cart:toast.removeFinalSuccessMultiple', { count }) : t('cart:toast.removeFinalSuccess')}`,
  get RESTORE_ITEMS() {
    return `↩️ ${t('cart:toast.restoreItems')}`
  },

  // Save for Later messages
  get SAVE_FOR_LATER_SUCCESS() {
    return `🔖 ${t('cart:toast.saveForLaterSuccess')}`
  },
  get SAVE_FOR_LATER_ALREADY_SAVED() {
    return `⚠️ ${t('cart:toast.saveForLaterAlreadySaved')}`
  },
  get MOVE_TO_CART_SUCCESS() {
    return `🛒 ${t('cart:toast.moveToCartSuccess')}`
  },
  get CLEAR_SAVED_SUCCESS() {
    return `🗑️ ${t('cart:toast.clearSavedSuccess')}`
  },

  // Review messages
  get REVIEW_LIKE_SUCCESS() {
    return `❤️ ${t('product:toast.reviewLikeSuccess')}`
  },
  get REVIEW_UNLIKE_SUCCESS() {
    return `💔 ${t('product:toast.reviewUnlikeSuccess')}`
  },
  get REVIEW_LIKE_ERROR() {
    return `❌ ${t('product:toast.reviewLikeError')}`
  },

  // Wishlist messages
  get WISHLIST_ADD_SUCCESS() {
    return `❤️ ${t('product:toast.wishlistAddSuccess')}`
  },
  get WISHLIST_ADD_ERROR() {
    return `❌ ${t('product:toast.wishlistAddError')}`
  },
  get WISHLIST_REMOVE_SUCCESS() {
    return `💔 ${t('product:toast.wishlistRemoveSuccess')}`
  },
  get WISHLIST_REMOVE_ERROR() {
    return `❌ ${t('product:toast.wishlistRemoveError')}`
  },
  get WISHLIST_LOGIN_REQUIRED() {
    return `⚠️ ${t('auth:toast.loginRequired')}`
  },

  // Notification messages
  get MARK_AS_READ_ERROR() {
    return `❌ ${t('notification:toast.markAsReadError')}`
  },
  get MARK_ALL_AS_READ_SUCCESS() {
    return `✅ ${t('notification:toast.markAllAsReadSuccess')}`
  },
  get MARK_ALL_AS_READ_ERROR() {
    return `❌ ${t('notification:toast.markAllAsReadError')}`
  },

  // Generic messages
  get GENERIC_ERROR() {
    return `❌ ${t('common:status.error')}`
  }
} as const

// Temporary ID prefixes
export const TEMP_ID_PREFIX = 'temp-'

// Default user placeholder
export const DEFAULT_USER_PLACEHOLDER = 'current-user'
