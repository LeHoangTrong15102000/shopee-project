import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import React from 'react';
import DailyCheckInPage from '../DailyCheckIn';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        ({ children, ...props }: any) => {
          const Tag = typeof prop === 'string' ? prop : 'div';
          return <Tag {...props}>{children}</Tag>;
        },
    },
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'page.title': 'Điểm danh hàng ngày',
        'page.description': 'Điểm danh hàng ngày để nhận xu và phần thưởng',
        'page.subtitle': 'Điểm danh mỗi ngày để nhận xu và phần thưởng hấp dẫn',
        'rewards.title': 'Phần thưởng theo chuỗi điểm danh',
        'tips.title': 'Mẹo nhỏ',
        'tips.streak': 'Điểm danh liên tục để nhận thưởng cao hơn',
        'tips.reset': 'Chuỗi điểm danh sẽ bị reset nếu bạn bỏ lỡ 1 ngày',
        'tips.voucher': 'Xu có thể dùng để đổi voucher giảm giá',
      };

      if (key === 'milestone' && params?.count) {
        return `${params.count} ngày`;
      }
      if (key === 'rewards.multiplier' && params?.value) {
        return `x${params.value} xu`;
      }

      return translations[key] || key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
}));

vi.mock('src/components/SEO', () => ({
  default: ({ title, description, noindex }: any) => (
    <div data-testid="seo-component">
      <span data-testid="seo-title">{title}</span>
      <span data-testid="seo-description">{description}</span>
      {noindex && <span data-testid="seo-noindex">noindex</span>}
    </div>
  ),
}));

