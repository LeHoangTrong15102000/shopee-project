/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

const ROOM_PREFIX_PRODUCT = 'product:'
const SocketEvent = {
  NEW_QUESTION: 'new_question',
  NEW_ANSWER: 'new_answer',
  QUESTION_LIKED: 'question_liked',
}

describe('QA Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock
  let mockExcept: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockExcept = jest.fn().mockReturnValue({ emit: mockEmit })
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
        except: mockExcept,
      }),
    }
  }

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    setupMockIO()
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => {
        throw new Error('IO not initialized')
      })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('emitNewQuestion', () => {
    it('should emit to product room with correct payload', async () => {
      await setupMock()
      const { emitNewQuestion } = await import('../../socket/utils/qa-emit')
      const question = { _id: 'q-123', content: 'Test question' }

      emitNewQuestion('product-456', question as any)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_PRODUCT}product-456`)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.NEW_QUESTION, {
        product_id: 'product-456',
        question,
      })
    })

    it('should use .except() when excludeSocketId provided', async () => {
      await setupMock()
      const { emitNewQuestion } = await import('../../socket/utils/qa-emit')
      const question = { _id: 'q-123', content: 'Test question' }

      emitNewQuestion('product-456', question as any, 'socket-to-exclude')

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_PRODUCT}product-456`)
      expect(mockExcept).toHaveBeenCalledWith('socket-to-exclude')
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.NEW_QUESTION, {
        product_id: 'product-456',
        question,
      })
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitNewQuestion } = await import('../../socket/utils/qa-emit')

      expect(() => emitNewQuestion('product-456', {} as any)).not.toThrow()
    })
  })

  describe('emitNewAnswer', () => {
    it('should emit to product room with question_id and answer', async () => {
      await setupMock()
      const { emitNewAnswer } = await import('../../socket/utils/qa-emit')
      const answer = { _id: 'a-789', content: 'Test answer' }

      emitNewAnswer('product-456', 'question-123', answer as any)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_PRODUCT}product-456`)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.NEW_ANSWER, {
        product_id: 'product-456',
        question_id: 'question-123',
        answer,
      })
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitNewAnswer } = await import('../../socket/utils/qa-emit')

      expect(() => emitNewAnswer('product-456', 'question-123', {} as any)).not.toThrow()
    })
  })

  describe('emitQuestionLiked', () => {
    it('should emit to product room with likes_count', async () => {
      await setupMock()
      const { emitQuestionLiked } = await import('../../socket/utils/qa-emit')

      emitQuestionLiked('product-456', 'question-123', 42)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_PRODUCT}product-456`)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.QUESTION_LIKED, {
        product_id: 'product-456',
        question_id: 'question-123',
        likes_count: 42,
      })
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitQuestionLiked } = await import('../../socket/utils/qa-emit')

      expect(() => emitQuestionLiked('product-456', 'question-123', 10)).not.toThrow()
    })
  })
})

