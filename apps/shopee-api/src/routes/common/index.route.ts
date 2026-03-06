import commonUserRouter from './common-user.route'
import commonAuthRouter from './common-auth.route'
import commonProductRouter from './common-product.route'
import commonCategoryRouter from './common-category.route'
import commonPriceRouter from './price.route'
import qaRouter from './qa.route'
import healthRouter from './health.route'

const commonRoutes = {
  prefix: '/',
  routes: [
    {
      path: '',
      route: commonUserRouter
    },
    {
      path: '',
      route: commonAuthRouter
    },
    {
      path: '',
      route: healthRouter
    },
    {
      path: 'products',
      route: commonProductRouter
    },
    {
      path: 'products',
      route: commonPriceRouter
    },
    {
      path: 'categories',
      route: commonCategoryRouter
    },
    {
      path: 'qa',
      route: qaRouter
    }
  ]
}

export default commonRoutes
