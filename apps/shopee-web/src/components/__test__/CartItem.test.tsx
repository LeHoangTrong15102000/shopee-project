import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import CartItemList from 'src/pages/Cart/components/CartItemList';
import { ExtendedPurchase, InlineStockAlertState } from 'src/pages/Cart/types';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="product-image" />
  ),
}));

vi.mock('src/components/QuantityController', () => ({
  default: ({ value, onIncrease, onDecrease, onType, onFocusOut, max }: any) => (
    <div data-testid="quantity-controller">
      <button onClick={() => onDecrease(value - 1)} data-testid="decrease-btn">
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onType(Number(e.target.value))}
        onBlur={(e) => onFocusOut(Number(e.target.value))}
        data-testid="quantity-input"
      />
      <button onClick={() => onIncrease(value + 1)} data-testid="increase-btn">
        +
      </button>
    </div>
  ),
}));

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      data-testid="checkbox"
    />
  ),
}));

vi.mock('src/components/StockBadge', () => ({
  default: ({ availableStock, requestedQuantity }: any) => (
    <div data-testid="stock-badge">
      Stock: {availableStock}, Requested: {requestedQuantity}
    </div>
  ),
}));

vi.mock('src/components/RealTimeStockAlert', () => ({
  InlineStockAlert: ({ productId, productName, newStock, severity, onDismiss }: any) => (
    <div data-testid={`inline-alert-${productId}`}>
      <span>{productName}</span>
      <span>{newStock}</span>
      <span>{severity}</span>
      <button onClick={onDismiss} data-testid="dismiss-alert">
        Dismiss
      </button>
    </div>
  ),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
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
  isChecked: false,
};

const defaultProps = {
  extendedPurchases: [mockPurchase],
  purchasesInCart: [mockPurchase as any],
  isAllChecked: false,
  inlineAlerts: new Map<string, InlineStockAlertState>(),
  handleChecked: vi.fn(() => vi.fn()),
  handleCheckedAll: vi.fn(),
  handleQuantity: vi.fn(),
  handleTypeQuantity: vi.fn(() => vi.fn()),
  handleDelete: vi.fn(() => vi.fn()),
  handleSaveForLater: vi.fn(() => vi.fn()),
  handleDismissInlineAlert: vi.fn(),
  path: { home: '/' },
  formatCurrency: (value: number) => value.toLocaleString(),
  generateNameId: ({ name, id }: { name: string; id: string }) => `${name}-${id}`,
};

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <CartItemList {...defaultProps} {...props} />
    </BrowserRouter>,
  );
};

