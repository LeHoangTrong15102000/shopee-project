import { Router } from 'express'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { ShopConversationModel } from '@database/models/shop-conversation.model'
import { ShopMessageModel } from '@database/models/shop-message.model'
import { STATUS } from '@constants/status'

const adminShopChatRouter = Router()

// GET /admin/shop-conversations — list all conversations with filters and pagination
adminShopChatRouter.get(
  '/',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      shop_id,
      user_id,
      date_from,
      date_to,
      flagged,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>

    const filter: Record<string, unknown> = {}

    if (shop_id && mongoose.Types.ObjectId.isValid(shop_id)) {
      filter.shopId = new mongoose.Types.ObjectId(shop_id)
    }
    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) {
      filter.userId = new mongoose.Types.ObjectId(user_id)
    }
    if (date_from || date_to) {
      const dateFilter: Record<string, Date> = {}
      if (date_from) dateFilter.$gte = new Date(date_from)
      if (date_to) dateFilter.$lte = new Date(date_to)
      filter.updatedAt = dateFilter
    }
    if (flagged === 'true') {
      filter.flagged = true
    }

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const [conversations, total] = await Promise.all([
      ShopConversationModel.find(filter)
        .populate('shopId', 'name avatar')
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ShopConversationModel.countDocuments(filter),
    ])

    // Attach message_count for each conversation
    const conversationIds = conversations.map((c) => c._id)
    const messageCounts = await ShopMessageModel.aggregate([
      { $match: { conversationId: { $in: conversationIds } } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ])
    const countMap = new Map(messageCounts.map((m) => [m._id.toString(), m.count]))

    const enriched = conversations.map((c) => ({
      ...c,
      message_count: countMap.get(c._id.toString()) ?? 0,
    }))

    res.status(STATUS.OK).json({
      message: 'Lấy danh sách cuộc trò chuyện thành công',
      data: {
        conversations: enriched,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  }),
)

// GET /admin/shop-conversations/:id — get a single conversation by ID
adminShopChatRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid conversation ID' })
      return
    }

    const conversation = await ShopConversationModel.findById(id)
      .populate('shopId', 'name avatar')
      .populate('userId', 'name email')
      .lean()

    if (!conversation) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Conversation not found' })
      return
    }

    const messageCount = await ShopMessageModel.countDocuments({
      conversationId: new mongoose.Types.ObjectId(id),
    })

    res.status(STATUS.OK).json({
      message: 'Lấy cuộc trò chuyện thành công',
      data: { ...conversation, message_count: messageCount },
    })
  }),
)

// GET /admin/shop-conversations/:id/messages — cursor-based pagination
adminShopChatRouter.get(
  '/:id/messages',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const cursor = req.query.cursor as string | undefined
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid conversation ID' })
      return
    }

    const query: Record<string, unknown> = {
      conversationId: new mongoose.Types.ObjectId(id),
    }
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) }
    }

    const messages = await ShopMessageModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = messages.length > limit
    const data = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null

    res.status(STATUS.OK).json({
      message: 'Lấy tin nhắn thành công',
      data: { messages: data.reverse(), nextCursor },
    })
  }),
)

// PATCH /admin/shop-conversations/:id/flag — flag or unflag a conversation
adminShopChatRouter.patch(
  '/:id/flag',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { flagged, reason } = req.body as { flagged: boolean; reason?: string }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid conversation ID' })
      return
    }

    const setFields: Record<string, unknown> = { flagged: !!flagged }
    if (flagged && reason) {
      setFields.flag_reason = reason
    }

    const mongoUpdate: Record<string, unknown> = { $set: setFields }
    if (!flagged) {
      mongoUpdate.$unset = { flag_reason: '' }
    }

    const conversation = await ShopConversationModel.findByIdAndUpdate(id, mongoUpdate, {
      new: true,
    }).lean()

    if (!conversation) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Conversation not found' })
      return
    }

    res.status(STATUS.OK).json({
      message: flagged ? 'Đã gắn cờ cuộc trò chuyện' : 'Đã bỏ gắn cờ cuộc trò chuyện',
      data: conversation,
    })
  }),
)

export default adminShopChatRouter