vi.mock('src/components/DailyCheckIn', () => ({
  default: ({ className }: { className?: string }) => (
    <div className={className} data-testid="daily-checkin-component">
      Daily Check-In Component
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    );
};

describe('DailyCheckInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page with correct title and description', () => {
    const Wrapper = createWrapper();
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const titles = screen.getAllByText('Điểm danh hàng ngày');
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText('Điểm danh mỗi ngày để nhận xu và phần thưởng hấp dẫn'),
    ).toBeInTheDocument();
  });

  it('renders SEO component with correct props', () => {
    const Wrapper = createWrapper();
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    expect(screen.getByTestId('seo-component')).toBeInTheDocument();
    expect(screen.getByTestId('seo-title')).toHaveTextContent('Điểm danh hàng ngày');
    expect(screen.getByTestId('seo-description')).toHaveTextContent(
      'Điểm danh hàng ngày để nhận xu và phần thưởng',
    );
    expect(screen.getByTestId('seo-noindex')).toBeInTheDocument();
  });

  it('renders DailyCheckIn component with correct className', () => {
    const Wrapper = createWrapper();
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const dailyCheckInComponent = screen.getByTestId('daily-checkin-component');
    expect(dailyCheckInComponent).toBeInTheDocument();
    expect(dailyCheckInComponent).toHaveClass('w-full', 'max-w-md');
  });

  it('displays all reward tier cards with correct information', () => {
    const Wrapper = createWrapper();
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    expect(screen.getByText('Phần thưởng theo chuỗi điểm danh')).toBeInTheDocument();

    // Bronze tier - 3 days
    expect(screen.getByText('3 ngày')).toBeInTheDocument();
    expect(screen.getByText('x1.5 xu')).toBeInTheDocument();

    // Silver tier - 7 days
    expect(screen.getByText('7 ngày')).toBeInTheDocument();
    expect(screen.getByText('x2 xu')).toBeInTheDocument();

    // Gold tier - 14 days
    expect(screen.getByText('14 ngày')).toBeInTheDocument();
    expect(screen.getByText('x2.5 xu')).toBeInTheDocument();

    // Diamond tier - 30 days
    expect(screen.getByText('30 ngày')).toBeInTheDocument();
    expect(screen.getByText('x3 xu')).toBeInTheDocument();
  });

  it('renders all SVG icons for reward tiers', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const svgElements = container.querySelectorAll('svg');
    // 4 reward tier icons + 1 lightbulb icon = 5 total
    expect(svgElements.length).toBe(5);
  });

  it('displays tips section with all tips', () => {
    const Wrapper = createWrapper();
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    expect(screen.getByText('Mẹo nhỏ')).toBeInTheDocument();
    expect(screen.getByText('• Điểm danh liên tục để nhận thưởng cao hơn')).toBeInTheDocument();
    expect(
      screen.getByText('• Chuỗi điểm danh sẽ bị reset nếu bạn bỏ lỡ 1 ngày'),
    ).toBeInTheDocument();
    expect(screen.getByText('• Xu có thể dùng để đổi voucher giảm giá')).toBeInTheDocument();
  });

  it('applies correct styling classes to main container', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const mainContainer = container.querySelector('.rounded-xs.bg-white');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('shadow-sm', 'dark:bg-slate-800');
  });

  it('renders reward cards in a responsive grid layout', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const gridContainer = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
    expect(gridContainer).toBeInTheDocument();
  });

  it('applies correct dark mode classes to reward cards', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    // Check bronze card has dark mode classes
    const bronzeCard = container.querySelector('.border-amber-200');
    expect(bronzeCard).toHaveClass('dark:border-amber-700/50', 'dark:bg-amber-950/30');

    // Check silver card has dark mode classes
    const silverCard = container.querySelector('.border-slate-200');
    expect(silverCard).toHaveClass('dark:border-slate-600/50', 'dark:bg-slate-700/50');

    // Check gold card has dark mode classes
    const goldCard = container.querySelector('.border-yellow-200');
    expect(goldCard).toHaveClass('dark:border-yellow-700/50', 'dark:bg-yellow-950/30');

    // Check diamond card has dark mode classes
    const diamondCard = container.querySelector('.border-violet-200');
    expect(diamondCard).toHaveClass('dark:border-violet-500/30', 'dark:bg-violet-950/30');
  });

  it('renders tips section with correct background styling', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const tipsSection = container.querySelector('.bg-orange-50');
    expect(tipsSection).toBeInTheDocument();
    expect(tipsSection).toHaveClass('rounded-lg', 'p-4', 'dark:bg-slate-700');
  });

  it('renders header with border styling', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const header = container.querySelector('.border-b.border-b-gray-200');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('py-6', 'dark:border-b-slate-700');
  });

  it('renders bronze shield icon with correct styling', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const bronzeIcon = container.querySelector('.text-amber-600.dark\\:text-amber-400');
    expect(bronzeIcon).toBeInTheDocument();
    expect(bronzeIcon?.tagName).toBe('svg');
  });

  it('renders silver star icon with correct styling', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const silverIcon = container.querySelector('.text-slate-500.dark\\:text-slate-300');
    expect(silverIcon).toBeInTheDocument();
    expect(silverIcon?.tagName).toBe('svg');
  });

  it('renders gold trophy icon with correct styling', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const goldIcon = container.querySelector('.text-yellow-500.dark\\:text-yellow-400');
    expect(goldIcon).toBeInTheDocument();
    expect(goldIcon?.tagName).toBe('svg');
  });

  it('renders diamond crown icon with correct styling', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const diamondIcon = container.querySelector('.text-violet-500.dark\\:text-violet-400');
    expect(diamondIcon).toBeInTheDocument();
    expect(diamondIcon?.tagName).toBe('svg');
  });

  it('renders lightbulb icon in tips section', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const lightbulbIcon = container.querySelector(
      '.text-amber-500.dark\\:text-amber-400.inline-block',
    );
    expect(lightbulbIcon).toBeInTheDocument();
    expect(lightbulbIcon?.tagName).toBe('svg');
  });

  it('applies transition effects to reward cards', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const rewardCards = container.querySelectorAll('.transition-all.duration-300');
    expect(rewardCards.length).toBe(4);
  });

  it('renders gradient overlays on reward cards', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const gradientOverlays = container.querySelectorAll('.absolute.inset-0');
    expect(gradientOverlays.length).toBeGreaterThanOrEqual(4);
  });

  it('renders reward multipliers with correct text formatting', () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(DailyCheckInPage), { wrapper: Wrapper });

    const multipliers = container.querySelectorAll('.text-sm.font-bold');
    expect(multipliers.length).toBe(4);
  });
});
