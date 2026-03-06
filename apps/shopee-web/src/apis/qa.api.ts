import { ProductQuestion, QAListConfig } from 'src/types/qa.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Mock data for fallback when API is not available
const mockQuestions: ProductQuestion[] = [
  {
    _id: 'question1',
    product_id: 'product1',
    user: { _id: 'user1', name: 'Nguyễn Văn Hùng', avatar: '' },
    question: 'Sản phẩm này có bảo hành không ạ? Thời gian bảo hành là bao lâu?',
    answers: [
      {
        _id: 'answer1',
        user: { _id: 'seller1', name: 'Shop Official', avatar: '', is_seller: true },
        answer: 'Dạ chào bạn, sản phẩm được bảo hành 12 tháng chính hãng ạ. Bạn cứ yên tâm mua hàng nhé!',
        likes_count: 5,
        is_liked: false,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        _id: 'answer2',
        user: { _id: 'user2', name: 'Trần Minh Tuấn', avatar: '' },
        answer: 'Mình mua rồi, bảo hành đầy đủ luôn bạn ơi.',
        likes_count: 2,
        is_liked: false,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    likes_count: 8,
    is_liked: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: 'question2',
    product_id: 'product1',
    user: { _id: 'user3', name: 'Lê Thị Mai', avatar: '' },
    question: 'Chất liệu sản phẩm là gì vậy shop? Có bền không ạ?',
    answers: [
      {
        _id: 'answer3',
        user: { _id: 'seller1', name: 'Shop Official', avatar: '', is_seller: true },
        answer: 'Dạ sản phẩm được làm từ chất liệu cao cấp, rất bền và chắc chắn ạ. Shop cam kết chất lượng!',
        likes_count: 3,
        is_liked: false,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
      }
    ],
    likes_count: 5,
    is_liked: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    _id: 'question3',
    product_id: 'product1',
    user: { _id: 'user4', name: 'Phạm Văn Đức', avatar: '' },
    question: 'Shop có giao hàng nhanh không? Mình ở Hà Nội thì bao lâu nhận được hàng?',
    answers: [
      {
        _id: 'answer4',
        user: { _id: 'seller1', name: 'Shop Official', avatar: '', is_seller: true },
        answer:
          'Dạ bạn ở Hà Nội thì khoảng 2-3 ngày là nhận được hàng ạ. Shop gửi hàng ngay trong ngày nếu bạn đặt trước 15h.',
        likes_count: 4,
        is_liked: false,
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        _id: 'answer5',
        user: { _id: 'user5', name: 'Hoàng Thị Lan', avatar: '' },
        answer: 'Mình ở Hà Nội đặt 3 ngày là có hàng luôn, giao nhanh lắm.',
        likes_count: 1,
        is_liked: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ],
    likes_count: 6,
    is_liked: false,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
]

const qaApi = {
  // Lấy danh sách câu hỏi của sản phẩm
  getQuestions: async (params: QAListConfig) => {
    try {
      const response = await http.get<
        SuccessResponseApi<{ questions: ProductQuestion[]; pagination: { page: number; limit: number; total: number } }>
      >('/qa/questions', { params })
      return response
    } catch (error) {
      console.warn('Q&A API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách câu hỏi thành công',
          data: {
            questions: mockQuestions,
            pagination: {
              page: Number(params.page) || 1,
              limit: Number(params.limit) || 10,
              total: mockQuestions.length
            }
          }
        }
      }
    }
  },

  // Đặt câu hỏi mới
  askQuestion: async (body: { product_id: string; question: string }) => {
    try {
      return await http.post<SuccessResponseApi<ProductQuestion>>('/qa/questions', body)
    } catch (error) {
      console.warn('⚠️ [askQuestion] API not available, using mock data')
      const newQuestion: ProductQuestion = {
        _id: `question-${Date.now()}`,
        product_id: body.product_id,
        user: { _id: 'mock-user-id', name: 'Người dùng', avatar: '' },
        question: body.question,
        answers: [],
        likes_count: 0,
        is_liked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Đặt câu hỏi thành công (mock)',
          data: newQuestion
        }
      }
    }
  },

  // Trả lời câu hỏi
  answerQuestion: async (questionId: string, body: { answer: string }) => {
    try {
      return await http.post<SuccessResponseApi<ProductQuestion>>(`/qa/questions/${questionId}/answers`, body)
    } catch (error) {
      console.warn('⚠️ [answerQuestion] API not available, using mock data')
      const mockAnswer = {
        _id: `answer-${Date.now()}`,
        user: { _id: 'mock-user-id', name: 'Người dùng', avatar: '' },
        answer: body.answer,
        likes_count: 0,
        is_liked: false,
        createdAt: new Date().toISOString()
      }
      // Return the question with the new answer added
      const updatedQuestion: ProductQuestion = {
        ...mockQuestions[0],
        _id: questionId,
        answers: [...mockQuestions[0].answers, mockAnswer],
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Trả lời câu hỏi thành công (mock)',
          data: updatedQuestion
        }
      }
    }
  },

  // Like câu hỏi
  likeQuestion: async (questionId: string) => {
    try {
      const response = await http.post<SuccessResponseApi<{ likes_count: number }>>(`/qa/questions/${questionId}/like`)
      return response
    } catch (error) {
      console.warn('⚠️ [likeQuestion] API not available, using mock data')
      return {
        data: {
          message: 'Thao tác thành công (mock)',
          data: { likes_count: 1 }
        }
      }
    }
  },

  // Like câu trả lời
  likeAnswer: async (questionId: string, answerId: string) => {
    try {
      const response = await http.post<SuccessResponseApi<{ likes_count: number }>>(
        `/qa/questions/${questionId}/answers/${answerId}/like`
      )
      return response
    } catch (error) {
      console.warn('⚠️ [likeAnswer] API not available, using mock data')
      return {
        data: {
          message: 'Thao tác thành công (mock)',
          data: { likes_count: 1 }
        }
      }
    }
  }
}

export default qaApi
