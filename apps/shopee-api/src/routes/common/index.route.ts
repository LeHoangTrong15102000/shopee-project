import commonUserRouter from './common-user.route'
import commonAuthRouter from './common-auth.route'
import commonProductRouter from './common-product.route'
import commonCategoryRouter from './common-category.route'
import qaRouter from './qa.route'
import healthRouter from './health.route'
import { shopRouter } from './shop.route'
import paymentRouter from './payment.route'
import ipnRouter from './ipn.route'
import flashSaleRouter from './flash-sale.route'
import searchRouter from './search.route'
import productRecommendationRouter from './product-recommendations.route'

const commonRoutes = {
  prefix: '/',
  routes: [
    {
      path: '',
      route: commonUserRouter,
    },
    {
      path: '',
      route: commonAuthRouter,
    },
    {
      path: '',
      route: healthRouter,
    },
    {
      path: 'products',
      route: commonProductRouter,
    },

    {
      path: 'categories',
      route: commonCategoryRouter,
    },
    {
      path: 'qa',
      route: qaRouter,
    },
    {
      path: 'shops',
      route: shopRouter,
    },
    {
      path: 'payment',
      route: paymentRouter,
    },
    {
      path: 'payment',
      route: ipnRouter,
    },
    {
      path: 'flash-sales',
      route: flashSaleRouter,
    },
    {
      path: 'search',
      route: searchRouter,
    },
    {
      path: 'products',
      route: productRecommendationRouter,
    },
  ],
}

export default commonRoutes
