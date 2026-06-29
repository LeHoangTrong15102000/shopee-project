import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cart.store'
import { ExtendedPurchase, Purchase } from 'src/types/purchases.type'

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [] })
  })

  const mockItem: ExtendedPurchase = {
    _id: '1',
    product: {
      _id: 'product-1',
      name: 'Test Product',
      price: 100000,
      image: 'test.jpg',
    } as any,
    buy_count: 1,
    price: 100000,
    price_before_discount: 120000,
    status: -1,
    user: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isChecked: false,
    disabled: false,
  }

  const mockItem2: ExtendedPurchase = {
    _id: '2',
    product: {
      _id: 'product-2',
      name: 'Test Product 2',
      price: 200000,
      image: 'test2.jpg',
    } as any,
    buy_count: 2,
    price: 200000,
    price_before_discount: 250000,
    status: -1,
    isChecked: false,
    disabled: false,
  }

  describe('setItems', () => {
    it('should set items to store', () => {
      useCartStore.getState().setItems([mockItem, mockItem2])
      expect(useCartStore.getState().items).toHaveLength(2)
      expect(useCartStore.getState().items[0]._id).toBe('1')
    })

    it('should replace existing items', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().setItems([mockItem2])
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]._id).toBe('2')
    })
  })

  describe('toggleCheck', () => {
    it('should toggle item check status', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().toggleCheck(0, true)
      expect(useCartStore.getState().items[0].isChecked).toBe(true)
    })

    it('should handle invalid index gracefully', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().toggleCheck(5, true)
      expect(useCartStore.getState().items[0].isChecked).toBe(false)
    })
  })

  describe('selectAll', () => {
    it('should check all items', () => {
      useCartStore.getState().setItems([mockItem, mockItem2])
      useCartStore.getState().selectAll(true)
      expect(useCartStore.getState().items.every((item) => item.isChecked)).toBe(true)
    })

    it('should uncheck all items', () => {
      useCartStore.getState().setItems([
        { ...mockItem, isChecked: true },
        { ...mockItem2, isChecked: true },
      ])
      useCartStore.getState().selectAll(false)
      expect(useCartStore.getState().items.every((item) => !item.isChecked)).toBe(true)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity by product id', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().updateQuantity('product-1', 5)
      expect(useCartStore.getState().items[0].buy_count).toBe(5)
      expect(useCartStore.getState().items[0].disabled).toBe(false)
    })

    it('should not update if product not found', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().updateQuantity('non-existent', 5)
      expect(useCartStore.getState().items[0].buy_count).toBe(1)
    })

    it('should update only the matching sku line for the same product', () => {
      const redLine: ExtendedPurchase = {
        ...mockItem,
        _id: 'line-red',
        sku: { _id: 'sku-red' },
      }
      const blueLine: ExtendedPurchase = {
        ...mockItem,
        _id: 'line-blue',
        buy_count: 2,
        sku: { _id: 'sku-blue' },
      }
      useCartStore.getState().setItems([redLine, blueLine])
      useCartStore.getState().updateQuantity('product-1', 5, 'sku-blue')

      const items = useCartStore.getState().items
      expect(items.find((i) => i._id === 'line-red')?.buy_count).toBe(1)
      expect(items.find((i) => i._id === 'line-blue')?.buy_count).toBe(5)
    })

    it('should match the null-sku line when skuId is null', () => {
      const noSkuLine: ExtendedPurchase = { ...mockItem, _id: 'line-none' }
      const skuLine: ExtendedPurchase = {
        ...mockItem,
        _id: 'line-red',
        buy_count: 2,
        sku: { _id: 'sku-red' },
      }
      useCartStore.getState().setItems([noSkuLine, skuLine])
      useCartStore.getState().updateQuantity('product-1', 9, null)

      const items = useCartStore.getState().items
      expect(items.find((i) => i._id === 'line-none')?.buy_count).toBe(9)
      expect(items.find((i) => i._id === 'line-red')?.buy_count).toBe(2)
    })
  })

  describe('addOptimisticItem', () => {
    it('should add item to cart', () => {
      useCartStore.getState().addOptimisticItem(mockItem)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]._id).toBe('1')
    })

    it('should append to existing items', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().addOptimisticItem(mockItem2)
      expect(useCartStore.getState().items).toHaveLength(2)
    })
  })

  describe('replaceTempItems', () => {
    it('should replace temp items with real purchase', () => {
      const tempItem: ExtendedPurchase = {
        ...mockItem,
        _id: 'temp-123',
        disabled: true,
        isChecked: false,
      }

      const realPurchase: Purchase = {
        _id: 'real-123',
        product: mockItem.product,
        buy_count: 1,
        price: 100000,
        price_before_discount: 120000,
        status: -1,
        user: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      useCartStore.getState().setItems([tempItem, mockItem2])
      useCartStore.getState().replaceTempItems(realPurchase)

      expect(useCartStore.getState().items[0]._id).toBe('real-123')
      expect(useCartStore.getState().items[0].disabled).toBe(false)
      expect(useCartStore.getState().items[0].isChecked).toBe(true)
      expect(useCartStore.getState().items[1]._id).toBe('2')
    })
  })

  describe('removeTempItems', () => {
    it('should remove all temp items', () => {
      const tempItem: ExtendedPurchase = {
        ...mockItem,
        _id: 'temp-123',
      }

      useCartStore.getState().setItems([tempItem, mockItem2])
      useCartStore.getState().removeTempItems()

      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]._id).toBe('2')
    })

    it('should handle no temp items', () => {
      useCartStore.getState().setItems([mockItem, mockItem2])
      useCartStore.getState().removeTempItems()
      expect(useCartStore.getState().items).toHaveLength(2)
    })
  })

  describe('removeItems', () => {
    it('should remove items by ids', () => {
      useCartStore.getState().setItems([mockItem, mockItem2])
      useCartStore.getState().removeItems(['1'])
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]._id).toBe('2')
    })

    it('should remove multiple items', () => {
      useCartStore.getState().setItems([mockItem, mockItem2])
      useCartStore.getState().removeItems(['1', '2'])
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('restoreItems', () => {
    it('should restore items to cart', () => {
      useCartStore.getState().setItems([mockItem])
      useCartStore.getState().restoreItems([mockItem2])
      expect(useCartStore.getState().items).toHaveLength(2)
    })
  })

  describe('clearCheckedItems', () => {
    it('should remove only checked items', () => {
      useCartStore.getState().setItems([
        { ...mockItem, isChecked: true },
        { ...mockItem2, isChecked: false },
      ])
      useCartStore.getState().clearCheckedItems()
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]._id).toBe('2')
    })
  })

  describe('clearCart', () => {
    it('should clear all items', () => {
      useCartStore.getState().setItems([mockItem, mockItem2])
      useCartStore.getState().clearCart()
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })
})