describe('CartItemList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    it('renders desktop table header with all columns', () => {
      renderComponent();
      expect(screen.getByText('list.product')).toBeInTheDocument();
      expect(screen.getByText('list.unitPrice')).toBeInTheDocument();
      expect(screen.getByText('list.quantity')).toBeInTheDocument();
      expect(screen.getByText('list.amount')).toBeInTheDocument();
      expect(screen.getByText('list.actions')).toBeInTheDocument();
    });

    it('renders select all checkbox in header', () => {
      renderComponent();
      const checkboxes = screen.getAllByTestId('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('calls handleCheckedAll when select all checkbox is clicked', () => {
      const handleCheckedAll = vi.fn();
      renderComponent({ handleCheckedAll });
      const checkboxes = screen.getAllByTestId('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(handleCheckedAll).toHaveBeenCalled();
    });
  });

  describe('Product Item Rendering', () => {
    it('renders product image with correct src and alt', () => {
      renderComponent();
      const images = screen.getAllByTestId('product-image');
      expect(images[0]).toHaveAttribute('src', mockPurchase.product.image);
      expect(images[0]).toHaveAttribute('alt', mockPurchase.product.name);
    });

    it('renders product name as link', () => {
      renderComponent();
      const links = screen.getAllByText(mockPurchase.product.name);
      expect(links.length).toBeGreaterThan(0);
    });

    it('renders product prices with discount', () => {
      renderComponent();
      expect(screen.getAllByText(/150,000/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/100,000/)[0]).toBeInTheDocument();
    });

    it('renders stock badge with correct props', () => {
      renderComponent();
      const stockBadge = screen.getAllByTestId('stock-badge')[0];
      expect(stockBadge).toHaveTextContent('Stock: 10');
      expect(stockBadge).toHaveTextContent('Requested: 2');
    });

    it('calculates and displays total price correctly', () => {
      renderComponent();
      const totalPrice = mockPurchase.price * mockPurchase.buy_count;
      expect(screen.getAllByText(new RegExp(totalPrice.toLocaleString()))[0]).toBeInTheDocument();
    });
  });

  describe('Checkbox Interactions', () => {
    it('renders checkbox for each item', () => {
      renderComponent({
        extendedPurchases: [mockPurchase, { ...mockPurchase, _id: 'purchase-2' }],
      });
      const checkboxes = screen.getAllByTestId('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);
    });

    it('calls handleChecked when item checkbox is clicked', () => {
      const handleChecked = vi.fn(() => vi.fn());
      renderComponent({ handleChecked });
      const checkboxes = screen.getAllByTestId('checkbox');
      fireEvent.click(checkboxes[1]);
      expect(handleChecked).toHaveBeenCalledWith(0);
    });

    it('reflects checked state correctly', () => {
      const checkedPurchase = { ...mockPurchase, isChecked: true };
      renderComponent({ extendedPurchases: [checkedPurchase] });
      const checkboxes = screen.getAllByTestId('checkbox');
      expect(checkboxes.some((cb) => cb.checked)).toBe(true);
    });

    it('shows all items as checked when isAllChecked is true', () => {
      renderComponent({ isAllChecked: true });
      const checkboxes = screen.getAllByTestId('checkbox');
      expect(checkboxes[0]).toBeChecked();
    });
  });

  describe('Quantity Controller', () => {
    it('renders quantity controller with current value', () => {
      renderComponent();
      const quantityInput = screen.getAllByTestId('quantity-input')[0];
      expect(quantityInput).toHaveValue(mockPurchase.buy_count);
    });

    it('calls handleQuantity when increase button is clicked', () => {
      const handleQuantity = vi.fn();
      renderComponent({ handleQuantity });
      const increaseBtn = screen.getAllByTestId('increase-btn')[0];
      fireEvent.click(increaseBtn);
      expect(handleQuantity).toHaveBeenCalled();
    });

    it('calls handleQuantity when decrease button is clicked', () => {
      const handleQuantity = vi.fn();
      renderComponent({ handleQuantity });
      const decreaseBtn = screen.getAllByTestId('decrease-btn')[0];
      fireEvent.click(decreaseBtn);
      expect(handleQuantity).toHaveBeenCalled();
    });

    it('calls handleTypeQuantity when quantity input changes', () => {
      const handleTypeQuantity = vi.fn(() => vi.fn());
      renderComponent({ handleTypeQuantity });
      const quantityInput = screen.getAllByTestId('quantity-input')[0];
      fireEvent.change(quantityInput, { target: { value: '5' } });
      expect(handleTypeQuantity).toHaveBeenCalledWith(0);
    });
  });

  describe('Action Buttons', () => {
    it('renders save for later button', () => {
      renderComponent();
      expect(screen.getByText('list.save')).toBeInTheDocument();
    });

    it('calls handleSaveForLater when save button is clicked', () => {
      const handleSaveForLater = vi.fn(() => vi.fn());
      renderComponent({ handleSaveForLater });
      const saveBtn = screen.getByText('list.save');
      fireEvent.click(saveBtn);
      expect(handleSaveForLater).toHaveBeenCalledWith(0);
    });

    it('renders delete button', () => {
      renderComponent();
      expect(screen.getByText('list.delete')).toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
      const handleDelete = vi.fn(() => vi.fn());
      renderComponent({ handleDelete });
      const deleteBtn = screen.getByText('list.delete');
      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith(0);
    });
  });

  describe('Inline Stock Alerts', () => {
    it('does not render alert when no alerts exist', () => {
      renderComponent();
      expect(screen.queryByTestId('inline-alert-product-1')).not.toBeInTheDocument();
    });

    it('renders inline alert when alert exists for product', () => {
      const inlineAlerts = new Map<string, InlineStockAlertState>([
        [
          'product-1',
          {
            productName: 'Test Product',
            newStock: 5,
            severity: 'warning',
          },
        ],
      ]);
      renderComponent({ inlineAlerts });
      expect(screen.getAllByTestId('inline-alert-product-1')[0]).toBeInTheDocument();
    });

    it('displays correct alert information', () => {
      const inlineAlerts = new Map<string, InlineStockAlertState>([
        [
          'product-1',
          {
            productName: 'Test Product',
            newStock: 3,
            severity: 'critical',
          },
        ],
      ]);
      renderComponent({ inlineAlerts });
      const alert = screen.getAllByTestId('inline-alert-product-1')[0];
      expect(alert).toHaveTextContent('Test Product');
      expect(alert).toHaveTextContent('3');
      expect(alert).toHaveTextContent('critical');
    });

    it('calls handleDismissInlineAlert when dismiss button is clicked', () => {
      const handleDismissInlineAlert = vi.fn();
      const inlineAlerts = new Map<string, InlineStockAlertState>([
        [
          'product-1',
          {
            productName: 'Test Product',
            newStock: 5,
            severity: 'warning',
          },
        ],
      ]);
      renderComponent({ inlineAlerts, handleDismissInlineAlert });
      const dismissBtn = screen.getAllByTestId('dismiss-alert')[0];
      fireEvent.click(dismissBtn);
      expect(handleDismissInlineAlert).toHaveBeenCalledWith('product-1');
    });
  });

  describe('Multiple Items', () => {
    it('renders multiple cart items correctly', () => {
      const purchases = [
        mockPurchase,
        {
          ...mockPurchase,
          _id: 'purchase-2',
          product: { ...mockPurchase.product, _id: 'product-2', name: 'Product 2' },
        },
        {
          ...mockPurchase,
          _id: 'purchase-3',
          product: { ...mockPurchase.product, _id: 'product-3', name: 'Product 3' },
        },
      ];
      renderComponent({ extendedPurchases: purchases });
      expect(screen.getAllByText('Test Product')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Product 2')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Product 3')[0]).toBeInTheDocument();
    });

    it('handles individual item actions independently', () => {
      const handleDelete = vi.fn(() => vi.fn());
      const purchases = [mockPurchase, { ...mockPurchase, _id: 'purchase-2' }];
      renderComponent({ extendedPurchases: purchases, handleDelete });
      const deleteButtons = screen.getAllByText('list.delete');
      fireEvent.click(deleteButtons[0]);
      expect(handleDelete).toHaveBeenCalledWith(0);
    });
  });

  describe('Empty State', () => {
    it('renders without items when extendedPurchases is empty', () => {
      renderComponent({ extendedPurchases: [] });
      expect(screen.queryByTestId('product-image')).not.toBeInTheDocument();
    });

    it('still renders header when no items', () => {
      renderComponent({ extendedPurchases: [] });
      expect(screen.getByText('list.product')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    it('renders mobile select all header', () => {
      renderComponent();
      expect(screen.getByText(/list.selectAll/)).toBeInTheDocument();
    });

    it('displays item count in mobile header', () => {
      const purchases = [mockPurchase, { ...mockPurchase, _id: 'purchase-2' }];
      renderComponent({ extendedPurchases: purchases });
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  describe('Product Links', () => {
    it('generates correct product link URLs', () => {
      renderComponent();
      const links = screen.getAllByRole('link');
      const productLinks = links.filter((link) =>
        link.getAttribute('href')?.includes('Test Product-product-1'),
      );
      expect(productLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Price Formatting', () => {
    it('formats currency correctly', () => {
      const formatCurrency = vi.fn((value) => value.toLocaleString('vi-VN'));
      renderComponent({ formatCurrency });
      expect(formatCurrency).toHaveBeenCalled();
    });

    it('displays discount price with strikethrough', () => {
      renderComponent();
      const discountPrices = screen.getAllByText(/150,000/);
      const hasStrikethrough = discountPrices.some((el) => el.className.includes('line-through'));
      expect(hasStrikethrough).toBe(true);
    });
  });
});
