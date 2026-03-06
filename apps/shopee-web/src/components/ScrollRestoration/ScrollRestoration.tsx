import { useScrollRestoration } from '../../hooks/useScrollRestoration'

/**
 * Component tự động quản lý scroll restoration cho toàn bộ app
 * Đặt component này ở root level của Router để enable scroll restoration
 */
function ScrollRestoration() {
  useScrollRestoration()
  return null
}

export default ScrollRestoration
