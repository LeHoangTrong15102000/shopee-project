import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import WishlistPriceAlert from '../WishlistPriceAlert';
import { toast } from 'react-toastify';
import useSocket from 'src/hooks/useSocket';

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

const mockUseSocket = vi.fn(() => ({
  socket: mockSocket,
  isConnected: true,
}));

vi.mock('src/hooks/useSocket', () => ({
  default: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('WishlistPriceAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockImplementation(mockUseSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    const { container } = render(<WishlistPriceAlert productIds={[]} />);
    expect(container).toBeInstanceOf(HTMLDivElement);
  });

  it('should not subscribe when productIds is empty', () => {
    render(<WishlistPriceAlert productIds={[]} />);
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('should subscribe to products when productIds provided', () => {
    const productIds = ['product-1', 'product-2'];
    render(<WishlistPriceAlert productIds={productIds} />);

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_product', { product_id: 'product-1' });
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_product', { product_id: 'product-2' });
    expect(mockSocket.on).toHaveBeenCalledWith('price_updated', expect.any(Function));
  });

  it('should unsubscribe from removed products', () => {
    const { rerender } = render(<WishlistPriceAlert productIds={['product-1', 'product-2']} />);

    vi.clearAllMocks();
    rerender(<WishlistPriceAlert productIds={['product-1']} />);

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_product', {
      product_id: 'product-2',
    });
  });

  it('should call onPriceChange callback when price drops', () => {
    const onPriceChange = vi.fn();
    render(<WishlistPriceAlert productIds={['product-1']} onPriceChange={onPriceChange} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      expect(onPriceChange).toHaveBeenCalledWith('product-1', 100, 80);
    }
  });

  it('should not trigger alert when price increases', () => {
    const onPriceChange = vi.fn();
    render(<WishlistPriceAlert productIds={['product-1']} onPriceChange={onPriceChange} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 80,
        new_price: 100,
      });

      expect(onPriceChange).not.toHaveBeenCalled();
    }
  });

  it('should not trigger alert for products not in watchlist', () => {
    const onPriceChange = vi.fn();
    render(<WishlistPriceAlert productIds={['product-1']} onPriceChange={onPriceChange} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-2',
        old_price: 100,
        new_price: 80,
      });

      expect(onPriceChange).not.toHaveBeenCalled();
    }
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(<WishlistPriceAlert productIds={['product-1', 'product-2']} />);

    vi.clearAllMocks();
    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_product', {
      product_id: 'product-1',
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_product', {
      product_id: 'product-2',
    });
    expect(mockSocket.off).toHaveBeenCalledWith('price_updated', expect.any(Function));
  });

  it('should not subscribe when socket is not connected', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
    } as any);

    render(<WishlistPriceAlert productIds={['product-1']} />);
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('should show toast notification with discount percentage when price drops', () => {
    render(<WishlistPriceAlert productIds={['product-1']} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      expect(toast.success).toHaveBeenCalledWith('🎉 Sản phẩm yêu thích đã giảm giá 20%!', {
        autoClose: 5000,
        position: 'top-right',
      });
    }
  });

  it('should calculate correct discount percentage for various price drops', () => {
    render(<WishlistPriceAlert productIds={['product-1']} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      // 50% discount
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 200,
        new_price: 100,
      });

      expect(toast.success).toHaveBeenCalledWith(
        '🎉 Sản phẩm yêu thích đã giảm giá 50%!',
        expect.any(Object),
      );

      vi.clearAllMocks();

      // Wait for cooldown to expire
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // 10% discount
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 90,
      });

      expect(toast.success).toHaveBeenCalledWith(
        '🎉 Sản phẩm yêu thích đã giảm giá 10%!',
        expect.any(Object),
      );
    }
  });

  it('should not trigger alert when price stays the same', () => {
    const onPriceChange = vi.fn();
    render(<WishlistPriceAlert productIds={['product-1']} onPriceChange={onPriceChange} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 100,
      });

      expect(onPriceChange).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    }
  });

  it('should respect cooldown period between alerts for same product', () => {
    const onPriceChange = vi.fn();
    render(<WishlistPriceAlert productIds={['product-1']} onPriceChange={onPriceChange} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      // First price drop - should show toast
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(onPriceChange).toHaveBeenCalledWith('product-1', 100, 80);

      vi.clearAllMocks();

      // Second price drop within cooldown - should NOT show toast but still call callback
      vi.advanceTimersByTime(2 * 60 * 1000); // 2 minutes later

      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 80,
        new_price: 60,
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(onPriceChange).toHaveBeenCalledWith('product-1', 80, 60);
    }
  });

  it('should show toast after cooldown period expires', () => {
    const onPriceChange = vi.fn();
    render(<WishlistPriceAlert productIds={['product-1']} onPriceChange={onPriceChange} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      // First price drop
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // Wait for cooldown to expire (5 minutes)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000); // 5 minutes + 1 second

      // Second price drop after cooldown - should show toast again
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 80,
        new_price: 60,
      });

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(onPriceChange).toHaveBeenCalledWith('product-1', 80, 60);
    }
  });

  it('should track cooldown separately for different products', () => {
    render(<WishlistPriceAlert productIds={['product-1', 'product-2']} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      // Price drop for product-1
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // Price drop for product-2 immediately after - should still show toast
      priceUpdateHandler({
        product_id: 'product-2',
        old_price: 200,
        new_price: 150,
      });

      expect(toast.success).toHaveBeenCalledTimes(1);
    }
  });

  it('should handle multiple price updates for different products', () => {
    const onPriceChange = vi.fn();
    render(
      <WishlistPriceAlert
        productIds={['product-1', 'product-2', 'product-3']}
        onPriceChange={onPriceChange}
      />,
    );

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      priceUpdateHandler({
        product_id: 'product-2',
        old_price: 200,
        new_price: 180,
      });

      priceUpdateHandler({
        product_id: 'product-3',
        old_price: 50,
        new_price: 40,
      });

      expect(onPriceChange).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenCalledTimes(3);
    }
  });

  it('should not cleanup when socket is null on unmount', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
    } as any);

    const { unmount } = render(<WishlistPriceAlert productIds={['product-1']} />);

    unmount();

    // Should not throw error
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('should not cleanup when socket is disconnected on unmount', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket,
      isConnected: false,
    } as any);

    const { unmount } = render(<WishlistPriceAlert productIds={['product-1']} />);

    vi.clearAllMocks();
    unmount();

    // Should not unsubscribe when disconnected
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('should subscribe to new products when productIds change', () => {
    const { rerender } = render(<WishlistPriceAlert productIds={['product-1']} />);

    vi.clearAllMocks();
    rerender(<WishlistPriceAlert productIds={['product-1', 'product-2', 'product-3']} />);

    // Should subscribe to new products only
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_product', { product_id: 'product-2' });
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_product', { product_id: 'product-3' });
    expect(mockSocket.emit).not.toHaveBeenCalledWith('subscribe_product', {
      product_id: 'product-1',
    });
  });

  it('should not re-subscribe to already subscribed products', () => {
    const { rerender } = render(<WishlistPriceAlert productIds={['product-1', 'product-2']} />);

    vi.clearAllMocks();
    rerender(<WishlistPriceAlert productIds={['product-1', 'product-2']} />);

    // Should not subscribe again
    expect(mockSocket.emit).not.toHaveBeenCalledWith('subscribe_product', expect.any(Object));
  });

  it('should handle onPriceChange being undefined', () => {
    render(<WishlistPriceAlert productIds={['product-1']} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      // Should not throw error when onPriceChange is undefined
      expect(() => {
        priceUpdateHandler({
          product_id: 'product-1',
          old_price: 100,
          new_price: 80,
        });
      }).not.toThrow();

      expect(toast.success).toHaveBeenCalled();
    }
  });

  it('should update price history when showing alert', () => {
    render(<WishlistPriceAlert productIds={['product-1']} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      // First update
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 80,
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // Second update within cooldown
      vi.advanceTimersByTime(1000);
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 80,
        new_price: 70,
      });

      // Should not show toast due to cooldown
      expect(toast.success).not.toHaveBeenCalled();
    }
  });

  it('should handle edge case of very small price drop', () => {
    render(<WishlistPriceAlert productIds={['product-1']} />);

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price_updated',
    )?.[1];

    if (priceUpdateHandler) {
      priceUpdateHandler({
        product_id: 'product-1',
        old_price: 100,
        new_price: 99.5,
      });

      // Should show 1% discount (rounded)
      expect(toast.success).toHaveBeenCalledWith(
        '🎉 Sản phẩm yêu thích đã giảm giá 1%!',
        expect.any(Object),
      );
    }
  });

  it('should unsubscribe from all products and clear event listeners on unmount', () => {
    const { unmount } = render(<WishlistPriceAlert productIds={['product-1', 'product-2']} />);

    const offHandler = mockSocket.off.mock.calls[0]?.[1];

    vi.clearAllMocks();
    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_product', {
      product_id: 'product-1',
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_product', {
      product_id: 'product-2',
    });
    expect(mockSocket.off).toHaveBeenCalledWith('price_updated', expect.any(Function));
  });
});
