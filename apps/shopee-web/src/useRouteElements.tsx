import { Navigate, Outlet, useRoutes } from 'react-router'
import { useContext, lazy, Suspense } from 'react'
import { AppContext } from './contexts/app.context'
import path from './constant/path'
import Loader from './components/Loader'

// Lazy load layouts - giảm initial bundle size
const MainLayout = lazy(() => import('./layouts/MainLayout'))
const RegisterLayout = lazy(() => import('./layouts/RegisterLayout'))
const CartLayout = lazy(() => import('./layouts/CartLayout'))
const UserLayout = lazy(() => import('./pages/User/layouts/UserLayout'))
// import Profile from './pages/User/pages/Profile'
// import ChangePassword from './pages/User/pages/ChangePassword'
// import HistoryPurchases from './pages/User/pages/HistoryPurchases'
// import NotFound from './pages/NotFound'

// Khai báo lazyload cho các page
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const ProductList = lazy(() => import('./pages/ProductList'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Compare = lazy(() => import('./pages/Compare'))
const Profile = lazy(() => import('./pages/User/pages/Profile'))
const ChangePassword = lazy(() => import('./pages/User/pages/ChangePassword'))
const HistoryPurchases = lazy(() => import('./pages/User/pages/HistoryPurchases'))
const OrderList = lazy(() => import('./pages/User/pages/OrderList'))
const OrderDetail = lazy(() => import('./pages/User/pages/OrderDetail'))
const MyVouchers = lazy(() => import('./pages/User/pages/MyVouchers'))
const DailyCheckInPage = lazy(() => import('./pages/User/pages/DailyCheckIn'))
const AddressBook = lazy(() => import('./pages/User/pages/AddressBook'))
const Notifications = lazy(() => import('./pages/User/pages/Notifications'))
const ConversationHistory = lazy(() => import('./pages/User/pages/ConversationHistory'))
const PriceAlerts = lazy(() => import('./pages/User/pages/PriceAlerts'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'))

// Khai báo một Route Protected(Vì nó return về Outlet nên hàm này được coi là component)
function ProtectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return isAuthenticated ? <Outlet /> : <Navigate to='/login' />
}

// Khi mà đã đăng nhập rồi thì không cho nó vào trang login và register
function RejectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return !isAuthenticated ? <Outlet /> : <Navigate to='/' />
}

// Đừng khai báo component trong hook em, mỗi lần hoook render là nó tạo component mới
const useRouteElements = () => {
  const routeElements = useRoutes([
    {
      path: '',
      element: (
        <Suspense fallback={<Loader />}>
          <MainLayout />
        </Suspense>
      ),
      children: [
        {
          path: path.home,
          index: true,
          element: (
            <Suspense
              // fallback={<div className='flex items-center justify-center text-center text-[#ee4d2d]'>Loading...</div>}
              fallback={<Loader />}
            >
              <Home />
            </Suspense>
          ),
          errorElement: <NotFound />
        },
        {
          path: path.products,
          element: (
            <Suspense fallback={<Loader />}>
              <ProductList />
            </Suspense>
          ),
          errorElement: <NotFound />
        },
        {
          path: path.productDetail,
          element: (
            <Suspense fallback={<Loader />}>
              <ProductDetail />
            </Suspense>
          ),
          errorElement: <NotFound />
        },
        {
          path: path.compare,
          element: (
            <Suspense fallback={<Loader />}>
              <Compare />
            </Suspense>
          ),
          errorElement: <NotFound />
        },
        {
          path: '*',
          element: (
            <Suspense>
              <NotFound />
            </Suspense>
          )
        }
      ]
    },
    {
      path: '',
      element: <ProtectedRoute />,
      children: [
        {
          path: path.cart,
          element: (
            <Suspense fallback={<Loader />}>
              <CartLayout>
                <Suspense fallback={<Loader />}>
                  <Cart />
                </Suspense>
              </CartLayout>
            </Suspense>
          )
        },
        {
          path: path.checkout,
          element: (
            <Suspense fallback={<Loader />}>
              <CartLayout>
                <Suspense fallback={<Loader />}>
                  <Checkout />
                </Suspense>
              </CartLayout>
            </Suspense>
          )
        },
        {
          path: path.wishlist,
          element: (
            <Suspense fallback={<Loader />}>
              <CartLayout headerTitle='sản phẩm yêu thích' showStepper={false}>
                <Suspense fallback={<Loader />}>
                  <Wishlist />
                </Suspense>
              </CartLayout>
            </Suspense>
          )
        },
        {
          path: path.user,
          element: (
            <Suspense fallback={<Loader />}>
              <MainLayout />
            </Suspense>
          ),
          // cái children trong router dùng để khai báo cho những thằng Outlet nằm bên trong UserLayout
          children: [
            {
              path: '',
              element: (
                <Suspense fallback={<Loader />}>
                  <UserLayout />
                </Suspense>
              ),
              children: [
                {
                  path: path.profile,
                  element: (
                    <Suspense>
                      <Profile />
                    </Suspense>
                  )
                },
                {
                  path: path.changePassword,
                  element: (
                    <Suspense>
                      <ChangePassword />
                    </Suspense>
                  )
                },
                {
                  path: path.historyPurchases,
                  element: (
                    <Suspense>
                      <HistoryPurchases />
                    </Suspense>
                  )
                },
                {
                  path: path.orderDetail,
                  element: (
                    <Suspense>
                      <OrderDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.orderList,
                  element: (
                    <Suspense>
                      <OrderList />
                    </Suspense>
                  )
                },
                {
                  path: path.myVouchers,
                  element: (
                    <Suspense>
                      <MyVouchers />
                    </Suspense>
                  )
                },
                {
                  path: path.dailyCheckIn,
                  element: (
                    <Suspense>
                      <DailyCheckInPage />
                    </Suspense>
                  )
                },
                {
                  path: path.addressBook,
                  element: (
                    <Suspense>
                      <AddressBook />
                    </Suspense>
                  )
                },
                {
                  path: path.notifications,
                  element: (
                    <Suspense>
                      <Notifications />
                    </Suspense>
                  )
                },
                {
                  path: path.conversations,
                  element: (
                    <Suspense>
                      <ConversationHistory />
                    </Suspense>
                  )
                },
                {
                  path: path.priceAlerts,
                  element: (
                    <Suspense>
                      <PriceAlerts />
                    </Suspense>
                  )
                }
              ]
            }
          ]
        }
      ]
    },
    {
      path: '',
      // Cái outlet nằm bên trong rejectedRoute nên nó vẫn re-render cái RegisterLayout
      element: <RejectedRoute />,
      // Nên ở đây children sẽ là thằng con nằm trong RejectedRoute
      children: [
        {
          path: '',
          // Khi mình làm như này thì vẫn đảm bảo rằng thằng <RegisterLayout /> nó có Outlet, khi mà thằng outlet thay đổi thì nó không ảnh hưởng gì đến thằng RegisterLayout
          element: (
            <Suspense fallback={<Loader />}>
              <RegisterLayout />
            </Suspense>
          ),
          children: [
            {
              path: path.login,
              element: (
                <Suspense>
                  <Login />
                </Suspense>
              )
            },
            {
              path: path.register,
              element: (
                <Suspense>
                  <Register />
                </Suspense>
              )
            },
            {
              path: path.forgotPassword,
              element: (
                <Suspense>
                  <ForgotPassword />
                </Suspense>
              )
            },
            {
              path: path.resetPassword,
              element: (
                <Suspense>
                  <ResetPassword />
                </Suspense>
              )
            }
          ]
        }
      ]
    }
  ])
  return routeElements
}

export default useRouteElements
