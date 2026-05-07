import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { ConversationModel } from '@database/models/conversation.model'
import { Types } from 'mongoose'

export const adminGetConversations = async (req: Request, res: Response) => {
  const { page, limit, user_id, status, date_from, date_to } = req.query as any
  const pageNum = Number(page) || 1
  const limitNum = Number(limit) || 20
  const skip = (pageNum - 1) * limitNum

  const query: Record<string, unknown> = {}
  if (user_id) query.user = new Types.ObjectId(user_id)
  if (status) query.status = status
  if (date_from || date_to) {
    const dateFilter: Record<string, Date> = {}
    if (date_from) dateFilter.$gte = new Date(date_from as string)
    if (date_to) {
      const toDate = new Date(date_to as string)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.$lte = toDate
    }
    query.createdAt = dateFilter
  }

  const [conversations, total] = await Promise.all([
    ConversationModel.aggregate([
      { $match: query },
      { $sort: { lastActivity: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
          as: '_userArr',
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$_userArr', 0] },
          message_count: { $size: '$messages' },
        },
      },
      {
        $project: {
          _userArr: 0,
          messages: 0,
        },
      },
    ]),
    ConversationModel.countDocuments(query),
  ])

  return responseSuccess(res, {
    message: 'Lấy danh sách hội thoại thành công',
    data: {
      conversations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
  })
}

export const adminGetConversation = async (req: Request, res: Response) => {
  const conv = await ConversationModel.findById(req.params.id)
    .populate('user', 'name email avatar')
    .lean()

  if (!conv) {
    return responseSuccess(res, { message: 'Không tìm thấy hội thoại', data: null })
  }

  const messages = ((conv as any).messages ?? []).map((m: any) => ({
    _id: m.id ?? m._id,
    sender_type: m.role === 'user' ? 'user' : 'bot',
    content: m.content,
    createdAt: m.timestamp,
  }))

  return responseSuccess(res, {
    message: 'Lấy chi tiết hội thoại thành công',
    data: {
      ...(conv as any),
      message_count: messages.length,
      messages,
    },
  })
}

export const adminDeleteConversation = async (req: Request, res: Response) => {
  const result = await ConversationModel.findByIdAndDelete(req.params.id).lean()
  return responseSuccess(res, {
    message: result ? 'Xóa hội thoại thành công' : 'Không tìm thấy hội thoại',
    data: result,
  })
}
