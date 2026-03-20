import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartSummaryBar from 'src/pages/Cart/components/CartSummaryBar';
import { ExtendedPurchase } from 'src/pages/Cart/types';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@heroui/tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip-wrapper">
      {children}
      <div data-testid="tooltip-content">{content}</div>
    </div>
  ),
}));

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      data-testid="select-all-checkbox"
    />
  ),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

const mockPurchase: ExtendedPurchase = {
  _id: 'purchase-1',
  product: {
    _id: 'product-1',
    name: 'Test Product',
    image: 'https://example.com/image.jpg',
    price: 100000,
    price_before_discount: 150000,
    quantity: 10,
  },
  buy_count: 2,
  price: 100000,
  isChecked: true,
};

const defaultProps = {
  extendedPurchases: [mockPurchase],
  isAllChecked: false,
  checkedPurchaseCount: 1,
  animatedTotalPrice: 200000,
  animatedSavingsPrice: 100000,
  totalCheckedPurchasePrice: 200000,
  totalCheckedPurchaseSavingPrice: 100000,
  handleCheckedAll: vi.fn(),
  handleDeleteManyPurchases: vi.fn(),
  handleBuyPurchases: vi.fn(),
  formatCurrency: (value: number) => value.toLocaleString(),
};

const renderComponent = (props = {}) => {
  return render(<CartSummaryBar {...defaultProps} {...props} />);
};

