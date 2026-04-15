import {
  IconClipboard,
  IconClock,
  IconCurrencyDollar,
  IconFire,
  IconSparkles,
  IconStar,
  IconTrendingDown,
  IconTrendingUp,
  IconTrophy,
} from './components/WishlistIcons'

// Sort options
export const sortOptions = [
  { id: 'newest', labelKey: 'sort.newest', Icon: IconClock },
  { id: 'price-asc', labelKey: 'sort.priceAsc', Icon: IconTrendingUp },
  { id: 'price-desc', labelKey: 'sort.priceDesc', Icon: IconTrendingDown },
  { id: 'discount', labelKey: 'sort.discount', Icon: IconFire },
  { id: 'bestseller', labelKey: 'sort.bestseller', Icon: IconStar },
]

// Filter pills data
export const filterPills = [
  { id: 'all', labelKey: 'filter.all', Icon: IconClipboard },
  { id: 'sale', labelKey: 'filter.sale', Icon: IconFire },
  { id: 'bestseller', labelKey: 'filter.bestseller', Icon: IconStar },
  { id: 'new', labelKey: 'filter.new', Icon: IconSparkles },
  { id: 'lowprice', labelKey: 'filter.lowprice', Icon: IconCurrencyDollar },
  { id: 'highrating', labelKey: 'filter.highrating', Icon: IconTrophy },
]

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
