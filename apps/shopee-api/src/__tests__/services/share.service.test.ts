/// <reference types="jest" />
import { Types } from 'mongoose'
import { ShareService } from '@services/share.service'
import { ValidationError, NotFoundError } from '@services/base.service'

const mockFindByIdAndUpdate = jest.fn()

jest.mock('@database/models/product.model', () => ({
  ProductModel: { findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args) },
}))

describe('ShareService', () => {
  let service: ShareService
  const productId = new Types.ObjectId().toString()
  const userId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ShareService()
    process.env.APP_DOMAIN = 'https://shopee.test'
  })

  describe('shareProduct', () => {
    it('throws ValidationError for invalid productId', async () => {
      await expect(service.shareProduct('bad-id', userId, 'Alice')).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError for invalid userId', async () => {
      await expect(service.shareProduct(productId, 'bad-id', 'Alice')).rejects.toThrow(
        ValidationError,
      )
    })

    it('throws NotFoundError when product does not exist', async () => {
      mockFindByIdAndUpdate.mockReturnValue({
        lean: () => Promise.resolve(null),
      })

      await expect(service.shareProduct(productId, userId, 'Alice')).rejects.toThrow(NotFoundError)
    })

    it('returns shareUrl and updated shareCount', async () => {
      const updatedProduct = {
        _id: new Types.ObjectId(productId),
        name: 'Test Product',
        image: 'test.jpg',
        price: 100000,
        shareCount: 5,
      }
      mockFindByIdAndUpdate.mockReturnValue({
        lean: () => Promise.resolve(updatedProduct),
      })

      const result = await service.shareProduct(productId, userId, 'Alice')

      expect(result.shareCount).toBe(5)
      expect(result.shareUrl).toBe(`https://shopee.test/products/${productId}?ref=share`)
    })

    it('increments shareCount atomically via $inc', async () => {
      const updatedProduct = {
        _id: new Types.ObjectId(productId),
        name: 'Test Product',
        shareCount: 1,
      }
      mockFindByIdAndUpdate.mockReturnValue({
        lean: () => Promise.resolve(updatedProduct),
      })

      await service.shareProduct(productId, userId, 'Alice')

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        { $inc: { shareCount: 1 } },
        expect.objectContaining({ new: true }),
      )
    })

    it('emits product.shared event when eventBus is set', async () => {
      const updatedProduct = {
        _id: new Types.ObjectId(productId),
        name: 'Test Product',
        image: 'test.jpg',
        price: 100000,
        shareCount: 3,
      }
      mockFindByIdAndUpdate.mockReturnValue({
        lean: () => Promise.resolve(updatedProduct),
      })

      const mockEmit = jest.fn()
      service.eventBus = { emit: mockEmit } as any

      await service.shareProduct(productId, userId, 'Alice', 'avatar.jpg')

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'product.shared',
          payload: expect.objectContaining({
            productId,
            userId,
            userName: 'Alice',
            userAvatar: 'avatar.jpg',
          }),
        }),
      )
    })

    it('does not throw when eventBus is not set', async () => {
      const updatedProduct = {
        _id: new Types.ObjectId(productId),
        name: 'Test Product',
        shareCount: 1,
      }
      mockFindByIdAndUpdate.mockReturnValue({
        lean: () => Promise.resolve(updatedProduct),
      })

      // No eventBus set — should not throw
      await expect(service.shareProduct(productId, userId, 'Alice')).resolves.toBeDefined()
    })
  })
})
