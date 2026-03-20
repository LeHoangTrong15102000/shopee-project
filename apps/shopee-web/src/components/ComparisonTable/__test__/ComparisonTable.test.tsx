import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComparisonTable from '../ComparisonTable';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = p;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...p }: any) => {
      const { animate, transition, ...rest } = p;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props;
    return (
      <button onClick={onClick} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    );
  },
}));

const mockRemoveFromCompare = vi.fn();
const mockClearCompare = vi.fn();
let mockCompareList: any[] = [];

vi.mock('src/hooks/useProductComparison', () => ({
  useProductComparison: () => ({
    compareList: mockCompareList,
    removeFromCompare: mockRemoveFromCompare,
    clearCompare: mockClearCompare,
  }),
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('../components/ComparisonTableEmpty', () => ({
  default: ({ className }: any) => (
    <div data-testid="empty-state" className={className}>
      Empty
    </div>
  ),
}));

vi.mock('../components/ComparisonSummary', () => ({
  default: ({ comparisonSummary }: any) => (
    <div data-testid="comparison-summary">{comparisonSummary ? 'has summary' : 'no summary'}</div>
  ),
}));

vi.mock('../components/ComparisonMobileCard', () => ({
  default: () => <div data-testid="mobile-card">mobile</div>,
}));

vi.mock('../components/ComparisonTableDesktop', () => ({
  default: () => <div data-testid="desktop-table">desktop</div>,
}));

const product1 = {
  _id: 'p1',
  name: 'A',
  price: 100000,
  price_before_discount: 200000,
  quantity: 50,
  sold: 500,
  rating: 4.5,
  view: 1000,
  description: '',
  images: [],
  image: '',
  category: { _id: 'c1', name: 'Cat' },
  createdAt: '',
  updatedAt: '',
};
const product2 = {
  _id: 'p2',
  name: 'B',
  price: 150000,
  price_before_discount: 200000,
  quantity: 30,
  sold: 300,
  rating: 4.0,
  view: 500,
  description: '',
  images: [],
  image: '',
  category: { _id: 'c1', name: 'Cat' },
  createdAt: '',
  updatedAt: '',
};

describe('ComparisonTable', () => {
  it('renders empty state when no products', () => {
    mockCompareList = [];
    render(<ComparisonTable />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders table when products exist', () => {
    mockCompareList = [product1, product2];
    render(<ComparisonTable />);
    expect(screen.getByTestId('desktop-table')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-card')).toBeInTheDocument();
  });

  it('renders comparison summary when 2+ products', () => {
    mockCompareList = [product1, product2];
    render(<ComparisonTable />);
    expect(screen.getByTestId('comparison-summary')).toBeInTheDocument();
  });

  it('renders clear all button', () => {
    mockCompareList = [product1, product2];
    render(<ComparisonTable />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls clearCompare when clear button clicked', () => {
    mockCompareList = [product1, product2];
    render(<ComparisonTable />);
    const clearButton = screen.getAllByRole('button')[0];
    fireEvent.click(clearButton);
    expect(mockClearCompare).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    mockCompareList = [product1, product2];
    render(<ComparisonTable className="custom" />);
    const region = screen.getByRole('region');
    expect(region.className).toContain('custom');
  });

  it('renders with single product (no bestValues)', () => {
    mockCompareList = [product1];
    render(<ComparisonTable />);
    // Single product still shows table, not empty
    expect(screen.getByTestId('desktop-table')).toBeInTheDocument();
  });
});
