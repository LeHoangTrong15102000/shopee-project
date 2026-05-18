import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { flashSaleService } from '../container'
import {
  ValidationError,
  NotFoundError,
  BusinessError,
  ConflictError,
} from '@services/base.service'
import { IFlashSale, IFlashSaleProduct } from '../@types/models.type'
import { Logger } from '@utils/logger'

const handleError = (error: any): never => {
  if (error instanceof ValidationError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  if (error instanceof NotFoundError) {
    throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  }
  if (error instanceof BusinessError) {
    throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
  }
  if (error instanceof ConflictError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  throw error
}

/**
 * GET /admin/flash-sales
 * List all flash sales with pagination and optional status filter.
 */
export const adminListFlashSales = async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query as any
    const data = await flashSaleService.list({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    })
    return responseSuccess(res, { message: 'Lấy danh sách flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

/**
 * GET /admin/flash-sales/:id
 * Get flash sale detail by ID.
 */
export const adminGetFlashSaleById = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.getById(req.params.id as string)
    return responseSuccess(res, { message: 'Lấy chi tiết flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

/**
 * POST /admin/flash-sales
 * Create a new flash sale.
 */
export const adminCreateFlashSale = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.create({
      ...req.body,
      createdBy: req.jwtDecoded.id,
    })
    return responseSuccess(res, { message: 'Tạo flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

/**
 * PUT /admin/flash-sales/:id
 * Update a flash sale (only DRAFT or SCHEDULED).
 */
export const adminUpdateFlashSale = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.update(req.params.id as string, req.body)
    return responseSuccess(res, { message: 'Cập nhật flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

/**
 * DELETE /admin/flash-sales/:id
 * Delete a flash sale (hard delete if DRAFT, soft cancel otherwise).
 */
export const adminDeleteFlashSale = async (req: Request, res: Response) => {
  try {
    const result = await flashSaleService.delete(req.params.id as string)
    const message = result.deleted ? 'Xóa flash sale thành công' : 'Hủy flash sale thành công'
    return responseSuccess(res, { message, data: result })
  } catch (error) {
    handleError(error)
  }
}

/**
 * POST /admin/flash-sales/:id/activate
 * Manually activate a flash sale.
 * Broadcasts WebSocket event to notify connected clients.
 */
export const adminActivateFlashSale = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.activate(req.params.id as string)

    // Broadcast WebSocket activation event
    _broadcastFlashSaleActivated(data as IFlashSale)

    return responseSuccess(res, { message: 'Kích hoạt flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

/**
 * POST /admin/flash-sales/:id/deactivate
 * Manually end a flash sale.
 * Broadcasts WebSocket event to notify connected clients.
 */
export const adminDeactivateFlashSale = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.deactivate(req.params.id as string)

    // Broadcast WebSocket deactivation event
    _broadcastFlashSaleEnded(data as IFlashSale)

    return responseSuccess(res, { message: 'Kết thúc flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

/**
 * GET /admin/flash-sales/:id/stats
 * Get sales stats for a flash sale.
 */
export const adminGetFlashSaleStats = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.getStats(req.params.id as string)
    return responseSuccess(res, { message: 'Lấy thống kê flash sale thành công', data })
  } catch (error) {
    handleError(error)
  }
}

// ─── WebSocket Broadcast Helpers ─────────────────────────────────────────────

/**
 * Broadcast flash sale activated event to all connected WebSocket clients.
 * Also starts the flash sale timer for tick events.
 */
function _broadcastFlashSaleActivated(sale: IFlashSale): void {
  try {
    const { getIO } = require('../socket/socket.init')
    const io = getIO()
    if (!io) return

    io.emit('flash_sale_activated', {
      sale_id: sale._id?.toString(),
      name: sale.name,
      startTime: sale.startTime,
      endTime: sale.endTime,
      products: sale.products.map((p: IFlashSaleProduct) => ({
        product_id: p.productId.toString(),
        flash_price: p.flashPrice,
        original_price: p.originalPrice,
        total_quantity: p.totalQuantity,
        sold_quantity: p.soldQuantity,
        remaining_quantity: p.totalQuantity - p.soldQuantity,
      })),
    })

    // Start the flash sale timer for tick events
    const { startFlashSaleTimer } = require('../socket/utils/flash-sale-emit')
    startFlashSaleTimer(sale._id?.toString() || '', sale.endTime, sale.products)
  } catch (err) {
    Logger.apiError('Admin: failed to broadcast flash sale activation', {
      saleId: sale._id?.toString(),
      error: (err as Error)?.message,
    })
  }
}

/**
 * Broadcast flash sale ended event to all connected WebSocket clients.
 */
function _broadcastFlashSaleEnded(sale: IFlashSale): void {
  try {
    const { getIO } = require('../socket/socket.init')
    const io = getIO()
    if (!io) return

    io.emit('flash_sale_ended', {
      sale_id: sale._id?.toString(),
      name: sale.name,
      endTime: sale.endTime,
    })

    // Clear the timer if running
    const { clearFlashSaleTimer } = require('../socket/managers/flash-sale.manager')
    clearFlashSaleTimer(sale._id?.toString() || '')
  } catch (err) {
    Logger.apiError('Admin: failed to broadcast flash sale end', {
      saleId: sale._id?.toString(),
      error: (err as Error)?.message,
    })
  }
}
