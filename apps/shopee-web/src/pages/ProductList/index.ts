import ProductList from './ProductList'
import ProductListInfinite from './ProductListInfinite'

// Feature flag để chuyển đổi giữa pagination và infinite scroll
// Set true để sử dụng Infinite Scroll, false để sử dụng Pagination truyền thống
const USE_INFINITE_SCROLL = false

export { ProductList, ProductListInfinite }
export default USE_INFINITE_SCROLL ? ProductListInfinite : ProductList
