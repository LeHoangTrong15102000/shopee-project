import authHandlers from './auth.msw';
import productsHandlers from './products.msw';
import categoriesHandlers from './categories.msw';
import ordersHandlers from './orders.msw';
import usersHandlers from './users.msw';
import dashboardHandlers from './dashboard.msw';
import notificationsHandlers from './notifications.msw';
import reviewsHandlers from './reviews.msw';
import vouchersHandlers from './vouchers.msw';

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
];
