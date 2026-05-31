/**
 * Unit tests for FlashSaleSchedulerWorker.
 *
 * The worker uses dynamic imports for FlashSaleModel and socket.init,
 * so we mock those modules before instantiating the worker.
 */

/// <reference types="jest" />
import { Types } from 'mongoose'

// ── Mock logger ───────────────────────────────────────────────────────────────
jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

// ── Mock BullMQ Worker so no real Redis connection is made ──────────────────
jest.mock('bullmq', () => {
  const mockWorkerInstance = {
    on: jest.fn(),
  }
  return {
    Worker: jest.fn().mockImplementation((_queue: string, processor: Function) => {
      // Expose the processor so tests can invoke it directly
      mockWorkerInstance._processor = processor
      return mockWorkerInstance
    }),
  }
})

// ── Mock worker connection helper ───────────────────────────────────────────
jest.mock('../../workers/worker.connection', () => ({
  getWorkerConnection: jest.fn().mockReturnValue({}),
}))

// ── Mock socket.init ─────────────────────────────────────────────────────────
const mockIoEmit = jest.fn()
jest.mock('../../socket/socket.init', () => ({
  getIO: jest.fn().mockReturnValue({ emit: mockIoEmit }),
}))

// ── Mock flash-sale-emit util ────────────────────────────────────────────────
jest.mock('../../socket/utils/flash-sale-emit', () => ({
  startFlashSaleTimer: jest.fn(),
}))

// ── Mock container (for audit log) ──────────────────────────────────────────
jest.mock('../../container', () => ({
  auditLogService: {
    writeLog: jest.fn(),
  },
}))

// ── Mock FlashSaleModel ──────────────────────────────────────────────────────
const mockFind = jest.fn()
const mockFindByIdAndUpdate = jest.fn()

jest.mock('@database/models/flash-sale.model', () => ({
  FlashSaleModel: {
    find: mockFind,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}))

// ── Import after mocks are set up ────────────────────────────────────────────
import { FlashSaleSchedulerWorker } from '../../workers/flash-sale-scheduler.worker'
import { EventBus } from '../../events/event-bus'

const makeSale = (overrides: Partial<{ _id: Types.ObjectId; name: string; startTime: Date; endTime: Date; products: any[] }> = {}) => ({
  _id: new Types.ObjectId(),
  name: 'Test Sale',
  startTime: new Date(Date.now() - 1000),
  endTime: new Date(Date.now() + 60_000),
  products: [],
  ...overrides,
})

describe('FlashSaleSchedulerWorker', () => {
  let worker: FlashSaleSchedulerWorker
  let eventBus: EventBus

  beforeEach(() => {
    jest.clearAllMocks()
    mockFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    mockFindByIdAndUpdate.mockResolvedValue({})
    eventBus = new EventBus()
    worker = new FlashSaleSchedulerWorker(eventBus)
  })

  describe('_activateScheduled', () => {
    it('activates SCHEDULED sales whose startTime has passed', async () => {
      const sale = makeSale()
      // First call (SCHEDULED query) returns the sale
      mockFind
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      await worker._activateScheduled(new Date())

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(sale._id, { $set: { status: 'ACTIVE' } })
    })

    it('broadcasts flash_sale_activated via Socket.IO', async () => {
      const sale = makeSale()
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      await worker._activateScheduled(new Date())

      expect(mockIoEmit).toHaveBeenCalledWith('flash_sale_activated', expect.objectContaining({
        sale_id: sale._id.toString(),
        name: sale.name,
      }))
    })

    it('emits flash_sale.started domain event via EventBus', async () => {
      const sale = makeSale()
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      const emittedEvents: any[] = []
      eventBus.on('flash_sale.started', (e) => emittedEvents.push(e))

      await worker._activateScheduled(new Date())

      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0].payload.saleId).toBe(sale._id.toString())
      expect(emittedEvents[0].payload.name).toBe(sale.name)
    })

    it('does nothing when there are no SCHEDULED sales', async () => {
      // default mockReturnValue([]) from beforeEach handles this case

      await worker._activateScheduled(new Date())

      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
      expect(mockIoEmit).not.toHaveBeenCalled()
    })

    it('writes audit log FLASH_SALE_AUTO_ACTIVATE for each activated sale', async () => {
      const sale = makeSale()
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      await worker._activateScheduled(new Date())
      // Flush microtasks so the floating import().then() resolves
      await new Promise(process.nextTick)

      const { auditLogService } = await import('../../container')
      expect(auditLogService.writeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLASH_SALE_AUTO_ACTIVATE',
          resource: 'flash-sale',
          resourceId: sale._id.toString(),
        }),
      )
    })

    it('does NOT emit domain event when constructed without an eventBus', async () => {
      const workerNoEventBus = new FlashSaleSchedulerWorker()
      const sale = makeSale()
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      // Spy on EventBus.emit to confirm it is never called
      const emitSpy = jest.spyOn(eventBus, 'emit')

      await workerNoEventBus._activateScheduled(new Date())

      expect(emitSpy).not.toHaveBeenCalled()
    })
  })

  describe('_endExpired', () => {
    it('ends ACTIVE sales whose endTime has passed', async () => {
      const sale = makeSale({ endTime: new Date(Date.now() - 1000) })
      mockFind
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) }) // ACTIVE query

      await worker._endExpired(new Date())

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(sale._id, { $set: { status: 'ENDED' } })
    })

    it('broadcasts flash_sale_ended via Socket.IO', async () => {
      const sale = makeSale({ endTime: new Date(Date.now() - 1000) })
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      await worker._endExpired(new Date())

      expect(mockIoEmit).toHaveBeenCalledWith('flash_sale_ended', expect.objectContaining({
        sale_id: sale._id.toString(),
        name: sale.name,
      }))
    })

    it('emits flash_sale.ended domain event via EventBus', async () => {
      const sale = makeSale({ endTime: new Date(Date.now() - 1000) })
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      const emittedEvents: any[] = []
      eventBus.on('flash_sale.ended', (e) => emittedEvents.push(e))

      await worker._endExpired(new Date())

      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0].payload.saleId).toBe(sale._id.toString())
    })

    it('does nothing when there are no expired ACTIVE sales', async () => {
      // default mockReturnValue([]) from beforeEach handles this case

      await worker._endExpired(new Date())

      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('writes audit log FLASH_SALE_AUTO_DEACTIVATE for each ended sale', async () => {
      const sale = makeSale({ endTime: new Date(Date.now() - 1000) })
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale]) })

      await worker._endExpired(new Date())
      // Flush microtasks so the floating import().then() resolves
      await new Promise(process.nextTick)

      const { auditLogService } = await import('../../container')
      expect(auditLogService.writeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FLASH_SALE_AUTO_DEACTIVATE',
          resource: 'flash-sale',
          resourceId: sale._id.toString(),
        }),
      )
    })
  })

  describe('error resilience', () => {
    it('continues processing remaining sales when one activation fails', async () => {
      const sale1 = makeSale({ name: 'Sale 1' })
      const sale2 = makeSale({ name: 'Sale 2' })
      mockFind.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([sale1, sale2]) })

      // First update throws, second succeeds
      mockFindByIdAndUpdate
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({})

      // Should not throw
      await expect(worker._activateScheduled(new Date())).resolves.not.toThrow()

      // Second sale should still have been attempted
      expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(2)
    })
  })
})
