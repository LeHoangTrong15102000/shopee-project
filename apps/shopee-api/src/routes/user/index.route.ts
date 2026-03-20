import { userCheckinRouter } from './checkin.route'
import { userPurchaseRouter } from './purchase.route'
import { userUserRouter } from './user-user.route'
import { userReviewRouter } from './review.route'
import { userWishlistRouter } from './wishlist.route'
import { userNotificationRouter } from './notification.route'
import { userOrderTrackingRouter } from './order-tracking.route'
import { userVoucherRouter } from './voucher.route'
import { userLoyaltyRouter } from './loyalty.route'
import { userAddressRouter } from './address.route'
import { userOrderRouter } from './order.route'
import { userCheckoutRouter } from './checkout.route'
import conversationRouter from './conversation.route'
import { userPriceRouter } from './price.route'

const userRoutes = {
  prefix: '/',
  routes: [
    {
      path: 'user',
      route: userUserRouter,
    },
    {
      path: 'purchases',
      route: userPurchaseRouter,
    },
    {
      path: 'reviews',
      route: userReviewRouter,
    },
    {
      path: 'wishlist',
      route: userWishlistRouter,
    },
    {
      path: 'notifications',
      route: userNotificationRouter,
    },
    {
      path: 'conversations',
      route: conversationRouter,
    },
    {
      path: 'orders/tracking',
      route: userOrderTrackingRouter,
    },
    {
      path: 'tracking',
      route: userOrderTrackingRouter,
    },

    {
      path: 'vouchers',
      route: userVoucherRouter,
    },
    {
      path: 'loyalty',
      route: userLoyaltyRouter,
    },
    {
      path: 'addresses',
      route: userAddressRouter,
    },
    {
      path: 'orders',
      route: userOrderRouter,
    },
    {
      path: 'checkout',
      route: userCheckoutRouter,
    },
    {
      path: 'checkin',
      route: userCheckinRouter,
    },
    {
      path: '',
      route: userPriceRouter,
    },
  ],
}

export default userRoutes
