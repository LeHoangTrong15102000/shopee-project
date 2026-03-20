import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import OrderStatusTracker from '../OrderStatusTracker/OrderStatusTracker';
import OrderSearchFilter from '../OrderSearchFilter/OrderSearchFilter';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('src/utils/utils', () => ({
  formatCurrency: (value: number) => value.toString(),
}));

describe('OrderStatusTracker', () => {
  it('renders order status tracker', () => {
    const { container } = render(
      <OrderStatusTracker currentStatus="pending" isSubscribed={false} />,
    );

    expect(container.querySelector('[class]')).not.toBeNull();
  });

  it('renders with subscribed status', () => {
    const { container } = render(
      <OrderStatusTracker currentStatus="confirmed" isSubscribed={true} />,
    );

    expect(container.querySelector('[class]')).not.toBeNull();
  });

  it('renders cancelled status', () => {
    const { container } = render(
      <OrderStatusTracker currentStatus="cancelled" isSubscribed={false} />,
    );

    expect(container.querySelector('[class]')).not.toBeNull();
  });
});

describe('OrderSearchFilter', () => {
  it('renders search filter', () => {
    const { container } = render(
      <OrderSearchFilter
        searchQuery=""
        onSearchChange={vi.fn()}
        dateRange={null}
        onDateRangeChange={vi.fn()}
        priceRange={null}
        onPriceRangeChange={vi.fn()}
        onClearAll={vi.fn()}
        activeFilterCount={0}
      />,
    );

    expect(container.querySelector('[class]')).not.toBeNull();
  });

  it('renders with active filters', () => {
    const { container } = render(
      <OrderSearchFilter
        searchQuery="test"
        onSearchChange={vi.fn()}
        dateRange={{ from: '2024-01-01', to: '2024-01-31' }}
        onDateRangeChange={vi.fn()}
        priceRange={{ min: 100, max: 1000 }}
        onPriceRangeChange={vi.fn()}
        onClearAll={vi.fn()}
        activeFilterCount={3}
        totalResults={10}
      />,
    );

    expect(container.querySelector('[class]')).not.toBeNull();
  });
});
