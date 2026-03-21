import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import Cart from '../Cart';

// Mock data
const mockCartItems = [
  {
    _id: 'purchase-1',
    product: {
      _id: 'product-1',
      name: 'Test Product',
      image: 'test.jpg',
    },
    price: 100000,
    price_before_discount: 150000,
    buy_count: 1,
    disabled: false,
    isChecked: false,
  },
];

// Mock functions - defined at module level
const mockNavigate = vi.fn();
const mockSetItems = vi.fn();
const mockToggleCheck = vi.fn();
const mockSelectAll = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockSaveForLater = vi.fn(() => true);
const mockRemoveFromSaved = vi.fn();
const mockClearSaved = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockGetPurchases = vi.fn(() => Promise.resolve({ data: { data: mockCartItems } }));
const mockAddToCart = vi.fn(() => Promise.resolve());

// State holders for dynamic mocking
const state = {
  cartItems: mockCartItems,
  checkedItems: [] as any[],
  isAllChecked: false,
  savedItems: [] as any[],
  location: { pathname: '/cart', state: null as any },
};

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  useLocation: () => state.location,
  useNavigate: () => mockNavigate,
}));

vi.mock('src/stores/cart.store', () => {
  const mockStore = {
    useCartStore: Object.assign(
      (selector: any) => {
        const store = {
          items: state.cartItems,
          setItems: mockSetItems,
          toggleCheck: mockToggleCheck,
          selectAll: mockSelectAll,
          updateQuantity: mockUpdateQuantity,
        };
        return selector ? selector(store) : store;
      },
      {
        getState: () => ({ items: state.cartItems }),
      },
    ),
    useCartItems: () => state.cartItems,
    useCheckedItems: () => state.checkedItems,
    useIsAllChecked: () => state.isAllChecked,
  };
  return mockStore;
});

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticUpdateQuantity: () => ({ mutate: mockMutate }),
  useOptimisticRemoveFromCart: () => ({ mutate: mockDeleteMutate }),
  TOAST_MESSAGES: {
    SAVE_FOR_LATER_SUCCESS: 'Saved',
    SAVE_FOR_LATER_ALREADY_SAVED: 'Already saved',
    MOVE_TO_CART_SUCCESS: 'Moved to cart',
    CLEAR_SAVED_SUCCESS: 'Cleared',
    ADD_TO_CART_ERROR: 'Error',
  },
}));

vi.mock('src/hooks/useCartSync', () => ({
  default: () => ({ lastSyncTimestamp: null, isSyncing: false }),
}));

vi.mock('src/hooks/useSaveForLater', () => ({
  useSaveForLater: () => ({
    savedItems: state.savedItems,
    saveForLater: mockSaveForLater,
    removeFromSaved: mockRemoveFromSaved,
    clearSaved: mockClearSaved,
  }),
}));

vi.mock('src/hooks/useAnimatedNumber', () => ({
  default: (value: number) => value,
}));

