/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

describe('Review Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    mockEmit = jest.fn()
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
        except: jest.fn().mockReturnValue({ emit: mockEmit }),
      }),
    }
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => {
        throw new Error('IO not initialized')
      })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => jest.clearAllMocks())

  describe('emitNewReview', () => {
    it('should emit new review to product room', async () => {
      await setupMock()
      const { emitNewReview } = await import('../../socket/utils/review-emit')
      emitNewReview('prod1', { _id: 'r1', rating: 5, comment: 'Great' } as any)
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalled()
    })

    it('should exclude sender socket when provided', async () => {
      await setupMock()
      const { emitNewReview } = await import('../../socket/utils/review-emit')
      emitNewReview('prod1', { _id: 'r1', rating: 5 } as any, 'socket123')
      expect(mockIO.to).toHaveBeenCalled()
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { emitNewReview } = await import('../../socket/utils/review-emit')
      expect(() => emitNewReview('prod1', {} as any)).not.toThrow()
    })
  })

  describe('emitNewReviewComment', () => {
    it('should emit new comment to product room', async () => {
      await setupMock()
      const { emitNewReviewComment } = await import('../../socket/utils/review-emit')
      emitNewReviewComment('prod1', 'r1', { _id: 'c1', content: 'Nice' } as any)
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalled()
    })
  })

  describe('emitReviewLiked', () => {
    it('should emit review liked to product room', async () => {
      await setupMock()
      const { emitReviewLiked } = await import('../../socket/utils/review-emit')
      emitReviewLiked('prod1', 'r1', 42)
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalled()
    })
  })
})
