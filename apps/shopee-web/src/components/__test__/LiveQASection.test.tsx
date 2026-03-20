import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveQASection from '../LiveQASection/LiveQASection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

describe('LiveQASection', () => {
  it('renders nothing when no new questions or answers', () => {
    const { container } = render(<LiveQASection newQuestionCount={0} newAnswers={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders when there are new questions', () => {
    const { container } = render(<LiveQASection newQuestionCount={5} newAnswers={[]} />);

    expect(screen.getByText(/qa.newQuestions/)).toBeInTheDocument();
  });

  it('displays new question count', () => {
    render(<LiveQASection newQuestionCount={5} newAnswers={[]} />);

    expect(screen.getByText(/qa.newQuestions/)).toBeInTheDocument();
  });

  it('renders new answers', () => {
    const newAnswers = [
      {
        question_id: '1',
        answer: {
          user_name: 'John Doe',
          answer: 'This is a test answer',
          is_seller: false,
        },
      },
    ];

    render(<LiveQASection newQuestionCount={0} newAnswers={newAnswers} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('This is a test answer')).toBeInTheDocument();
  });

  it('highlights seller answers', () => {
    const newAnswers = [
      {
        question_id: '1',
        answer: {
          user_name: 'Seller',
          answer: 'Seller response',
          is_seller: true,
        },
      },
    ];

    render(<LiveQASection newQuestionCount={0} newAnswers={newAnswers} />);

    expect(screen.getByText(/qa.seller/)).toBeInTheDocument();
  });

  it('limits displayed answers to 3', () => {
    const newAnswers = [
      {
        question_id: '1',
        answer: { user_name: 'User1', answer: 'Answer 1', is_seller: false },
      },
      {
        question_id: '2',
        answer: { user_name: 'User2', answer: 'Answer 2', is_seller: false },
      },
      {
        question_id: '3',
        answer: { user_name: 'User3', answer: 'Answer 3', is_seller: false },
      },
      {
        question_id: '4',
        answer: { user_name: 'User4', answer: 'Answer 4', is_seller: false },
      },
    ];

    const { container } = render(<LiveQASection newQuestionCount={0} newAnswers={newAnswers} />);

    const answerElements = container.querySelectorAll('.flex.items-start.gap-2');
    expect(answerElements.length).toBe(3);
  });
});
