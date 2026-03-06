import { describe, it, expect } from 'vitest'
import { QueryFilters } from '../queryFilters'

describe('QueryFilters.products', () => {
  it('all() returns products queryKey', () => {
    expect(QueryFilters.products.all()).toEqual({ queryKey: ['products'] })
  })

  it('lists() returns products list queryKey', () => {
    expect(QueryFilters.products.lists()).toEqual({ queryKey: ['products', 'list'] })
  })

  it('list(filters) includes filters in queryKey', () => {
    const filters = { page: 1, limit: 20 } as any
    expect(QueryFilters.products.list(filters)).toEqual({ queryKey: ['products', 'list', filters] })
  })

  it('detail(id) includes id in queryKey', () => {
    expect(QueryFilters.products.detail('123')).toEqual({ queryKey: ['products', 'detail', '123'] })
  })

  it('search(term) includes term in queryKey', () => {
    expect(QueryFilters.products.search('iphone')).toEqual({ queryKey: ['products', 'search', 'iphone'] })
  })

  it('trending() returns correct queryKey', () => {
    expect(QueryFilters.products.trending()).toEqual({ queryKey: ['products', 'trending'] })
  })

  it('related(categoryId) includes categoryId', () => {
    expect(QueryFilters.products.related('cat-1')).toEqual({ queryKey: ['products', 'related', 'cat-1'] })
  })

  it('recommendations() returns correct queryKey', () => {
    expect(QueryFilters.products.recommendations()).toEqual({ queryKey: ['products', 'recommendations'] })
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
