import { useContext, useEffect, lazy, Suspense } from 'react'
import useRouteElements from './useRouteElements'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { LocalStorageEventTarget } from './utils/auth'
import { AppContext } from './contexts/app.context'
import SEO, { SITE_URL } from './components/SEO'
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider'
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate'
import useDocumentLang from './hooks/useDocumentLang'

// Lazy load heavy components - giảm main chunk size
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'))
const SellerDashboardPanel = lazy(() => import('./components/SellerDashboardPanel/SellerDashboardPanel'))
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt'))

/**
 * Khi url thay đổi thì các component nào dùng các hook như
 * useRoutes, useParams, useSearchParams, ...
 * sẽ bị re-render
 * Ví dụ component `App` dưới đây bị re-render khi mà url thay đổi
 * Vì dùng `useRouteElements` (đây là custom hook của `useRoutes`)
 *
 */

function App() {
  const routeElements = useRouteElements()
  // Sử dụng useContext để lấy ra giá trị
  const { reset } = useContext(AppContext)

  // Set html lang attribute based on i18n language
  useDocumentLang()

  useEffect(() => {
    // lắng nghe sự kiện
    // Khi mà lắng nghe sự kiện thì chúng ta sẽ xóa cái profile, isAuthenticated, extendedPurchases
    LocalStorageEventTarget.addEventListener('clearLS', reset) // Truyền cái reset như vậy là được
    return () => {
      LocalStorageEventTarget.removeEventListener('clearLS', reset)
    }
  }, [reset])

  return (
    <KeyboardShortcutsProvider>
      {/* Default SEO cho toàn bộ app — Organization schema on every page */}
      <SEO
        jsonLd={{
          '@type': 'Organization',
          name: 'Shopee Clone',
          url: SITE_URL,
          logo: `${SITE_URL}/vite.svg`
        }}
      />
      <ToastContainer autoClose={1500} role='alert' />
      <ScrollToTopOnNavigate />
      {routeElements}
      {/* Chatbot Widget - hiển thị trên tất cả các trang */}
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
      {/* Seller Dashboard Panel - chỉ hiển thị cho Admin */}
      <Suspense fallback={null}>
        <SellerDashboardPanel className='fixed bottom-4 left-4 z-40 w-80' />
      </Suspense>
      {/* PWA Install Prompt */}
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>
    </KeyboardShortcutsProvider>
  )
}

export default App
