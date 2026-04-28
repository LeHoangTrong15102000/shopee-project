import { STATUS } from '@constants/status'
import { NotFoundError, ValidationError } from '@services/base.service'
import { ShopChatService } from '@services/shop-chat.service'
import { Request, Response } from 'express'

const shopChatService = new ShopChatService()

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const conversations = await shopChatService.getConversations(userId)
  res
    .status(STATUS.OK)
    .json({ message: 'Lấy danh sách cuộc trò chuyện thành công', data: conversations })
}

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const cursor = req.query.cursor as string | undefined
    const limit = Number(req.query.limit) || 20
    const result = await shopChatService.getMessages(String(id), cursor, limit)
    res.status(STATUS.OK).json({ message: 'Lấy tin nhắn thành công', data: result })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.jwtDecoded.id
    const { content, type = 'text', imageUrl } = req.body
    if (!content) {
      res.status(STATUS.BAD_REQUEST).json({ message: 'content là bắt buộc' })
      return
    }
    const message = await shopChatService.sendMessage(
      String(id),
      userId,
      'user',
      content,
      type,
      imageUrl,
    )
    res.status(201).json({ message: 'Gửi tin nhắn thành công', data: message })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy cuộc trò chuyện' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}

export const createOrGetConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.jwtDecoded.id
    const { shopId } = req.body
    if (!shopId) {
      res.status(STATUS.BAD_REQUEST).json({ message: 'shopId là bắt buộc' })
      return
    }
    const conversation = await shopChatService.createOrGetConversation(userId, shopId)
    res.status(200).json({ message: 'Tạo hoặc lấy cuộc trò chuyện thành công', data: conversation })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy shop' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}
