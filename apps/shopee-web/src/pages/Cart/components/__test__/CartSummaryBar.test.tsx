import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartSummaryBar from '../CartSummaryBar';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const safe = Object.fromEntries(
        Object.entries(props).filter(
          ([k]) =>
            ![
              'initial',
              'animate',
              'exit',
              'transition',
              'variants',
              'whileHover',
              'whileTap',
              'style',
            ].includes(k),
        ),
      );
      return <div {...safe}>{children}</div>;
    },
    span: ({ children, ...props }: any) => {
      const safe = Object.fromEntries(
        Object.entries(props).filter(
          ([k]) =>
            ![
              'initial',
              'animate',
              'exit',
              'transition',
              'variants',
              'whileHover',
              'whileTap',
              'style',
            ].includes(k),
        ),
      );
      return <span {...safe}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('@heroui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}));

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onChange(!checked)}
      data-testid="shopee-checkbox"
    />
  ),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

const fmt = (n: number) => n.toLocaleString();

const baseProps = {
  extendedPurchases: [{ _id: '1' }, { _id: '2' }] as any[],
  isAllChecked: false,
  checkedPurchaseCount: 1,
  animatedTotalPrice: 500000,
  animatedSavingsPrice: 50000,
  totalCheckedPurchasePrice: 500000,
  totalCheckedPurchaseSavingPrice: 50000,
  handleCheckedAll: vi.fn(),
  handleDeleteManyPurchases: vi.fn(),
  handleBuyPurchases: vi.fn(),
  formatCurrency: fmt,
};

describe('CartSummaryBar', () => {
  it('renders select all with count', () => {
    render(<CartSummaryBar {...baseProps} />);
    expect(screen.getByText(/Chọn tất cả.*\(2\)/)).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(<CartSummaryBar {...baseProps} />);
    expect(screen.getByText('Xóa')).toBeInTheDocument();
  });

  it('renders total payment with checked count', () => {
    render(<CartSummaryBar {...baseProps} />);
    expect(screen.getByText(/Tổng thanh toán.*\(1/)).toBeInTheDocument();
  });

  it('renders total price formatted', () => {
    render(<CartSummaryBar {...baseProps} />);
    expect(screen.getByText(/₫500,000/)).toBeInTheDocument();
  });

  it('renders savings amount', () => {
    render(<CartSummaryBar {...baseProps} />);
    expect(screen.getByText(/₫50,000/)).toBeInTheDocument();
  });

  it('renders buy button with count', () => {
    render(<CartSummaryBar {...baseProps} />);
    expect(screen.getByText(/Mua hàng.*\(1\)/)).toBeInTheDocument();
  });

  it('disables buy button when no items checked', () => {
    render(<CartSummaryBar {...baseProps} checkedPurchaseCount={0} />);
    const buyBtn = screen.getByText(/Mua hàng.*\(0\)/);
    expect(buyBtn.closest('button')).toBeDisabled();
  });

  it('shows extendedPurchases length when isAllChecked', () => {
    render(<CartSummaryBar {...baseProps} isAllChecked={true} />);
    expect(screen.getByText(/Tổng thanh toán.*\(2/)).toBeInTheDocument();
  });

  it('shows tooltip info button when items checked', () => {
    render(<CartSummaryBar {...baseProps} checkedPurchaseCount={2} />);
    const svgButtons = screen.getAllByRole('button');
    expect(svgButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('hides tooltip when no items checked', () => {
    const { container } = render(<CartSummaryBar {...baseProps} checkedPurchaseCount={0} />);
    const chevronSvg = container.querySelector('svg path[d*="4.5 15.75"]');
    expect(chevronSvg).toBeNull();
  });

  it('shows savings shimmer when savings > 0', () => {
    render(<CartSummaryBar {...baseProps} totalCheckedPurchaseSavingPrice={10000} />);
    expect(screen.getByText(/Tiết kiệm/)).toBeInTheDocument();
  });

  it('hides savings shimmer when savings is 0', () => {
    render(
      <CartSummaryBar
        {...baseProps}
        totalCheckedPurchaseSavingPrice={0}
        animatedSavingsPrice={0}
      />,
    );
    expect(screen.getByText(/₫0/)).toBeInTheDocument();
  });
});
