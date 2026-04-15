import { describe, it, expect, vi } from 'vitest'

vi.mock('../components/WishlistIcons', () => ({
  IconClipboard: () => 'IconClipboard',
  IconClock: () => 'IconClock',
  IconCurrencyDollar: () => 'IconCurrencyDollar',
  IconFire: () => 'IconFire',
  IconSparkles: () => 'IconSparkles',
  IconStar: () => 'IconStar',
  IconTrendingDown: () => 'IconTrendingDown',
  IconTrendingUp: () => 'IconTrendingUp',
  IconTrophy: () => 'IconTrophy',
}))

import {
  sortOptions,
  filterPills,
  containerVariants,
  itemVariants,
  fadeInUp,
} from '../wishlist.constants'

describe('wishlist.constants', () => {
  describe('sortOptions', () => {
    it('has 5 sort options', () => {
      expect(sortOptions).toHaveLength(5)
    })
    it('has newest as first option', () => {
      expect(sortOptions[0].id).toBe('newest')
    })
    it('has price-asc option', () => {
      expect(sortOptions.find((o) => o.id === 'price-asc')).toBeDefined()
    })
    it('has price-desc option', () => {
      expect(sortOptions.find((o) => o.id === 'price-desc')).toBeDefined()
    })
    it('has discount option', () => {
      expect(sortOptions.find((o) => o.id === 'discount')).toBeDefined()
    })
    it('has bestseller option', () => {
      expect(sortOptions.find((o) => o.id === 'bestseller')).toBeDefined()
    })
    it('each option has labelKey and Icon', () => {
      sortOptions.forEach((opt) => {
        expect(opt.labelKey).toBeTruthy()
        expect(opt.Icon).toBeDefined()
      })
    })
  })

  describe('filterPills', () => {
    it('has 6 filter pills', () => {
      expect(filterPills).toHaveLength(6)
    })
    it('has all as first pill', () => {
      expect(filterPills[0].id).toBe('all')
    })
    it('has sale pill', () => {
      expect(filterPills.find((p) => p.id === 'sale')).toBeDefined()
    })
    it('has bestseller pill', () => {
      expect(filterPills.find((p) => p.id === 'bestseller')).toBeDefined()
    })
    it('has new pill', () => {
      expect(filterPills.find((p) => p.id === 'new')).toBeDefined()
    })
    it('has lowprice pill', () => {
      expect(filterPills.find((p) => p.id === 'lowprice')).toBeDefined()
    })
    it('has highrating pill', () => {
      expect(filterPills.find((p) => p.id === 'highrating')).toBeDefined()
    })
  })

  describe('animation variants', () => {
    it('containerVariants has hidden and visible', () => {
      expect(containerVariants.hidden.opacity).toBe(0)
      expect(containerVariants.visible.opacity).toBe(1)
    })
    it('itemVariants has hidden and visible', () => {
      expect(itemVariants.hidden.opacity).toBe(0)
      expect(itemVariants.hidden.y).toBe(20)
      expect(itemVariants.visible.opacity).toBe(1)
      expect(itemVariants.visible.y).toBe(0)
    })
    it('fadeInUp has hidden and visible', () => {
      expect(fadeInUp.hidden.opacity).toBe(0)
      expect(fadeInUp.hidden.y).toBe(15)
      expect(fadeInUp.visible.opacity).toBe(1)
    })
  })
})
