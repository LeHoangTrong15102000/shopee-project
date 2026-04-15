import { describe, it, expect } from 'vitest'
import { QueryFilters, QueryPredicates } from '../queryFilters'
import { Query } from '@tanstack/react-query'

describe('QueryFilters.products', () => {
  it('all() returns products queryKey', () => {
    expect(QueryFilters.products.all()).toEqual({ queryKey: ['products'] })
  })

  it('lists() returns products list queryKey', () => {
    expect(QueryFilters.products.lists()).toEqual({ queryKey: ['products', 'list'] })
  })

  it('list(filters) includes filters in queryKey', () => {
    const filters = { page: 1, limit: 20 } as any
    expect(QueryFilters.products.list(filters)).toEqual({
      queryKey: ['products', 'list', filters],
    })
  })

  it('detail(id) includes id in queryKey', () => {
    expect(QueryFilters.products.detail('123')).toEqual({
      queryKey: ['products', 'detail', '123'],
    })
  })

  it('search(term) includes term in queryKey', () => {
    expect(QueryFilters.products.search('iphone')).toEqual({
      queryKey: ['products', 'search', 'iphone'],
    })
  })

  it('trending() returns correct queryKey', () => {
    expect(QueryFilters.products.trending()).toEqual({ queryKey: ['products', 'trending'] })
  })

  it('related(categoryId) includes categoryId', () => {
    expect(QueryFilters.products.related('cat-1')).toEqual({
      queryKey: ['products', 'related', 'cat-1'],
    })
  })

  it('recommendations() returns correct queryKey', () => {
    expect(QueryFilters.products.recommendations()).toEqual({
      queryKey: ['products', 'recommendations'],
    })
  })
})

describe('QueryFilters.purchases', () => {
  it('all() returns purchases queryKey', () => {
    expect(QueryFilters.purchases.all()).toEqual({ queryKey: ['purchases'] })
  })

  it('byStatus(status) includes status', () => {
    expect(QueryFilters.purchases.byStatus(1)).toEqual({ queryKey: ['purchases', { status: 1 }] })
  })

  it('cart() returns status -1', () => {
    expect(QueryFilters.purchases.cart()).toEqual({ queryKey: ['purchases', { status: -1 }] })
  })

  it('history() returns correct queryKey', () => {
    expect(QueryFilters.purchases.history()).toEqual({ queryKey: ['purchases', 'history'] })
  })
})

describe('QueryFilters.user', () => {
  it('all() returns user queryKey', () => {
    expect(QueryFilters.user.all()).toEqual({ queryKey: ['user'] })
  })

  it('profile() returns correct queryKey', () => {
    expect(QueryFilters.user.profile()).toEqual({ queryKey: ['user', 'profile'] })
  })

  it('addresses() returns correct queryKey', () => {
    expect(QueryFilters.user.addresses()).toEqual({ queryKey: ['user', 'addresses'] })
  })
})

describe('QueryFilters.categories', () => {
  it('all() returns categories queryKey', () => {
    expect(QueryFilters.categories.all()).toEqual({ queryKey: ['categories'] })
  })
})

describe('QueryFilters.notifications', () => {
  it('all() returns notifications queryKey', () => {
    expect(QueryFilters.notifications.all()).toEqual({ queryKey: ['notifications'] })
  })

  it('unread() returns correct queryKey', () => {
    expect(QueryFilters.notifications.unread()).toEqual({ queryKey: ['notifications', 'unread'] })
  })

  it('count() returns correct queryKey', () => {
    expect(QueryFilters.notifications.count()).toEqual({ queryKey: ['notifications', 'count'] })
  })
})

describe('QueryFilters.categories', () => {
  it('tree() returns correct queryKey', () => {
    expect(QueryFilters.categories.tree()).toEqual({ queryKey: ['categories', 'tree'] })
  })

  it('featured() returns correct queryKey', () => {
    expect(QueryFilters.categories.featured()).toEqual({ queryKey: ['categories', 'featured'] })
  })
})

describe('QueryFilters.search', () => {
  it('all() returns search queryKey', () => {
    expect(QueryFilters.search.all()).toEqual({ queryKey: ['search'] })
  })

  it('suggestions(term) includes term', () => {
    expect(QueryFilters.search.suggestions('phone')).toEqual({
      queryKey: ['searchSuggestions', 'phone'],
    })
  })

  it('history() returns correct queryKey', () => {
    expect(QueryFilters.search.history()).toEqual({ queryKey: ['search', 'history'] })
  })
})

