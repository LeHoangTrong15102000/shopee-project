import { setupWorker } from 'msw/browser'
import orderRequests from 'src/msw/order.msw'
import authRequests from 'src/msw/auth.msw'
import userRequests from 'src/msw/user.msw'
import addressRequests from 'src/msw/address.msw'
import notificationRequests from 'src/msw/notification.msw'
import wishlistRequests from 'src/msw/wishlist.msw'
import checkoutRequests from 'src/msw/checkout.msw'
import productRequests from 'src/msw/product.msw'

export const worker = setupWorker(
  ...orderRequests,
  ...authRequests,
  ...userRequests,
  ...addressRequests,
  ...notificationRequests,
  ...wishlistRequests,
  ...checkoutRequests,
  // Product handlers registered last; within productRequests the more-specific
  // /products/search/history route appears before the parameterised /products/:id
  // handler, preserving route specificity.
  ...productRequests,
)
