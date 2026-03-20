/// <reference types="jest" />

jest.mock('@database/models/product-sku-snapshot.model', () => {
  const mockSave = jest.fn()
  const mockToObject = jest.fn()
  return {
    ProductSkuSnapshotModel: Object.assign(
      jest.fn().mockImplementation((data: any) => ({
        save: mockSave.mockResolvedValue({ toObject: mockToObject.mockReturnValue(data) }),
        toObject: mockToObject,
      })),
      {
        insertMany: jest.fn(),
        find: jest.fn(),
      }
    ),
  }
})

import { ProductSkuSnapshotRepository } from '../../repositories/product-sku-snapshot.repository'
import { ProductSkuSnapshotModel } from '@database/models/product-sku-snapshot.model'

describe('ProductSkuSnapshotRepository', () => {
  let repo: ProductSkuSnapshotRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new ProductSkuSnapshotRepository()
  })

  describe('create', () => {
    it('should create a snapshot', async () => {
      const data = { product: 'p1', sku: 's1', order: 'o1', price: 100, quantity: 2 }
      const result = await repo.create(data as any)
      expect(result).toBeDefined()
    })
  })

  describe('createMany', () => {
    it('should create multiple snapshots', async () => {
      const mockData = [{ product: 'p1' }, { product: 'p2' }]
      ;(ProductSkuSnapshotModel.insertMany as jest.Mock).mockResolvedValue(
        mockData.map(d => ({ toObject: () => d }))
      )
      const result = await repo.createMany(mockData as any)
      expect(result).toHaveLength(2)
    })
  })

  describe('findByOrder', () => {
    it('should find snapshots by order', async () => {
      const mockLean = jest.fn().mockResolvedValue([{ product: 'p1' }])
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(ProductSkuSnapshotModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
      const result = await repo.findByOrder('order1')
      expect(ProductSkuSnapshotModel.find).toHaveBeenCalledWith({ order: 'order1' })
      expect(result).toHaveLength(1)
    })
  })

  describe('findByProduct', () => {
    it('should find snapshots by product', async () => {
      const mockLean = jest.fn().mockResolvedValue([])
      ;(ProductSkuSnapshotModel.find as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repo.findByProduct('prod1')
      expect(ProductSkuSnapshotModel.find).toHaveBeenCalledWith({ product: 'prod1' })
      expect(result).toEqual([])
    })
  })

  describe('findBySku', () => {
    it('should find snapshots by sku', async () => {
      const mockLean = jest.fn().mockResolvedValue([{ sku: 's1' }])
      ;(ProductSkuSnapshotModel.find as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repo.findBySku('sku1')
      expect(ProductSkuSnapshotModel.find).toHaveBeenCalledWith({ sku: 'sku1' })
      expect(result).toHaveLength(1)
    })
  })
})
