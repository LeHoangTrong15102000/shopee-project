import { Router } from 'express'
import adminUserRouter from './admin-user.route'
import adminAuthRouter from './admin-auth.route'
import adminCategoryRouter from './admin-category.route'
import adminProductRouter from './admin-product.route'
import adminImportRouter from './admin-import.route'
import adminAnalyticsRouter from './admin-analytics.route'
import adminOrderRouter from './admin-order.route'
import adminNotificationRouter from './admin-notification.route'
import adminDashboardRouter from './admin-dashboard.route'
import adminVoucherRouter from './admin-voucher.route'
import adminReviewRouter from './admin-review.route'
import adminLoyaltyRouter from './admin-loyalty.route'
import adminInventoryRouter from './admin-inventory.route'
import adminProductAnalyticsRouter from './admin-product-analytics.route'
import adminQARouter from './admin-qa.route'
import adminCheckinRouter from './admin-checkin.route'
import adminPriceAlertsRouter from './admin-price-alerts.route'
import adminConversationRouter from './admin-conversation.route'
import { adminRateLimit } from '@middleware/rateLimiter.middleware'

// Wrap every admin sub-router with the admin rate limiter (300 req/min per user)
function withAdminRateLimit(router: Router): Router {
  const wrapper = Router()
  wrapper.use(adminRateLimit)
  wrapper.use(router)
  return wrapper
}

const adminRoutes = {
  prefix: '/admin/',
  routes: [
    {
      path: 'users',
      route: withAdminRateLimit(adminUserRouter),
    },
    {
      path: 'products',
      route: withAdminRateLimit(adminProductRouter),
    },
    {
      path: 'categories',
      route: withAdminRateLimit(adminCategoryRouter),
    },
    {
      path: 'import',
      route: withAdminRateLimit(adminImportRouter),
    },
    {
      path: 'analytics',
      route: withAdminRateLimit(adminAnalyticsRouter),
    },
    {
      path: 'orders',
      route: withAdminRateLimit(adminOrderRouter),
    },
    {
      path: 'notifications',
      route: withAdminRateLimit(adminNotificationRouter),
    },
    {
      path: 'dashboard',
      route: withAdminRateLimit(adminDashboardRouter),
    },
    {
      path: 'vouchers',
      route: withAdminRateLimit(adminVoucherRouter),
    },
    {
      path: 'reviews',
      route: withAdminRateLimit(adminReviewRouter),
    },
    {
      path: 'loyalty',
      route: withAdminRateLimit(adminLoyaltyRouter),
    },
    {
      path: 'inventory',
      route: withAdminRateLimit(adminInventoryRouter),
    },
    {
      path: 'products/analytics',
      route: withAdminRateLimit(adminProductAnalyticsRouter),
    },
    {
      path: 'qa',
      route: withAdminRateLimit(adminQARouter),
    },
    {
      path: 'checkin',
      route: withAdminRateLimit(adminCheckinRouter),
    },
    {
      path: 'price-alerts',
      route: withAdminRateLimit(adminPriceAlertsRouter),
    },
    {
      path: 'conversations',
      route: withAdminRateLimit(adminConversationRouter),
    },
    {
      path: '',
      route: withAdminRateLimit(adminAuthRouter),
    },
  ],
}

export default adminRoutes
