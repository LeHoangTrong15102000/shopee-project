import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import React from 'react';
import ConversationHistory from '../User/pages/ConversationHistory/ConversationHistory';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'history.title': 'Lịch sử hội thoại',
        'history.subtitle': 'Quản lý các cuộc hội thoại với trợ lý AI',
        'history.empty': 'Chưa có cuộc hội thoại nào',
        'history.seoTitle': 'Lịch sử hội thoại | Shopee Clone',
        'history.seoDescription': 'Quản lý lịch sử hội thoại với trợ lý AI',
      };
      return translations[key] || key;
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}));

vi.mock('src/apis/chatbot.api', () => ({
  default: {
    getConversations: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            conversations: [],
          },
        },
      }),
    ),
    deleteConversation: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('framer-motion', () => ({
  motion: {
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    );
};

describe('ConversationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conversation history page', async () => {
    const Wrapper = createWrapper();
    render(React.createElement(ConversationHistory), { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument();
    });
  });

  it('displays page description', async () => {
    const Wrapper = createWrapper();
    render(React.createElement(ConversationHistory), { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Quản lý các cuộc hội thoại với trợ lý AI')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    const Wrapper = createWrapper();
    render(React.createElement(ConversationHistory), { wrapper: Wrapper });

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state when no conversations', async () => {
    const Wrapper = createWrapper();
    render(React.createElement(ConversationHistory), { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Chưa có cuộc hội thoại nào')).toBeInTheDocument();
    });
  });
});
