import { createMockQAQuestion } from 'src/test-utils/factories';
import type { QAQuestion } from 'src/types';

export const mockQuestions: QAQuestion[] = [
  createMockQAQuestion({
    _id: 'qa-1',
    title: 'Sản phẩm có bảo hành không?',
    answers_count: 2,
    answers: [
      {
        _id: 'ans-1',
        user: { _id: 'user-2', name: 'Admin', email: 'admin@shopee.com' },
        content: 'Có bảo hành 12 tháng',
        answer: 'Có bảo hành 12 tháng',
        likes_count: 5,
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ],
  }),
  createMockQAQuestion({
    _id: 'qa-2',
    title: 'Giao hàng mất bao lâu?',
    answers_count: 1,
  }),
  createMockQAQuestion({
    _id: 'qa-3',
    title: 'Có hỗ trợ trả góp không?',
    answers_count: 0,
  }),
];

export const mockQAStats = {
  total_questions: 3,
  total_answers: 3,
  unanswered: 1,
  avg_answers_per_question: 1,
};

