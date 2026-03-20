import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PaymentMethodSelector from '../PaymentMethodSelector/PaymentMethodSelector';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

vi.mock('src/apis/checkout.api', () => ({
  default: {
    getPaymentMethods: vi.fn(() =>
      Promise.resolve({
        data: {
          data: [
            {
              _id: '1',
              type: 'cod',
              name: 'Cash on Delivery',
              description: 'Pay when you receive',
              isAvailable: true,
            },
            {
              _id: '2',
              type: 'bank_transfer',
              name: 'Bank Transfer',
              description: 'Transfer to bank account',
              isAvailable: true,
            },
          ],
        },
      }),
    ),
  },
}));

describe('PaymentMethodSelector', () => {
  const mockOnSelect = vi.fn();

  it('renders payment method selector', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PaymentMethodSelector selectedMethodType={null} onSelect={mockOnSelect} />
      </QueryClientProvider>,
    );

    expect(container.querySelector('[class]')).not.toBeNull();
  });

  it('displays loading skeleton initially', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PaymentMethodSelector selectedMethodType={null} onSelect={mockOnSelect} />
      </QueryClientProvider>,
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
