import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LiveOrderTracker from '../LiveOrderTracker/LiveOrderTracker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

vi.mock('src/apis/orderTracking.api', () => ({
  default: {
    getTracking: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            timeline: [
              { status: 'pending', timestamp: '2024-01-01T00:00:00Z' },
              { status: 'confirmed', timestamp: '2024-01-01T01:00:00Z' },
            ],
          },
        },
      }),
    ),
  },
}));

vi.mock('src/hooks/useOrderTracking', () => ({
  default: vi.fn(() => ({
    currentStatus: 'confirmed',
    lastUpdate: '2024-01-01T01:00:00Z',
    isSubscribed: true,
    statusHistory: [],
  })),
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('src/components/OrderTimeline', () => ({
  default: () => <div>OrderTimeline</div>,
}));

describe('LiveOrderTracker', () => {
  it('renders order tracker component', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <LiveOrderTracker orderId="test-order-id" initialStatus={1} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('tracking.title')).toBeInTheDocument();
  });

  it('displays tracking title', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LiveOrderTracker orderId="test-order-id" initialStatus={1} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('tracking.title')).toBeInTheDocument();
  });

  it('shows tracking number', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LiveOrderTracker
          orderId="test-order-id"
          initialStatus={1}
          trackingNumber="VN2024SHOP001"
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/VN2024SHOP001/).length).toBeGreaterThan(0);
  });

  it('displays carrier information', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LiveOrderTracker orderId="test-order-id" initialStatus={1} carrier="Giao Hàng Nhanh" />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Giao Hàng Nhanh')).toBeInTheDocument();
  });
});
