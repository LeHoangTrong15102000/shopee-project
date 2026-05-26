import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess } from '@utils/response'
import { container } from '../../container'

export const feedRouter = Router()

/**
 * GET /feed
 * Returns the authenticated user's social feed with cursor-based pagination.
 * Query params:
 *   - limit: number (default 20, max 100)
 *   - cursor: string (opaque cursor from previous response)
 */
feedRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
    const cursor = req.query.cursor as string | undefined

    const result = await container.services.feed.getFeed(userId, limit, cursor)

    responseSuccess(res, {
      message: 'Feed retrieved successfully',
      data: {
        items: result.items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    })
  }),
)

/**
 * PATCH /feed/read-all
 * Mark all feed items as read for the authenticated user.
 */
feedRouter.patch(
  '/read-all',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const count = await container.services.feed.markAllAsRead(userId)

    responseSuccess(res, {
      message: `${count} feed items marked as read`,
      data: { count },
    })
  }),
)

/**
 * PATCH /feed/:id/read
 * Mark a specific feed item as read.
 */
feedRouter.patch(
  '/:id/read',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const feedItemId = req.params.id as string

    const updated = await container.services.feed.markAsRead(userId, feedItemId)

    responseSuccess(res, {
      message: updated ? 'Feed item marked as read' : 'Feed item not found',
      data: { updated },
    })
  }),
)

/**
 * GET /feed/unread-count
 * Returns the count of unread feed items for the authenticated user.
 */
feedRouter.get(
  '/unread-count',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const count = await container.services.feed.getUnreadCount(userId)

    responseSuccess(res, {
      message: 'Unread count retrieved',
      data: { count },
    })
  }),
)
