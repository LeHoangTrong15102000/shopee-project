import authHandlers from './auth.msw'
import productsHandlers from './products.msw'
import categoriesHandlers from './categories.msw'
import ordersHandlers from './orders.msw'
import usersHandlers from './users.msw'
import dashboardHandlers from './dashboard.msw'
import notificationsHandlers from './notifications.msw'
import reviewsHandlers from './reviews.msw'
import vouchersHandlers from './vouchers.msw'
import analyticsHandlers from './analytics.msw'
import inventoryHandlers from './inventory.msw'
import loyaltyHandlers from './loyalty.msw'
import qaHandlers from './qa.msw'
import importHandlers from './import.msw'
import settingsHandlers from './settings.msw'
import conversationsHandlers from './conversations.msw'
import shippingHandlers from './shipping.msw'
import paymentsHandlers from './payments.msw'
import checkinHandlers from './checkin.msw'
import priceAlertsHandlers from './price-alerts.msw'
import auditLogHandlers from './audit-log.msw'

export const handlers = [
  ...authHandlers,
  ...productsHandlers,
  ...categoriesHandlers,
  ...ordersHandlers,
  ...usersHandlers,
  ...dashboardHandlers,
  ...notificationsHandlers,
  ...reviewsHandlers,
  ...vouchersHandlers,
  ...analyticsHandlers,
  ...inventoryHandlers,
  ...loyaltyHandlers,
  ...qaHandlers,
  ...importHandlers,
  ...settingsHandlers,
  ...conversationsHandlers,
  ...shippingHandlers,
  ...paymentsHandlers,
  ...checkinHandlers,
  ...priceAlertsHandlers,
  ...auditLogHandlers,
]
