/**
 * Unit Tests for PurchaseService
 * Tests cart operations and purchase management
 */

/// <reference types="jest" />
import { PurchaseService, AddToCartDTO, BuyProductDTO } from '@services/purchase.service'
import { NotFoundError, ValidationError } from '@services/base.service'
import {
  IPurchaseRepository,
  PurchaseStatus,
} from '@repositories/interfaces/purchase.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import { Types } from 'mongoose'

// Mock purchase constants
jest.mock('@constants/purchase', () => ({
  STATUS_PURCHASE: {
    IN_CART: -1,
    ALL: 0,
    WAIT_FOR_CONFIRMATION: 1,
    WAIT_FOR_GETTING: 2,
    IN_PROGRESS: 3,
    DELIVERED: 4,
    CANCELLED: 5,
  },
}))

describe('PurchaseService', () => {
  let purchaseService: PurchaseService
  let mockPurchaseRepository: jest.Mocked<IPurchaseRepository>
  let mockProductRepository: jest.Mocked<IProductRepository>
  let mockSKURepository: jest.Mocked<ISKURepository>

  const validUserId = new Types.ObjectId().toString()
  const validProductId = new Types.ObjectId().toString()
  const validPurchaseId = new Types.ObjectId().toString()

  const mockProduct = {
    _id: new Types.ObjectId(validProductId),
    name: 'Test Product',
    price: 100,
    price_before_discount: 120,
    quantity: 10,
    sold: 5,
  }

  const mockPurchase = {
    _id: new Types.ObjectId(validPurchaseId),
    user: new Types.ObjectId(validUserId),
    product: new Types.ObjectId(validProductId),
    buy_count: 2,
    price: 100,
    price_before_discount: 120,
    status: -1, // IN_CART
  }

  beforeEach(() => {
    mockPurchaseRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      addToCart: jest.fn(),
      findCart: jest.fn(),
      findCartItem: jest.fn(),
      updateCartItem: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
      findByUser: jest.fn(),
      findByStatus: jest.fn(),
      updateStatus: jest.fn(),
      getUserStats: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
      findByIdAndUser: jest.fn(),
      deleteByUserAndProduct: jest.fn(),
      deleteManyByUserAndProducts: jest.fn(),
      switchCartItemSku: jest.fn(),
      mergeAndDeleteSourceLine: jest.fn(),
    } as unknown as jest.Mocked<IPurchaseRepository>

    mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      findProducts: jest.fn(),
      searchByName: jest.fn(),
      incrementView: jest.fn(),
      incrementSold: jest.fn(),
      decrementQuantity: jest.fn(),
      findLowStock: jest.fn(),
      findByCategory: jest.fn(),
      bulkUpdate: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<IProductRepository>

    mockSKURepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      findByProduct: jest.fn(),
      findByProductAndValue: jest.fn(),
      findByProductAndVariantValues: jest.fn(),
      atomicDecrementStock: jest.fn(),
      atomicIncrementStock: jest.fn(),
      bulkAtomicDecrementStock: jest.fn(),
      findLowStock: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<ISKURepository>

    purchaseService = new PurchaseService(
      mockPurchaseRepository,
      mockProductRepository,
      mockSKURepository,
    )
    jest.clearAllMocks()
  })

  describe('addToCart', () => {
    it('should add product to cart successfully', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.addToCart.mockResolvedValue(mockPurchase as any)

      const result = await purchaseService.addToCart(validUserId, {
        product_id: validProductId,
        buy_count: 2,
      })

      expect(mockProductRepository.findById).toHaveBeenCalledWith(validProductId)
      expect(mockPurchaseRepository.addToCart).toHaveBeenCalled()
      expect(result.buy_count).toBe(2)
    })

    it('should throw NotFoundError when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null)

      await expect(
        purchaseService.addToCart(validUserId, { product_id: validProductId, buy_count: 2 }),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError when buy_count exceeds quantity', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)

      await expect(
        purchaseService.addToCart(validUserId, { product_id: validProductId, buy_count: 100 }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('updateCartItem', () => {
    it('should update cart item successfully', async () => {
      mockPurchaseRepository.findCartItem.mockResolvedValue(mockPurchase as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.updateCartItem.mockResolvedValue({
        ...mockPurchase,
        buy_count: 5,
      } as any)

      const result = await purchaseService.updateCartItem(validUserId, validProductId, 5)

      expect(result.buy_count).toBe(5)
    })

    it('should throw NotFoundError when cart item not found', async () => {
      mockPurchaseRepository.findCartItem.mockResolvedValue(null)

      await expect(purchaseService.updateCartItem(validUserId, validProductId, 5)).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('getCart', () => {
    it('should return user cart', async () => {
      mockPurchaseRepository.findCart.mockResolvedValue([mockPurchase] as any)

      const result = await purchaseService.getCart(validUserId)

      expect(mockPurchaseRepository.findCart).toHaveBeenCalledWith(validUserId)
      expect(result.length).toBe(1)
    })
  })

  describe('clearCart', () => {
    it('should clear user cart', async () => {
      mockPurchaseRepository.clearCart.mockResolvedValue(3)

      const result = await purchaseService.clearCart(validUserId)

      expect(mockPurchaseRepository.clearCart).toHaveBeenCalledWith(validUserId)
      expect(result).toBe(3)
    })
  })

  describe('buyProducts', () => {
    it('should process purchase successfully', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem.mockResolvedValue(null)
      mockPurchaseRepository.create.mockResolvedValue(mockPurchase as any)
      mockProductRepository.decrementQuantity.mockResolvedValue(undefined)
      mockProductRepository.incrementSold.mockResolvedValue(undefined)

      const result = await purchaseService.buyProducts(validUserId, [
        { product_id: validProductId, buy_count: 2 },
      ])

      expect(result.length).toBe(1)
      expect(mockProductRepository.decrementQuantity).toHaveBeenCalled()
      expect(mockProductRepository.incrementSold).toHaveBeenCalled()
    })
  })

  describe('updatePurchaseStatus', () => {
    it('should update purchase status', async () => {
      mockPurchaseRepository.updateStatus.mockResolvedValue({ ...mockPurchase, status: 1 } as any)

      const result = await purchaseService.updatePurchaseStatus(
        validPurchaseId,
        PurchaseStatus.WAIT_FOR_CONFIRMATION,
      )

      expect(mockPurchaseRepository.updateStatus).toHaveBeenCalled()
      expect(result.status).toBe(1)
    })

    it('should throw NotFoundError when purchase not found', async () => {
      mockPurchaseRepository.updateStatus.mockResolvedValue(null)

      await expect(
        purchaseService.updatePurchaseStatus(validPurchaseId, PurchaseStatus.DELIVERED),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getCartItemsByIds', () => {
    it('should filter cart by IDs', async () => {
      const purchaseId1 = new Types.ObjectId().toString()
      const purchaseId2 = new Types.ObjectId().toString()
      const cartItems = [
        { ...mockPurchase, _id: new Types.ObjectId(purchaseId1) },
        { ...mockPurchase, _id: new Types.ObjectId(purchaseId2) },
      ]
      mockPurchaseRepository.findCart.mockResolvedValue(cartItems as any)

      const result = await purchaseService.getCartItemsByIds(validUserId, [purchaseId1])

      expect(mockPurchaseRepository.findCart).toHaveBeenCalledWith(validUserId)
      expect(result.length).toBe(1)
      expect(result[0]._id?.toString()).toBe(purchaseId1)
    })

    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        purchaseService.getCartItemsByIds('invalid-id', [validPurchaseId]),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('removeFromCart', () => {
    it('should remove matching items from cart', async () => {
      const purchase = { ...mockPurchase, user: new Types.ObjectId(validUserId), status: -1 }
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue(purchase as any)
      mockPurchaseRepository.removeFromCart.mockResolvedValue(true)

      const result = await purchaseService.removeFromCart(validUserId, [validPurchaseId])

      expect(mockPurchaseRepository.findByIdAndUser).toHaveBeenCalledWith(
        validPurchaseId,
        validUserId,
      )
      expect(mockPurchaseRepository.removeFromCart).toHaveBeenCalledWith(validPurchaseId)
      expect(result).toBe(1)
    })

    it('should skip items when findByIdAndUser returns null (user mismatch)', async () => {
      // The repository returns null when the purchase does not belong to the user
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue(null)

      const result = await purchaseService.removeFromCart(validUserId, [validPurchaseId])

      expect(mockPurchaseRepository.removeFromCart).not.toHaveBeenCalled()
      expect(result).toBe(0)
    })

    it('should skip items with wrong status', async () => {
      const purchase = { ...mockPurchase, user: new Types.ObjectId(validUserId), status: 1 }
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue(purchase as any)

      const result = await purchaseService.removeFromCart(validUserId, [validPurchaseId])

      expect(mockPurchaseRepository.removeFromCart).not.toHaveBeenCalled()
      expect(result).toBe(0)
    })
  })

  describe('getPurchases', () => {
    it('should return purchases by user', async () => {
      mockPurchaseRepository.findByUser.mockResolvedValue([mockPurchase] as any)

      const result = await purchaseService.getPurchases(validUserId)

      expect(mockPurchaseRepository.findByUser).toHaveBeenCalledWith(validUserId, undefined)
      expect(result.length).toBe(1)
    })

    it('should return purchases with status filter', async () => {
      mockPurchaseRepository.findByUser.mockResolvedValue([mockPurchase] as any)

      const result = await purchaseService.getPurchases(
        validUserId,
        PurchaseStatus.WAIT_FOR_CONFIRMATION,
      )

      expect(mockPurchaseRepository.findByUser).toHaveBeenCalledWith(
        validUserId,
        PurchaseStatus.WAIT_FOR_CONFIRMATION,
      )
      expect(result.length).toBe(1)
    })
  })

  describe('getPurchasesByStatus', () => {
    it('should return paginated purchases by status', async () => {
      const paginatedResult = {
        data: [mockPurchase],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockPurchaseRepository.findByStatus.mockResolvedValue(paginatedResult as any)

      const result = await purchaseService.getPurchasesByStatus(PurchaseStatus.DELIVERED, {
        page: 1,
        limit: 10,
      })

      expect(mockPurchaseRepository.findByStatus).toHaveBeenCalled()
      expect(result.data.length).toBe(1)
      expect(result.pagination.page).toBe(1)
    })
  })

  describe('getUserStats', () => {
    it('should return user stats from repository', async () => {
      const stats = {
        total_orders: 5,
        total_spent: 500000,
        orders_by_status: { [PurchaseStatus.DELIVERED]: 3, [PurchaseStatus.CANCELLED]: 2 },
      }
      mockPurchaseRepository.getUserStats.mockResolvedValue(stats as any)

      const result = await purchaseService.getUserStats(validUserId)

      expect(mockPurchaseRepository.getUserStats).toHaveBeenCalledWith(validUserId)
      expect(result.total_orders).toBe(5)
      expect(result.total_spent).toBe(500000)
    })
  })

  describe('buyProducts edge cases', () => {
    it('should throw NotFoundError when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null)

      await expect(
        purchaseService.buyProducts(validUserId, [{ product_id: validProductId, buy_count: 2 }]),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError when buy_count exceeds quantity', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)

      await expect(
        purchaseService.buyProducts(validUserId, [{ product_id: validProductId, buy_count: 100 }]),
      ).rejects.toThrow(ValidationError)
    })

    it('should update existing cart item instead of creating new', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem.mockResolvedValue(mockPurchase as any)
      mockPurchaseRepository.updateById.mockResolvedValue({ ...mockPurchase, status: 1 } as any)
      mockProductRepository.decrementQuantity.mockResolvedValue(undefined)
      mockProductRepository.incrementSold.mockResolvedValue(undefined)

      const result = await purchaseService.buyProducts(validUserId, [
        { product_id: validProductId, buy_count: 2 },
      ])

      expect(mockPurchaseRepository.updateById).toHaveBeenCalled()
      expect(mockPurchaseRepository.create).not.toHaveBeenCalled()
      expect(result.length).toBe(1)
    })
  })

  // Task 8.2 — variant-aware service tests
  describe('updateCartItem — variant-aware', () => {
    it('should pass skuId to findCartItem so only the matching variant line is targeted', async () => {
      const skuId = new Types.ObjectId().toString()
      const variantPurchase = { ...mockPurchase, sku: new Types.ObjectId(skuId) }
      mockPurchaseRepository.findCartItem.mockResolvedValue(variantPurchase as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      // skuRepository is now injected — mock findById so SKU stock check passes
      mockSKURepository.findById.mockResolvedValue({ _id: skuId, stock: 20, price: 100 } as any)
      mockPurchaseRepository.updateCartItem.mockResolvedValue({
        ...variantPurchase,
        buy_count: 4,
      } as any)

      const result = await purchaseService.updateCartItem(validUserId, validProductId, 4, skuId)

      // findCartItem must receive the skuId so it targets only this variant line
      expect(mockPurchaseRepository.findCartItem).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        skuId,
      )
      expect(result.buy_count).toBe(4)
    })

    it('should pass null to findCartItem when no skuId (non-variant line)', async () => {
      mockPurchaseRepository.findCartItem.mockResolvedValue(mockPurchase as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.updateCartItem.mockResolvedValue({
        ...mockPurchase,
        buy_count: 3,
      } as any)

      await purchaseService.updateCartItem(validUserId, validProductId, 3)

      expect(mockPurchaseRepository.findCartItem).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        null,
      )
    })
  })

  describe('buyProducts — variant-aware', () => {
    it('should pass skuId to findCartItem when buying a variant item', async () => {
      const skuId = new Types.ObjectId().toString()
      const variantPurchase = { ...mockPurchase, sku: new Types.ObjectId(skuId), status: -1 }
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      // skuRepository is now injected — mock findById so SKU stock check passes
      mockSKURepository.findById.mockResolvedValue({ _id: skuId, stock: 20, price: 100 } as any)
      mockPurchaseRepository.findCartItem.mockResolvedValue(variantPurchase as any)
      mockPurchaseRepository.updateById.mockResolvedValue({
        ...variantPurchase,
        status: 1,
      } as any)
      mockProductRepository.decrementQuantity.mockResolvedValue(undefined)
      mockProductRepository.incrementSold.mockResolvedValue(undefined)

      await purchaseService.buyProducts(validUserId, [
        { product_id: validProductId, buy_count: 2, sku_id: skuId },
      ])

      // findCartItem must be called with the sku_id to avoid matching the wrong variant line
      expect(mockPurchaseRepository.findCartItem).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        skuId,
      )
      // updateById transitions the correct line — create must not be called
      expect(mockPurchaseRepository.updateById).toHaveBeenCalled()
      expect(mockPurchaseRepository.create).not.toHaveBeenCalled()
    })

    it('should use null skuId in findCartItem for non-variant items', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem.mockResolvedValue(null)
      mockPurchaseRepository.create.mockResolvedValue(mockPurchase as any)
      mockProductRepository.decrementQuantity.mockResolvedValue(undefined)
      mockProductRepository.incrementSold.mockResolvedValue(undefined)

      await purchaseService.buyProducts(validUserId, [{ product_id: validProductId, buy_count: 1 }])

      // No sku_id provided → findCartItem receives null so it only matches null-sku lines
      expect(mockPurchaseRepository.findCartItem).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        null,
      )
    })
  })

  // Task 8.3 — switchCartItemVariant service tests
  describe('switchCartItemVariant', () => {
    const currentSkuId = new Types.ObjectId().toString()
    const targetSkuId = new Types.ObjectId().toString()
    const differentProductId = new Types.ObjectId().toString()

    const mockTargetSku = {
      _id: new Types.ObjectId(targetSkuId),
      product: new Types.ObjectId(validProductId),
      price: 120,
      stock: 8,
    }

    const mockVariantPurchase = {
      ...mockPurchase,
      sku: new Types.ObjectId(currentSkuId),
      buy_count: 2,
    }

    const mockSwitchedPurchase = {
      ...mockVariantPurchase,
      sku: new Types.ObjectId(targetSkuId),
      price: 120,
    }

    it('same-SKU no-op: should return existing line unchanged without calling switchCartItemSku', async () => {
      mockPurchaseRepository.findCartItem.mockResolvedValue(mockVariantPurchase as any)

      const result = await purchaseService.switchCartItemVariant(
        validUserId,
        validProductId,
        currentSkuId,
        currentSkuId, // same as current — no-op
      )

      expect(mockPurchaseRepository.findCartItem).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        currentSkuId,
      )
      expect(mockPurchaseRepository.switchCartItemSku).not.toHaveBeenCalled()
      expect(mockPurchaseRepository.mergeAndDeleteSourceLine).not.toHaveBeenCalled()
      expect(result.buy_count).toBe(2)
    })

    it('same-SKU no-op: should throw NotFoundError when cart item does not exist', async () => {
      mockPurchaseRepository.findCartItem.mockResolvedValue(null)

      await expect(
        purchaseService.switchCartItemVariant(
          validUserId,
          validProductId,
          currentSkuId,
          currentSkuId,
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('plain switch: should call switchCartItemSku and return updated line', async () => {
      mockSKURepository.findById.mockResolvedValueOnce(mockTargetSku as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem
        .mockResolvedValueOnce(mockVariantPurchase as any) // source line
        .mockResolvedValueOnce(null) // no existing target line → plain switch
      mockPurchaseRepository.switchCartItemSku.mockResolvedValue(mockSwitchedPurchase as any)

      const result = await purchaseService.switchCartItemVariant(
        validUserId,
        validProductId,
        currentSkuId,
        targetSkuId,
      )

      expect(mockSKURepository.findById).toHaveBeenCalledWith(targetSkuId)
      expect(mockPurchaseRepository.switchCartItemSku).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        currentSkuId,
        targetSkuId,
        mockTargetSku.price,
        mockProduct.price_before_discount,
      )
      expect(mockPurchaseRepository.mergeAndDeleteSourceLine).not.toHaveBeenCalled()
      expect(result.price).toBe(120)
    })

    it('target SKU not found: should throw NotFoundError', async () => {
      mockSKURepository.findById.mockResolvedValue(null)

      await expect(
        purchaseService.switchCartItemVariant(
          validUserId,
          validProductId,
          currentSkuId,
          targetSkuId,
        ),
      ).rejects.toThrow(NotFoundError)

      expect(mockPurchaseRepository.switchCartItemSku).not.toHaveBeenCalled()
    })

    it('target SKU belongs to different product: should throw ValidationError', async () => {
      const wrongProductSku = {
        ...mockTargetSku,
        product: new Types.ObjectId(differentProductId),
      }
      mockSKURepository.findById.mockResolvedValue(wrongProductSku as any)

      await expect(
        purchaseService.switchCartItemVariant(
          validUserId,
          validProductId,
          currentSkuId,
          targetSkuId,
        ),
      ).rejects.toThrow(ValidationError)

      expect(mockPurchaseRepository.switchCartItemSku).not.toHaveBeenCalled()
    })

    it('stock rejection: buy_count exceeds target SKU stock should throw ValidationError', async () => {
      const lowStockSku = { ...mockTargetSku, stock: 1 }
      mockSKURepository.findById.mockResolvedValue(lowStockSku as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem
        .mockResolvedValueOnce({ ...mockVariantPurchase, buy_count: 5 } as any) // source: 5 units
        .mockResolvedValueOnce(null) // no collision
      // effectiveBuyCount=5, stock=1 → ValidationError

      await expect(
        purchaseService.switchCartItemVariant(
          validUserId,
          validProductId,
          currentSkuId,
          targetSkuId,
        ),
      ).rejects.toThrow(ValidationError)

      expect(mockPurchaseRepository.switchCartItemSku).not.toHaveBeenCalled()
    })

    it('merge-on-collision: should call mergeAndDeleteSourceLine when target line already exists', async () => {
      const existingTargetPurchase = {
        ...mockPurchase,
        _id: new Types.ObjectId(),
        sku: new Types.ObjectId(targetSkuId),
        buy_count: 3,
      }
      const mergedPurchase = { ...existingTargetPurchase, buy_count: 5 } // 2 + 3

      mockSKURepository.findById.mockResolvedValue(mockTargetSku as any) // stock: 8
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem
        .mockResolvedValueOnce(mockVariantPurchase as any) // source: buy_count=2
        .mockResolvedValueOnce(existingTargetPurchase as any) // target line exists
      mockPurchaseRepository.mergeAndDeleteSourceLine.mockResolvedValue(mergedPurchase as any)

      const result = await purchaseService.switchCartItemVariant(
        validUserId,
        validProductId,
        currentSkuId,
        targetSkuId,
      )

      expect(mockPurchaseRepository.mergeAndDeleteSourceLine).toHaveBeenCalledWith(
        validUserId,
        validProductId,
        currentSkuId,
        targetSkuId,
        5, // 2 (source) + 3 (target)
        mockTargetSku.price,
        mockProduct.price_before_discount,
      )
      expect(mockPurchaseRepository.switchCartItemSku).not.toHaveBeenCalled()
      expect(result.buy_count).toBe(5)
    })

    it('merge cap rejection: merged buy_count exceeds target stock should throw ValidationError', async () => {
      const lowStockTargetSku = { ...mockTargetSku, stock: 4 }
      const existingTargetPurchase = {
        ...mockPurchase,
        sku: new Types.ObjectId(targetSkuId),
        buy_count: 3,
      }
      // source: buy_count=2, target: buy_count=3, merged=5 > stock=4 → ValidationError

      mockSKURepository.findById.mockResolvedValue(lowStockTargetSku as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem
        .mockResolvedValueOnce(mockVariantPurchase as any) // source: buy_count=2
        .mockResolvedValueOnce(existingTargetPurchase as any) // target exists: buy_count=3

      await expect(
        purchaseService.switchCartItemVariant(
          validUserId,
          validProductId,
          currentSkuId,
          targetSkuId,
        ),
      ).rejects.toThrow(ValidationError)

      expect(mockPurchaseRepository.mergeAndDeleteSourceLine).not.toHaveBeenCalled()
    })

    it('source line not found after SKU validation: should throw NotFoundError', async () => {
      mockSKURepository.findById.mockResolvedValue(mockTargetSku as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockPurchaseRepository.findCartItem.mockResolvedValue(null) // source line missing

      await expect(
        purchaseService.switchCartItemVariant(
          validUserId,
          validProductId,
          currentSkuId,
          targetSkuId,
        ),
      ).rejects.toThrow(NotFoundError)
    })
  })
})
