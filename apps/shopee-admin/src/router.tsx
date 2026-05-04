import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router-dom'
import { useAuthStore } from 'src/stores/auth.store'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ROUTES } from 'src/constants/routes'

const AdminLayout = lazy(() => import('src/components/layout/AdminLayout'))
const LoginPage = lazy(() => import('src/pages/Login/LoginPage'))
const DashboardPage = lazy(() => import('src/pages/Dashboard/DashboardPage'))
const UserListPage = lazy(() => import('src/pages/Users/UserListPage'))
const ProductListPage = lazy(() => import('src/pages/Products/ProductListPage'))
const ProductFormPage = lazy(() => import('src/pages/Products/ProductFormPage'))
const ProductDetailPage = lazy(() => import('src/pages/Products/ProductDetailPage'))
const CategoryListPage = lazy(() => import('src/pages/Categories/CategoryListPage'))
const OrderListPage = lazy(() => import('src/pages/Orders/OrderListPage'))
const OrderDetailPage = lazy(() => import('src/pages/Orders/OrderDetailPage'))
const VoucherListPage = lazy(() => import('src/pages/Vouchers/VoucherListPage'))
const VoucherDetailPage = lazy(() => import('src/pages/Vouchers/VoucherDetailPage'))
const ReviewListPage = lazy(() => import('src/pages/Reviews/ReviewListPage'))
const ReviewDetailPage = lazy(() => import('src/pages/Reviews/ReviewDetailPage'))
const LoyaltyPage = lazy(() => import('src/pages/Loyalty/LoyaltyPage'))
const InventoryPage = lazy(() => import('src/pages/Inventory/InventoryPage'))
const AnalyticsPage = lazy(() => import('src/pages/Analytics/AnalyticsPage'))
const NotificationListPage = lazy(() => import('src/pages/Notifications/NotificationListPage'))
const QAPage = lazy(() => import('src/pages/QA/QAPage'))
const ImportPage = lazy(() => import('src/pages/Import/ImportPage'))
const SettingsPage = lazy(() => import('src/pages/Settings/SettingsPage'))
const UserDetailPage = lazy(() => import('src/pages/Users/UserDetailPage'))
const NotFoundPage = lazy(() => import('src/pages/NotFound/NotFoundPage'))
const ActivityLogPage = lazy(() => import('src/pages/ActivityLog/ActivityLogPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState fullPage />}>{children}</Suspense>
}

const protectedRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <SuspenseWrapper>
        <DashboardPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.USERS.slice(1),
    element: (
      <SuspenseWrapper>
        <UserListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.USER_DETAIL.slice(1),
    element: (
      <SuspenseWrapper>
        <UserDetailPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.PRODUCTS.slice(1),
    element: (
      <SuspenseWrapper>
        <ProductListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.PRODUCT_NEW.slice(1),
    element: (
      <SuspenseWrapper>
        <ProductFormPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.PRODUCT_EDIT.slice(1),
    element: (
      <SuspenseWrapper>
        <ProductFormPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.PRODUCT_DETAIL.slice(1),
    element: (
      <SuspenseWrapper>
        <ProductDetailPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.CATEGORIES.slice(1),
    element: (
      <SuspenseWrapper>
        <CategoryListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.ORDERS.slice(1),
    element: (
      <SuspenseWrapper>
        <OrderListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.ORDER_DETAIL.slice(1),
    element: (
      <SuspenseWrapper>
        <OrderDetailPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.VOUCHERS.slice(1),
    element: (
      <SuspenseWrapper>
        <VoucherListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.VOUCHER_DETAIL.slice(1),
    element: (
      <SuspenseWrapper>
        <VoucherDetailPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.REVIEWS.slice(1),
    element: (
      <SuspenseWrapper>
        <ReviewListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.REVIEW_DETAIL.slice(1),
    element: (
      <SuspenseWrapper>
        <ReviewDetailPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.LOYALTY.slice(1),
    element: (
      <SuspenseWrapper>
        <LoyaltyPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.INVENTORY.slice(1),
    element: (
      <SuspenseWrapper>
        <InventoryPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.ANALYTICS.slice(1),
    element: (
      <SuspenseWrapper>
        <AnalyticsPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.NOTIFICATIONS.slice(1),
    element: (
      <SuspenseWrapper>
        <NotificationListPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.QA.slice(1),
    element: (
      <SuspenseWrapper>
        <QAPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.IMPORT.slice(1),
    element: (
      <SuspenseWrapper>
        <ImportPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.SETTINGS.slice(1),
    element: (
      <SuspenseWrapper>
        <SettingsPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.ACTIVITY_LOG.slice(1),
    element: (
      <SuspenseWrapper>
        <ActivityLogPage />
      </SuspenseWrapper>
    ),
  },
]

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <AdminLayout />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
    children: protectedRoutes,
  },
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
])