describe('QueryFilters.reviews', () => {
  it('all() returns reviews queryKey', () => {
    expect(QueryFilters.reviews.all()).toEqual({ queryKey: ['reviews'] })
  })

  it('byProduct(productId) includes productId', () => {
    expect(QueryFilters.reviews.byProduct('prod-123')).toEqual({
      queryKey: ['reviews', 'product', 'prod-123'],
    })
  })

  it('byUser() returns correct queryKey', () => {
    expect(QueryFilters.reviews.byUser()).toEqual({ queryKey: ['reviews', 'user'] })
  })
})

describe('QueryFilters.products - additional methods', () => {
  it('details() returns products detail queryKey', () => {
    expect(QueryFilters.products.details()).toEqual({ queryKey: ['products', 'detail'] })
  })
})

describe('QueryPredicates', () => {
  describe('productsByCategory', () => {
    it('should match products with specific category', () => {
      const predicate = QueryPredicates.productsByCategory('cat-1')
      const query = {
        queryKey: ['products', 'list', { category: 'cat-1', page: 1 }],
      } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should not match products with different category', () => {
      const predicate = QueryPredicates.productsByCategory('cat-1')
      const query = {
        queryKey: ['products', 'list', { category: 'cat-2' }],
      } as unknown as Query

      expect(predicate(query)).toBe(false)
    })

    it('should not match non-product queries', () => {
      const predicate = QueryPredicates.productsByCategory('cat-1')
      const query = {
        queryKey: ['purchases', 'list', { category: 'cat-1' }],
      } as unknown as Query

      expect(predicate(query)).toBe(false)
    })
  })

  describe('productsByPriceRange', () => {
    it('should match products within price range', () => {
      const predicate = QueryPredicates.productsByPriceRange(100, 500)
      const query = {
        queryKey: ['products', 'list', { price_min: 150, price_max: 400 }],
      } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should not match products outside price range', () => {
      const predicate = QueryPredicates.productsByPriceRange(100, 500)
      const query = {
        queryKey: ['products', 'list', { price_min: 50, price_max: 600 }],
      } as unknown as Query

      expect(predicate(query)).toBe(false)
    })

    it('should handle missing price filters', () => {
      const predicate = QueryPredicates.productsByPriceRange(100, 500)
      const query = {
        queryKey: ['products', 'list', {}],
      } as unknown as Query

      expect(predicate(query)).toBe(false)
    })
  })

  describe('userSpecificData', () => {
    it('should match user queries', () => {
      const predicate = QueryPredicates.userSpecificData()
      const query = { queryKey: ['user', 'profile'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match purchases queries', () => {
      const predicate = QueryPredicates.userSpecificData()
      const query = { queryKey: ['purchases', 'history'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match notifications queries', () => {
      const predicate = QueryPredicates.userSpecificData()
      const query = { queryKey: ['notifications', 'unread'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match product recommendations', () => {
      const predicate = QueryPredicates.userSpecificData()
      const query = { queryKey: ['products', 'recommendations'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match user reviews', () => {
      const predicate = QueryPredicates.userSpecificData()
      const query = { queryKey: ['reviews', 'user'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should not match general product queries', () => {
      const predicate = QueryPredicates.userSpecificData()
      const query = { queryKey: ['products', 'list'] } as unknown as Query

      expect(predicate(query)).toBe(false)
    })
  })

  describe('affectedByProductUpdate', () => {
    it('should match specific product detail', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['products', 'detail', 'prod-123'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should not match different product detail', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['products', 'detail', 'prod-456'] } as unknown as Query

      expect(predicate(query)).toBe(false)
    })

    it('should match product lists', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['products', 'list', {}] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match product search', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['products', 'search', 'phone'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match trending products', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['products', 'trending'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should match recommendations', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['products', 'recommendations'] } as unknown as Query

      expect(predicate(query)).toBe(true)
    })

    it('should not match non-product queries', () => {
      const predicate = QueryPredicates.affectedByProductUpdate('prod-123')
      const query = { queryKey: ['user', 'profile'] } as unknown as Query

      expect(predicate(query)).toBe(false)
    })
  })
})