describe('CartSummaryBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the summary bar', () => {
      renderComponent();
      expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
    });

    it('renders select all checkbox with correct state', () => {
      renderComponent({ isAllChecked: true });
      const checkbox = screen.getByTestId('select-all-checkbox');
      expect(checkbox).toBeChecked();
    });

    it('renders select all checkbox as unchecked when not all selected', () => {
      renderComponent({ isAllChecked: false });
      const checkbox = screen.getByTestId('select-all-checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('displays total item count', () => {
      renderComponent({
        extendedPurchases: [mockPurchase, { ...mockPurchase, _id: 'purchase-2' }],
      });
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });

    it('renders select all button', () => {
      renderComponent();
      expect(screen.getByText(/summary.selectAll/)).toBeInTheDocument();
    });

    it('renders delete button', () => {
      renderComponent();
      expect(screen.getByText('summary.delete')).toBeInTheDocument();
    });

    it('renders buy button', () => {
      renderComponent();
      expect(screen.getByText(/summary.buy/)).toBeInTheDocument();
    });
  });

  describe('Select All Functionality', () => {
    it('calls handleCheckedAll when checkbox is clicked', () => {
      const handleCheckedAll = vi.fn();
      renderComponent({ handleCheckedAll });
      const checkbox = screen.getByTestId('select-all-checkbox');
      fireEvent.click(checkbox);
      expect(handleCheckedAll).toHaveBeenCalled();
    });

    it('calls handleCheckedAll when select all button is clicked', () => {
      const handleCheckedAll = vi.fn();
      renderComponent({ handleCheckedAll });
      const selectAllBtn = screen.getByText(/summary.selectAll/);
      fireEvent.click(selectAllBtn);
      expect(handleCheckedAll).toHaveBeenCalled();
    });
  });

  describe('Delete Functionality', () => {
    it('calls handleDeleteManyPurchases when delete button is clicked', () => {
      const handleDeleteManyPurchases = vi.fn();
      renderComponent({ handleDeleteManyPurchases });
      const deleteBtn = screen.getByText('summary.delete');
      fireEvent.click(deleteBtn);
      expect(handleDeleteManyPurchases).toHaveBeenCalled();
    });
  });

  describe('Buy Functionality', () => {
    it('calls handleBuyPurchases when buy button is clicked', () => {
      const handleBuyPurchases = vi.fn();
      renderComponent({ handleBuyPurchases, checkedPurchaseCount: 1 });
      const buyBtn = screen.getByText(/summary.buy/);
      fireEvent.click(buyBtn);
      expect(handleBuyPurchases).toHaveBeenCalled();
    });

    it('disables buy button when no items are checked', () => {
      renderComponent({ checkedPurchaseCount: 0 });
      const buyBtn = screen.getByText(/summary.buy/);
      expect(buyBtn).toBeDisabled();
    });

    it('enables buy button when items are checked', () => {
      renderComponent({ checkedPurchaseCount: 2 });
      const buyBtn = screen.getByText(/summary.buy/);
      expect(buyBtn).not.toBeDisabled();
    });

    it('displays checked item count in buy button', () => {
      renderComponent({ checkedPurchaseCount: 3 });
      expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('displays total payment label', () => {
      renderComponent();
      expect(screen.getByText(/summary.totalPayment/)).toBeInTheDocument();
    });

    it('displays formatted total price', () => {
      renderComponent({ animatedTotalPrice: 500000 });
      expect(screen.getAllByText(/500,000/)[0]).toBeInTheDocument();
    });

    it('displays savings label', () => {
      renderComponent();
      const savingsLabels = screen.getAllByText('summary.savings');
      expect(savingsLabels.length).toBeGreaterThan(0);
    });

    it('displays formatted savings price', () => {
      renderComponent({ animatedSavingsPrice: 150000 });
      expect(screen.getAllByText(/150,000/)[0]).toBeInTheDocument();
    });

    it('displays checked purchase count in total payment', () => {
      renderComponent({ checkedPurchaseCount: 2 });
      expect(screen.getAllByText(/2/)[0]).toBeInTheDocument();
    });

    it('displays all items count when all checked', () => {
      renderComponent({
        isAllChecked: true,
        extendedPurchases: [mockPurchase, { ...mockPurchase, _id: 'purchase-2' }],
      });
      expect(screen.getAllByText(/2/)[0]).toBeInTheDocument();
    });

    it('formats currency using provided formatter', () => {
      const formatCurrency = vi.fn((value) => `${value.toLocaleString('vi-VN')} VND`);
      renderComponent({ formatCurrency, animatedTotalPrice: 300000 });
      expect(formatCurrency).toHaveBeenCalled();
    });
  });

  describe('Tooltip', () => {
    it('renders tooltip when items are checked', () => {
      renderComponent({ checkedPurchaseCount: 1 });
      expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument();
    });

    it('does not render tooltip when no items checked', () => {
      renderComponent({ checkedPurchaseCount: 0 });
      expect(screen.queryByTestId('tooltip-wrapper')).not.toBeInTheDocument();
    });

    it('displays promotion details in tooltip', () => {
      renderComponent({ checkedPurchaseCount: 1 });
      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toBeInTheDocument();
    });

    it('shows total goods price in tooltip', () => {
      renderComponent({
        checkedPurchaseCount: 1,
        totalCheckedPurchasePrice: 200000,
        totalCheckedPurchaseSavingPrice: 50000,
      });
      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toHaveTextContent('summary.totalGoods');
      expect(tooltipContent).toHaveTextContent('250,000');
    });

    it('shows voucher discount in tooltip', () => {
      renderComponent({
        checkedPurchaseCount: 1,
        totalCheckedPurchaseSavingPrice: 50000,
      });
      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toHaveTextContent('summary.voucherDiscount');
      expect(tooltipContent).toHaveTextContent('50,000');
    });

    it('shows product discount in tooltip', () => {
      renderComponent({
        checkedPurchaseCount: 1,
        totalCheckedPurchaseSavingPrice: 30000,
      });
      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toHaveTextContent('summary.productDiscount');
    });

    it('shows total amount in tooltip', () => {
      renderComponent({
        checkedPurchaseCount: 1,
        totalCheckedPurchasePrice: 200000,
      });
      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toHaveTextContent('summary.totalAmount');
      expect(tooltipContent).toHaveTextContent('200,000');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total price', () => {
      renderComponent({ animatedTotalPrice: 0 });
      const zeroElements = screen.getAllByText(/0/);
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('handles zero savings', () => {
      renderComponent({ animatedSavingsPrice: 0 });
      const zeroElements = screen.getAllByText(/0/);
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('handles empty purchases array', () => {
      renderComponent({ extendedPurchases: [] });
      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });

    it('handles large numbers correctly', () => {
      renderComponent({ animatedTotalPrice: 99999999 });
      expect(screen.getAllByText(/99,999,999/)[0]).toBeInTheDocument();
    });

    it('handles single item', () => {
      renderComponent({ extendedPurchases: [mockPurchase], checkedPurchaseCount: 1 });
      expect(screen.getAllByText(/\(1\)/)[0]).toBeInTheDocument();
    });

    it('handles multiple items', () => {
      const purchases = Array.from({ length: 10 }, (_, i) => ({
        ...mockPurchase,
        _id: `purchase-${i}`,
      }));
      renderComponent({ extendedPurchases: purchases, checkedPurchaseCount: 10 });
      expect(screen.getAllByText(/\(10\)/)[0]).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies correct styling classes', () => {
      const { container } = renderComponent();
      const summaryBar = container.querySelector('.sticky');
      expect(summaryBar).toBeInTheDocument();
    });

    it('renders with flex layout', () => {
      const { container } = renderComponent();
      const summaryBar = container.querySelector('.flex');
      expect(summaryBar).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('buy button shows correct count', () => {
      renderComponent({ checkedPurchaseCount: 5 });
      expect(screen.getByText(/\(5\)/)).toBeInTheDocument();
    });

    it('buy button is disabled with zero count', () => {
      renderComponent({ checkedPurchaseCount: 0 });
      const buyBtn = screen.getByText(/summary.buy/);
      expect(buyBtn).toBeDisabled();
    });

    it('all buttons are clickable when enabled', () => {
      const handleCheckedAll = vi.fn();
      const handleDeleteManyPurchases = vi.fn();
      const handleBuyPurchases = vi.fn();

      renderComponent({
        handleCheckedAll,
        handleDeleteManyPurchases,
        handleBuyPurchases,
        checkedPurchaseCount: 1,
      });

      fireEvent.click(screen.getByText(/summary.selectAll/));
      fireEvent.click(screen.getByText('summary.delete'));
      fireEvent.click(screen.getByText(/summary.buy/));

      expect(handleCheckedAll).toHaveBeenCalled();
      expect(handleDeleteManyPurchases).toHaveBeenCalled();
      expect(handleBuyPurchases).toHaveBeenCalled();
    });
  });

  describe('Price Calculations', () => {
    it('displays correct total when all items checked', () => {
      const purchases = [
        mockPurchase,
        { ...mockPurchase, _id: 'purchase-2', price: 150000, buy_count: 1 },
      ];
      renderComponent({
        extendedPurchases: purchases,
        isAllChecked: true,
        animatedTotalPrice: 350000,
      });
      expect(screen.getAllByText(/350,000/)[0]).toBeInTheDocument();
    });

    it('displays correct savings calculation', () => {
      renderComponent({
        totalCheckedPurchaseSavingPrice: 75000,
        animatedSavingsPrice: 75000,
      });
      expect(screen.getAllByText(/75,000/)[0]).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders buttons with proper structure', () => {
      renderComponent();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('checkbox is accessible', () => {
      renderComponent();
      const checkbox = screen.getByTestId('select-all-checkbox');
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('buy button has proper disabled state', () => {
      renderComponent({ checkedPurchaseCount: 0 });
      const buyBtn = screen.getByText(/summary.buy/);
      expect(buyBtn).toHaveAttribute('disabled');
    });
  });

  describe('Dynamic Updates', () => {
    it('updates when checked count changes', () => {
      const { rerender } = renderComponent({ checkedPurchaseCount: 1 });
      expect(screen.getAllByText(/\(1\)/)[0]).toBeInTheDocument();

      rerender(<CartSummaryBar {...defaultProps} checkedPurchaseCount={3} />);
      expect(screen.getAllByText(/\(3\)/)[0]).toBeInTheDocument();
    });

    it('updates when total price changes', () => {
      const { rerender } = renderComponent({ animatedTotalPrice: 100000 });
      expect(screen.getAllByText(/100,000/)[0]).toBeInTheDocument();

      rerender(<CartSummaryBar {...defaultProps} animatedTotalPrice={200000} />);
      expect(screen.getAllByText(/200,000/)[0]).toBeInTheDocument();
    });

    it('updates checkbox state when isAllChecked changes', () => {
      const { rerender } = renderComponent({ isAllChecked: false });
      let checkbox = screen.getByTestId('select-all-checkbox');
      expect(checkbox).not.toBeChecked();

      rerender(<CartSummaryBar {...defaultProps} isAllChecked={true} />);
      checkbox = screen.getByTestId('select-all-checkbox');
      expect(checkbox).toBeChecked();
    });
  });
});
