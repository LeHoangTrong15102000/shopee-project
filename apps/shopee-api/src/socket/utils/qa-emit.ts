import { SOCKET_CONFIG } from '@constants/socket'
import {
  SocketEvent,
  NewQuestionPayload,
  NewAnswerPayload,
  QuestionLikedPayload,
} from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit a new question event to all users viewing a product (exclude creator)
 * @param productId - The product ID
 * @param question - The question data
 * @param excludeSocketId - Socket ID of the question creator to exclude
 */
export const emitNewQuestion = (
  productId: string,
  question: NewQuestionPayload['question'],
  excludeSocketId?: string,
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: NewQuestionPayload = {
      product_id: productId,
      question,
    }

    if (excludeSocketId) {
      io.to(room).except(excludeSocketId).emit(SocketEvent.NEW_QUESTION, payload)
    } else {
      io.to(room).emit(SocketEvent.NEW_QUESTION, payload)
    }

    Logger.apiInfo('New question emitted to product room', {
      productId,
      room,
      questionId: question._id,
    })
  } catch (error) {
    Logger.apiError('Failed to emit new question', {
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a new answer event to all users viewing a product
 * @param productId - The product ID
 * @param questionId - The question ID
 * @param answer - The answer data
 */
export const emitNewAnswer = (
  productId: string,
  questionId: string,
  answer: NewAnswerPayload['answer'],
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: NewAnswerPayload = {
      product_id: productId,
      question_id: questionId,
      answer,
    }

    io.to(room).emit(SocketEvent.NEW_ANSWER, payload)

    Logger.apiInfo('New answer emitted to product room', {
      productId,
      room,
      questionId,
    })
  } catch (error) {
    Logger.apiError('Failed to emit new answer', {
      productId,
      questionId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a question liked event to all users viewing a product
 * @param productId - The product ID
 * @param questionId - The question ID
 * @param likesCount - Updated likes count
 */
export const emitQuestionLiked = (
  productId: string,
  questionId: string,
  likesCount: number,
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: QuestionLikedPayload = {
      product_id: productId,
      question_id: questionId,
      likes_count: likesCount,
    }

    io.to(room).emit(SocketEvent.QUESTION_LIKED, payload)

    Logger.apiInfo('Question liked emitted to product room', {
      productId,
      room,
      questionId,
      likesCount,
    })
  } catch (error) {
    Logger.apiError('Failed to emit question liked', {
      productId,
      questionId,
      error: error instanceof Error ? error.message : error,
    })
  }
}
