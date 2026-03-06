import {
  IconClipboard,
  IconClock,
  IconCurrencyDollar,
  IconFire,
  IconSparkles,
  IconStar,
  IconTrendingDown,
  IconTrendingUp,
  IconTrophy
} from './components/WishlistIcons'

// Mock categories for visual enhancement
export const mockCategories = [
  'Điện tử',
  'Thời trang',
  'Gia dụng',
  'Làm đẹp',
  'Thể thao',
  'Sách',
  'Đồ chơi',
  'Phụ kiện'
]

// Sort options
export const sortOptions = [
  { id: 'newest', label: 'Mới nhất', Icon: IconClock },
  { id: 'price-asc', label: 'Giá thấp → cao', Icon: IconTrendingUp },
  { id: 'price-desc', label: 'Giá cao → thấp', Icon: IconTrendingDown },
  { id: 'discount', label: 'Giảm giá nhiều', Icon: IconFire },
  { id: 'bestseller', label: 'Bán chạy', Icon: IconStar }
]

// Filter pills data
export const filterPills = [
  { id: 'all', label: 'Tất cả', Icon: IconClipboard },
  { id: 'sale', label: 'Giảm giá sốc', Icon: IconFire },
  { id: 'bestseller', label: 'Bán chạy', Icon: IconStar },
  { id: 'new', label: 'Mới thêm', Icon: IconSparkles },
  { id: 'lowprice', label: 'Giá thấp', Icon: IconCurrencyDollar },
  { id: 'highrating', label: 'Đánh giá cao', Icon: IconTrophy }
]

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}
