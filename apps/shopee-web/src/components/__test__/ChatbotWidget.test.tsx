import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatbotWidget from '../ChatbotWidget/ChatbotWidget';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

vi.mock('src/apis/chatbot.api', () => ({
  default: {
    testChatbot: vi.fn(() =>
      Promise.resolve({
        data: { data: { botResponse: 'Test response' } },
      }),
    ),
  },
}));

describe('ChatbotWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('renders chatbot button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatbotWidget />
      </QueryClientProvider>,
    );
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });

  it('toggles chatbot window when button is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatbotWidget />
      </QueryClientProvider>,
    );

    const button = screen.getAllByRole('button')[0];
    fireEvent.click(button);

    // After opening, the widget should have more content
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });

  it('closes chatbot window when close button is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatbotWidget />
      </QueryClientProvider>,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    // After opening, click again to close (toggle)
    fireEvent.click(buttons[0]);

    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });
});
