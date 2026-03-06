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

const adminRoutes = {
  prefix: '/admin/',
  routes: [
    {
      path: 'users',
      route: adminUserRouter,
    },
    {
      path: 'products',
      route: adminProductRouter,
    },
    {
      path: 'categories',
      route: adminCategoryRouter,
    },
    {
      path: 'import',
      route: adminImportRouter,
    },
    {
      path: 'analytics',
      route: adminAnalyticsRouter,
    },
    {
      path: 'orders',
      route: adminOrderRouter,
    },
    {
      path: 'notifications',
      route: adminNotificationRouter,
    },
    {
      path: 'dashboard',
      route: adminDashboardRouter,
    },
    {
      path: 'vouchers',
      route: adminVoucherRouter,
    },
    {
      path: 'reviews',
      route: adminReviewRouter,
    },
    {
      path: 'loyalty',
      route: adminLoyaltyRouter,
    },
    {
      path: 'inventory',
      route: adminInventoryRouter,
    },
    {
      path: 'products/analytics',
      route: adminProductAnalyticsRouter,
    },
    {
      path: 'qa',
      route: adminQARouter,
    },
    {
      path: '',
      route: adminAuthRouter,
    },
  ],
}

export default adminRoutes
