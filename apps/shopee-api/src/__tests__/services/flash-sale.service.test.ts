/// <reference types="jest" />

/**
 * Unit Tests for FlashSaleService
 * Tasks 10.1 & 10.2:
 * - create, update, delete, activate, deactivate
 * - purchaseFlashSaleItem: decrement stock, limit per user, out of stock
 */

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

jest.mock('@database/models/purchase.model', () => ({
  PurchaseModel: { aggregate: jest.fn().mockResolvedValue([]) },
}))

import { Types } from 'mongoose'
import { FlashSaleService } from '@services/flash-sale.service'
import { IFlashSaleRepository } from '@repositories/interfaces/flash-sale.repository.interface'
import { IFlashSale, FlashSaleStatus } from '../../@types/models.type'
import { PurchaseModel } from '@database/models/purchase.model'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const objectId = () => new Types.ObjectId()

const makeSale = (overrides: Partial<IFlashSale> = {}): IFlashSale =>
  ({
    _id: objectId(),
    name: 'Test Flash Sale',
    description: 'desc',
    startTime: new Date('2026-06-01T00:00:00Z'),
    endTime: new Date('2026-06-02T00:00:00Z'),
    status: 'DRAFT' as FlashSaleStatus,
    products: [
      {
        productId: objectId(),
        originalPrice: 100,
        flashPrice: 50,
        totalQuantity: 10,
        soldQuantity: 0,
        limitPerUser: 2,
      },
    ],
    createdBy: objectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as IFlashSale

// ─── Mock Repository ─────────────────────────────────────────────────────────

const createMockRepo = (): jest.Mocked<IFlashSaleRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  findActive: jest.fn().mockResolvedValue([]),
  findByProductId: jest.fn().mockResolvedValue([]),
  findScheduled: jest.fn().mockResolvedValue([]),
  atomicDecrementSold: jest.fn(),
  findPaginated: jest.fn(),
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FlashSaleService', () => {
  let service: FlashSaleService
  let repo: jest.Mocked<IFlashSaleRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    repo = createMockRepo()
    service = new FlashSaleService(repo)
  })

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const validData = {
      name: 'Summer Sale',
      startTime: '2026-07-01T00:00:00Z',
      endTime: '2026-07-02T00:00:00Z',
      products: [
        {
          productId: objectId().toString(),
          originalPrice: 100,
          flashPrice: 50,
          totalQuantity: 10,
          limitPerUser: 2,
        },
      ],
      createdBy: objectId().toString(),
    }

    it('creates a flash sale with DRAFT status by default', async () => {
      repo.create.mockResolvedValue(makeSale({ name: 'Summer Sale' }))

      const result = await service.create(validData)

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Summer Sale', status: 'DRAFT' }),
      )
      expect(result.name).toBe('Summer Sale')
    })

    it('throws ValidationError if endTime <= startTime', async () => {
      await expect(
        service.create({ ...validData, endTime: '2026-06-30T00:00:00Z' }),
      ).rejects.toThrow('endTime must be after startTime')
    })

    it('throws ConflictError if product has overlapping flash sale', async () => {
      repo.findByProductId.mockResolvedValue([
        makeSale({ status: 'SCHEDULED' as FlashSaleStatus }),
      ])

      await expect(service.create(validData)).rejects.toThrow(/already has a flash sale/)
    })
  })

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates a DRAFT flash sale', async () => {
      const sale = makeSale({ status: 'DRAFT' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.updateById.mockResolvedValue({ ...sale, name: 'Updated' } as any)

      const result = await service.update(sale._id!.toString(), { name: 'Updated' })
      expect(result.name).toBe('Updated')
    })

    it('throws BusinessError if flash sale is ACTIVE', async () => {
      const sale = makeSale({ status: 'ACTIVE' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)

      await expect(service.update(sale._id!.toString(), { name: 'X' })).rejects.toThrow(
        /Cannot update flash sale/,
      )
    })

    it('throws BusinessError if flash sale is ENDED', async () => {
      const sale = makeSale({ status: 'ENDED' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)

      await expect(service.update(sale._id!.toString(), { name: 'X' })).rejects.toThrow(
        /Cannot update flash sale/,
      )
    })
  })

  // ─── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('hard deletes a DRAFT flash sale', async () => {
      const sale = makeSale({ status: 'DRAFT' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.deleteById.mockResolvedValue(undefined as any)

      const result = await service.delete(sale._id!.toString())
      expect(result).toEqual({ deleted: true, cancelled: false })
      expect(repo.deleteById).toHaveBeenCalledWith(sale._id!.toString())
    })

    it('soft deletes (cancels) a SCHEDULED flash sale', async () => {
      const sale = makeSale({ status: 'SCHEDULED' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.updateById.mockResolvedValue({ ...sale, status: 'CANCELLED' } as any)

      const result = await service.delete(sale._id!.toString())
      expect(result).toEqual({ deleted: false, cancelled: true })
      expect(repo.updateById).toHaveBeenCalledWith(sale._id!.toString(), {
        status: 'CANCELLED',
      })
    })

    it('soft deletes (cancels) an ACTIVE flash sale', async () => {
      const sale = makeSale({ status: 'ACTIVE' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.updateById.mockResolvedValue({ ...sale, status: 'CANCELLED' } as any)

      const result = await service.delete(sale._id!.toString())
      expect(result).toEqual({ deleted: false, cancelled: true })
    })
  })

  // ─── activate ──────────────────────────────────────────────────────────────

  describe('activate', () => {
    it('activates a DRAFT flash sale', async () => {
      const sale = makeSale({ status: 'DRAFT' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.updateById.mockResolvedValue({ ...sale, status: 'ACTIVE' } as any)

      const result = await service.activate(sale._id!.toString())
      expect(result.status).toBe('ACTIVE')
    })

    it('activates a SCHEDULED flash sale', async () => {
      const sale = makeSale({ status: 'SCHEDULED' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.updateById.mockResolvedValue({ ...sale, status: 'ACTIVE' } as any)

      const result = await service.activate(sale._id!.toString())
      expect(result.status).toBe('ACTIVE')
    })

    it('throws BusinessError if flash sale is already ACTIVE', async () => {
      const sale = makeSale({ status: 'ACTIVE' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)

      await expect(service.activate(sale._id!.toString())).rejects.toThrow(
        /Cannot activate flash sale/,
      )
    })
  })

  // ─── deactivate ────────────────────────────────────────────────────────────

  describe('deactivate', () => {
    it('deactivates an ACTIVE flash sale', async () => {
      const sale = makeSale({ status: 'ACTIVE' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)
      repo.updateById.mockResolvedValue({ ...sale, status: 'ENDED' } as any)

      const result = await service.deactivate(sale._id!.toString())
      expect(result.status).toBe('ENDED')
    })

    it('throws BusinessError if flash sale is DRAFT', async () => {
      const sale = makeSale({ status: 'DRAFT' as FlashSaleStatus })
      repo.findById.mockResolvedValue(sale)

      await expect(service.deactivate(sale._id!.toString())).rejects.toThrow(
        /Cannot deactivate flash sale/,
      )
    })
  })

  // ─── purchaseFlashSaleItem (Task 10.2) ─────────────────────────────────────

  describe('purchaseFlashSaleItem', () => {
    const productId = objectId()
    const userId = objectId()

    const activeSale = makeSale({
      status: 'ACTIVE' as FlashSaleStatus,
      startTime: new Date(Date.now() - 3600_000),
      endTime: new Date(Date.now() + 3600_000),
      products: [
        {
          productId,
          originalPrice: 100,
          flashPrice: 50,
          totalQuantity: 10,
          soldQuantity: 2,
          limitPerUser: 3,
        },
      ] as any,
    })

    it('decrements stock atomically on valid purchase', async () => {
      repo.findById.mockResolvedValue(activeSale)
      ;(PurchaseModel.aggregate as jest.Mock).mockResolvedValue([])
      repo.atomicDecrementSold.mockResolvedValue(activeSale)

      const result = await service.purchaseFlashSaleItem(
        activeSale._id!.toString(),
        productId.toString(),
        userId.toString(),
        1,
      )

      expect(repo.atomicDecrementSold).toHaveBeenCalledWith(
        activeSale._id!.toString(),
        productId.toString(),
        1,
        undefined,
      )
      expect(result).toBe(activeSale)
    })

    it('throws BusinessError when item is sold out (stock check)', async () => {
      const soldOutSale = makeSale({
        ...activeSale,
        products: [
          {
            productId,
            originalPrice: 100,
            flashPrice: 50,
            totalQuantity: 10,
            soldQuantity: 10,
            limitPerUser: 3,
          },
        ] as any,
      })
      repo.findById.mockResolvedValue(soldOutSale)
      ;(PurchaseModel.aggregate as jest.Mock).mockResolvedValue([])

      await expect(
        service.purchaseFlashSaleItem(
          soldOutSale._id!.toString(),
          productId.toString(),
          userId.toString(),
          1,
        ),
      ).rejects.toThrow('Flash sale item is sold out')
    })

    it('throws BusinessError when atomicDecrementSold returns null (race condition)', async () => {
      repo.findById.mockResolvedValue(activeSale)
      ;(PurchaseModel.aggregate as jest.Mock).mockResolvedValue([])
      repo.atomicDecrementSold.mockResolvedValue(null)

      await expect(
        service.purchaseFlashSaleItem(
          activeSale._id!.toString(),
          productId.toString(),
          userId.toString(),
          1,
        ),
      ).rejects.toThrow('Flash sale item is sold out')
    })

    it('throws BusinessError when user exceeds limitPerUser', async () => {
      repo.findById.mockResolvedValue(activeSale)
      ;(PurchaseModel.aggregate as jest.Mock).mockResolvedValue([{ _id: null, total: 3 }])

      await expect(
        service.purchaseFlashSaleItem(
          activeSale._id!.toString(),
          productId.toString(),
          userId.toString(),
          1,
        ),
      ).rejects.toThrow(/Purchase limit exceeded/)
    })

    it('throws BusinessError if flash sale is not ACTIVE', async () => {
      const draftSale = makeSale({ status: 'DRAFT' as FlashSaleStatus })
      repo.findById.mockResolvedValue(draftSale)

      await expect(
        service.purchaseFlashSaleItem(
          draftSale._id!.toString(),
          productId.toString(),
          userId.toString(),
          1,
        ),
      ).rejects.toThrow('Flash sale is not active')
    })

    it('throws BusinessError if flash sale time window has passed', async () => {
      const expiredSale = makeSale({
        status: 'ACTIVE' as FlashSaleStatus,
        startTime: new Date(Date.now() - 7200_000),
        endTime: new Date(Date.now() - 3600_000),
        products: activeSale.products,
      })
      repo.findById.mockResolvedValue(expiredSale)

      await expect(
        service.purchaseFlashSaleItem(
          expiredSale._id!.toString(),
          productId.toString(),
          userId.toString(),
          1,
        ),
      ).rejects.toThrow('Flash sale is not currently running')
    })
  })
})
