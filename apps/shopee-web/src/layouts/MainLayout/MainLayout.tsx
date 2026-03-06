import { memo, useEffect, Suspense, lazy } from 'react'
import { Outlet } from 'react-router'
import Footer from 'src/components/Footer'
import Header from 'src/components/Header'
import PageTransition from 'src/components/PageTransition'

// Lazy load các components không cần thiết ngay lập tức
const CompareFloatingBar = lazy(() => import('src/components/CompareFloatingBar'))
const ConnectionStatus = lazy(() => import('src/components/ConnectionStatus'))
const BackToTop = lazy(() => import('src/components/BackToTop'))

interface Props {
  children?: React.ReactNode
}

const MainLayoutInner = ({ children }: Props) => {
  // useEffect khi mà load đến trang nào đó thì nó sẽ scroll lên đầu trang đó cho mình
  // console.log('MainLayout')
  useEffect(() => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [])

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-slate-900'>
      <Header />
      <Suspense fallback={null}>
        <ConnectionStatus />
      </Suspense>
      <PageTransition>
        {children}
        <Outlet />
      </PageTransition>
      <Footer />
      {/* Floating bar so sánh sản phẩm */}
      <Suspense fallback={null}>
        <CompareFloatingBar comparePath='/compare' />
      </Suspense>
      {/* Back to top button */}
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>
    </div>
  )
}

const MainLayout = memo(MainLayoutInner)

export default MainLayout