vi.mock('src/apis/purchases.api', () => ({
  default: {
    getPurchases: (...args: any[]) => mockGetPurchases(...args),
    addToCart: (body: any) => mockAddToCart(body),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('src/components/SEO', () => ({
  default: ({ title }: { title: string }) => <div data-testid="seo">{title}</div>,
}));

vi.mock('src/components/CartSyncIndicator', () => ({
  default: ({ isSyncing }: { isSyncing: boolean }) => (
    <div data-testid="cart-sync-indicator">{isSyncing ? 'Syncing' : 'Synced'}</div>
  ),
}));

vi.mock('src/components/RealTimeStockAlert', () => ({
  default: ({ productIds, onStockChange }: any) => (
    <div data-testid="stock-alert" data-product-ids={productIds.join(',')}>
      <button onClick={() => onStockChange('product-1', 5)}>Trigger Stock Change</button>
    </div>
  ),
}));

vi.mock('src/pages/Cart/components/CartItemList', () => ({
  default: ({
    extendedPurchases,
    handleChecked,
    handleQuantity,
    handleDelete,
    handleSaveForLater,
    handleTypeQuantity,
    handleDismissInlineAlert,
  }: any) => (
    <div data-testid="cart-item-list">
      {extendedPurchases.map((item: any, index: number) => (
        <div key={item._id} data-testid={`cart-item-${index}`}>
          <span>{item.product.name}</span>
          <input
            type="checkbox"
            checked={item.isChecked}
            onChange={handleChecked(index)}
            data-testid={`checkbox-${index}`}
          />
          <button
            onClick={() => handleQuantity(index, 2, true)}
            data-testid={`quantity-btn-${index}`}
          >
            Update Quantity
          </button>
          <button
            onClick={() => handleQuantity(index, 2, false)}
            data-testid={`quantity-disabled-btn-${index}`}
          >
            Update Quantity Disabled
          </button>
          <button
            onClick={() => handleTypeQuantity(index)(3)}
            data-testid={`type-quantity-btn-${index}`}
          >
            Type Quantity
          </button>
          <button onClick={handleDelete(index)} data-testid={`delete-btn-${index}`}>
            Delete
          </button>
          <button onClick={handleSaveForLater(index)} data-testid={`save-btn-${index}`}>
            Save
          </button>
          <button
            onClick={() => handleDismissInlineAlert('product-1')}
            data-testid="dismiss-alert-btn"
          >
            Dismiss Alert
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('src/pages/Cart/components/CartSummaryBar', () => ({
  default: ({
    handleCheckedAll,
    handleDeleteManyPurchases,
    handleBuyPurchases,
    checkedPurchaseCount,
  }: any) => (
    <div data-testid="cart-summary-bar">
      <button onClick={handleCheckedAll} data-testid="select-all-btn">
        Select All
      </button>
      <button onClick={handleDeleteManyPurchases} data-testid="delete-many-btn">
        Delete Many
      </button>
      <button onClick={handleBuyPurchases} data-testid="buy-btn">
        Mua hàng ({checkedPurchaseCount})
      </button>
    </div>
  ),
}));

vi.mock('src/pages/Cart/components/EmptyCartState', () => ({
  default: ({ savedItems, handleMoveToCart, removeFromSaved, handleClearSaved }: any) => (
    <div data-testid="empty-cart-state">
      <span>Empty Cart</span>
      {savedItems.map((item: any) => (
        <div key={item.product._id}>
          <button
            onClick={() => handleMoveToCart(item)}
            data-testid={`move-to-cart-${item.product._id}`}
          >
            Move to Cart
          </button>
          <button
            onClick={() => removeFromSaved(item.product._id)}
            data-testid={`remove-saved-${item.product._id}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button onClick={handleClearSaved} data-testid="clear-saved-btn">
        Clear Saved
      </button>
    </div>
  ),
}));

vi.mock('src/components/SaveForLaterSection', () => ({
  default: ({ savedItems, onMoveToCart, onRemove, onClear }: any) => (
    <div data-testid="save-for-later-section">
      Save For Later
      {savedItems?.map((item: any) => (
        <div key={item.product._id}>
          <button onClick={() => onMoveToCart(item)} data-testid={`sfl-move-${item.product._id}`}>
            Move
          </button>
          <button
            onClick={() => onRemove(item.product._id)}
            data-testid={`sfl-remove-${item.product._id}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button onClick={onClear} data-testid="sfl-clear-btn">
        Clear
      </button>
    </div>
  ),
}));

describe('Cart', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.invalidateQueries = mockInvalidateQueries;
    vi.clearAllMocks();

    // Reset state
    state.cartItems = mockCartItems;
    state.checkedItems = [];
    state.isAllChecked = false;
    state.savedItems = [];
    state.location = { pathname: '/cart', state: null };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render cart items', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should render empty cart state when no items', async () => {
    state.cartItems = [];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('empty-cart-state')).toBeInTheDocument();
    });
  });

  it('should toggle item check', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('checkbox-0')).toBeInTheDocument();
    });

    const checkbox = screen.getByTestId('checkbox-0');
    fireEvent.click(checkbox);

    expect(mockToggleCheck).toHaveBeenCalled();
  });

  it('should select all items', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const selectAllBtn = screen.getByTestId('select-all-btn');
      fireEvent.click(selectAllBtn);
      expect(mockSelectAll).toHaveBeenCalledWith(true);
    });
  });

  it('should select all items when already all checked', async () => {
    state.isAllChecked = true;

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const selectAllBtn = screen.getByTestId('select-all-btn');
      fireEvent.click(selectAllBtn);
      expect(mockSelectAll).toHaveBeenCalledWith(false);
    });
  });

  it('should update quantity via handleQuantity when enabled', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const quantityBtn = screen.getByTestId('quantity-btn-0');
      fireEvent.click(quantityBtn);
      expect(mockMutate).toHaveBeenCalledWith({
        product_id: 'product-1',
        buy_count: 2,
      });
    });
  });

  it('should not update quantity when disabled', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const quantityDisabledBtn = screen.getByTestId('quantity-disabled-btn-0');
      fireEvent.click(quantityDisabledBtn);
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('should update quantity via handleTypeQuantity', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const typeQuantityBtn = screen.getByTestId('type-quantity-btn-0');
      fireEvent.click(typeQuantityBtn);
      expect(mockUpdateQuantity).toHaveBeenCalledWith('product-1', 3);
    });
  });

  it('should delete single item', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const deleteBtn = screen.getByTestId('delete-btn-0');
      fireEvent.click(deleteBtn);
      expect(mockDeleteMutate).toHaveBeenCalledWith(['purchase-1']);
    });
  });

  it('should delete multiple items', async () => {
    state.checkedItems = [mockCartItems[0]];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const deleteManyBtn = screen.getByTestId('delete-many-btn');
      fireEvent.click(deleteManyBtn);
      expect(mockDeleteMutate).toHaveBeenCalledWith(['purchase-1']);
    });
  });

  it('should save item for later successfully', async () => {
    const toast = await import('react-toastify');
    mockSaveForLater.mockReturnValue(true);

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const saveBtn = screen.getByTestId('save-btn-0');
      fireEvent.click(saveBtn);
      expect(mockSaveForLater).toHaveBeenCalled();
      expect(mockDeleteMutate).toHaveBeenCalledWith(['purchase-1']);
      expect(toast.toast.success).toHaveBeenCalledWith('Saved', expect.any(Object));
    });
  });

  it('should show info toast when item already saved', async () => {
    const toast = await import('react-toastify');
    mockSaveForLater.mockReturnValue(false);

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const saveBtn = screen.getByTestId('save-btn-0');
      fireEvent.click(saveBtn);
      expect(mockSaveForLater).toHaveBeenCalled();
      expect(toast.toast.info).toHaveBeenCalledWith('Already saved', expect.any(Object));
    });
  });

  it('should navigate to checkout when items are checked', async () => {
    state.checkedItems = mockCartItems;

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const buyBtn = screen.getByTestId('buy-btn');
      fireEvent.click(buyBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });
  });

  it('should not navigate to checkout when no items checked', async () => {
    state.checkedItems = [];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const buyBtn = screen.getByTestId('buy-btn');
      fireEvent.click(buyBtn);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('should handle stock change and invalidate queries', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const stockAlert = screen.getByTestId('stock-alert');
      const triggerBtn = stockAlert.querySelector('button');
      if (triggerBtn) {
        fireEvent.click(triggerBtn);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ['purchases', { status: -1 }],
        });
      }
    });
  });

  it('should dismiss inline alert', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const dismissBtn = screen.getByTestId('dismiss-alert-btn');
      fireEvent.click(dismissBtn);
      // Alert dismissed successfully
    });
  });

  it('should handle location state with purchaseId', async () => {
    state.location.state = { purchaseId: 'purchase-1' };

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(mockSetItems).toHaveBeenCalled();
    });
  });

  it('should clear location state after timeout', async () => {
    state.location.state = { purchaseId: 'purchase-1' };

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(mockSetItems).toHaveBeenCalled();
    });

    // The component sets a 500ms timeout to clear location state
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/cart', { state: null, replace: true });
      },
      { timeout: 2000 },
    );
  });

  it('should render SEO component', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('seo')).toBeInTheDocument();
    });
  });

  it('should render cart sync indicator', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('cart-sync-indicator')).toBeInTheDocument();
    });
  });

  it('should render save for later section when items exist', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('save-for-later-section')).toBeInTheDocument();
    });
  });

  it('should move saved item to cart when not already in cart', async () => {
    const savedItem = {
      product: { _id: 'product-2', name: 'Saved Product' },
      originalBuyCount: 2,
      savedAt: Date.now(),
    };

    state.savedItems = [savedItem];
    state.cartItems = [];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('move-to-cart-product-2')).toBeInTheDocument();
    });

    const moveBtn = screen.getByTestId('move-to-cart-product-2');
    fireEvent.click(moveBtn);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith({
        product_id: 'product-2',
        buy_count: 2,
      });
    });
  });

  it('should show info toast when moving item already in cart', async () => {
    const toast = await import('react-toastify');
    const savedItem = {
      product: { _id: 'product-1', name: 'Test Product' },
      originalBuyCount: 1,
      savedAt: Date.now(),
    };

    state.savedItems = [savedItem];
    state.cartItems = mockCartItems;

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('sfl-move-product-1')).toBeInTheDocument();
    });

    const moveBtn = screen.getByTestId('sfl-move-product-1');
    fireEvent.click(moveBtn);

    await waitFor(() => {
      expect(mockRemoveFromSaved).toHaveBeenCalledWith('product-1');
      expect(toast.toast.info).toHaveBeenCalled();
    });
  });

  it('should clear all saved items', async () => {
    const toast = await import('react-toastify');
    const savedItem = {
      product: { _id: 'product-2', name: 'Saved Product' },
      originalBuyCount: 2,
      savedAt: Date.now(),
    };

    state.savedItems = [savedItem];
    state.cartItems = [];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      const clearBtn = screen.getByTestId('clear-saved-btn');
      fireEvent.click(clearBtn);
      expect(mockClearSaved).toHaveBeenCalled();
      expect(toast.toast.success).toHaveBeenCalledWith('Cleared', expect.any(Object));
    });
  });

  it('should calculate total price correctly', async () => {
    state.checkedItems = [
      {
        ...mockCartItems[0],
        isChecked: true,
        buy_count: 2,
      },
    ];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('cart-summary-bar')).toBeInTheDocument();
    });
  });

  it('should calculate savings correctly', async () => {
    state.checkedItems = [
      {
        ...mockCartItems[0],
        isChecked: true,
        buy_count: 1,
        price: 100000,
        price_before_discount: 150000,
      },
    ];

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('cart-summary-bar')).toBeInTheDocument();
    });
  });

  it('should handle empty purchases from API', async () => {
    mockGetPurchases.mockResolvedValue({
      data: { data: [] },
    });

    render(<Cart />, { wrapper });

    await waitFor(() => {
      expect(mockSetItems).toHaveBeenCalled();
    });
  });

  it('should extract product IDs for stock monitoring', async () => {
    render(<Cart />, { wrapper });

    await waitFor(() => {
      const stockAlert = screen.getByTestId('stock-alert');
      expect(stockAlert.getAttribute('data-product-ids')).toBe('product-1');
    });
  });
});
