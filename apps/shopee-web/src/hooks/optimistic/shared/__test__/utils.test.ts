import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  TOAST_CONFIG,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  findProductInCache,
  createOptimisticPurchase,
  updatePurchasesCache,
  createExtendedPurchase,
  logOptimisticError,
} from '../utils';
import { Product } from 'src/types/product.type';
import { Purchase } from 'src/types/purchases.type';
import { PurchasesQueryData } from '../types';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('TOAST_CONFIG', () => {
  it('should have all 5 toast configurations with correct autoClose values', () => {
    expect(TOAST_CONFIG.SUCCESS).toEqual({
      autoClose: 1500,
      position: 'top-center',
    });
    expect(TOAST_CONFIG.ERROR).toEqual({
      autoClose: 3000,
      position: 'top-center',
    });
    expect(TOAST_CONFIG.INFO).toEqual({
      autoClose: 2000,
      position: 'top-center',
    });
    expect(TOAST_CONFIG.QUICK_SUCCESS).toEqual({
      autoClose: 1000,
      position: 'top-center',
    });
    expect(TOAST_CONFIG.UNDO).toEqual({
      autoClose: 5000,
      position: 'top-center',
    });
  });
});

describe('showSuccessToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call toast.success with correct config', () => {
    const message = 'Success message';
    showSuccessToast(message);

    expect(toast.success).toHaveBeenCalledWith(message, {
      autoClose: 1500,
      position: 'top-center',
    });
  });

  it('should merge custom config with default config', () => {
    const message = 'Success message';
    const customConfig = { autoClose: 2500 };
    showSuccessToast(message, customConfig);

    expect(toast.success).toHaveBeenCalledWith(message, {
      autoClose: 2500,
      position: 'top-center',
    });
  });
});

describe('showErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call toast.error with correct config', () => {
    const message = 'Error message';
    showErrorToast(message);

    expect(toast.error).toHaveBeenCalledWith(message, {
      autoClose: 3000,
      position: 'top-center',
    });
  });
});

describe('showInfoToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call toast.info with correct config', () => {
    const message = 'Info message';
    showInfoToast(message);

    expect(toast.info).toHaveBeenCalledWith(message, {
      autoClose: 2000,
      position: 'top-center',
    });
  });
});

describe('findProductInCache', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('should return null when no data is found', () => {
    const result = findProductInCache(queryClient, 'non-existent-id');
    expect(result).toBeNull();
  });

  it('should find product in products list cache', () => {
    const mockProduct: Product = {
      _id: 'product-123',
      name: 'Test Product',
      price: 100,
      price_before_discount: 150,
    } as Product;

    queryClient.setQueryData(['products'], {
      data: {
        data: {
          products: [mockProduct],
        },
      },
    });

    const result = findProductInCache(queryClient, 'product-123');
    expect(result).toEqual(mockProduct);
  });

  it('should find product in product detail cache', () => {
    const mockProduct: Product = {
      _id: 'product-456',
      name: 'Detail Product',
      price: 200,
      price_before_discount: 250,
    } as Product;

    queryClient.setQueryData(['product', 'product-456'], {
      data: {
        data: mockProduct,
      },
    });

    const result = findProductInCache(queryClient, 'product-456');
    expect(result).toEqual(mockProduct);
  });
});

describe('createOptimisticPurchase', () => {
  it('should create purchase with temp ID prefix', () => {
    const mockProduct: Product = {
      _id: 'product-123',
      name: 'Test Product',
      price: 100,
      price_before_discount: 150,
    } as Product;

    const purchase = createOptimisticPurchase(mockProduct, 2);

    expect(purchase._id).toMatch(/^temp-\d+$/);
  });

  it('should use correct buy_count and price', () => {
    const mockProduct: Product = {
      _id: 'product-123',
      name: 'Test Product',
      price: 100,
      price_before_discount: 150,
    } as Product;

    const purchase = createOptimisticPurchase(mockProduct, 3);

    expect(purchase.buy_count).toBe(3);
    expect(purchase.price).toBe(100);
    expect(purchase.price_before_discount).toBe(150);
    expect(purchase.product).toEqual(mockProduct);
  });

  it('should use default inCart status', () => {
    const mockProduct: Product = {
      _id: 'product-123',
      name: 'Test Product',
      price: 100,
      price_before_discount: 150,
    } as Product;

    const purchase = createOptimisticPurchase(mockProduct, 1);

    expect(purchase.status).toBe(-1); // purchasesStatus.inCart
    expect(purchase.user).toBe('current-user');
    expect(purchase.createdAt).toBeDefined();
    expect(purchase.updatedAt).toBeDefined();
  });
});

describe('updatePurchasesCache', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('should call setQueryData with updater function', () => {
    const queryKey = ['purchases', { status: 'inCart' }];
    const mockData: PurchasesQueryData = {
      data: {
        message: 'success',
        data: [],
      },
    };

    queryClient.setQueryData(queryKey, mockData);

    const updater = (oldData: PurchasesQueryData) => ({
      ...oldData,
      data: {
        ...oldData.data,
        data: [...oldData.data.data, {} as Purchase],
      },
    });

    updatePurchasesCache(queryClient, queryKey, updater);

    const result = queryClient.getQueryData(queryKey) as PurchasesQueryData;
    expect(result.data.data).toHaveLength(1);
  });

  it('should do nothing when old data is undefined', () => {
    const queryKey = ['purchases', { status: 'inCart' }];
    const updater = vi.fn((oldData: PurchasesQueryData) => oldData);

    updatePurchasesCache(queryClient, queryKey, updater);

    const result = queryClient.getQueryData(queryKey);
    expect(result).toBeUndefined();
    expect(updater).not.toHaveBeenCalled();
  });
});

describe('createExtendedPurchase', () => {
  it('should add disabled and isChecked defaults', () => {
    const mockPurchase = {
      _id: 'purchase-123',
      buy_count: 1,
      price: 100,
      status: 0,
    } as unknown as Purchase;

    const extended = createExtendedPurchase(mockPurchase);

    expect(extended).toEqual({
      ...mockPurchase,
      disabled: false,
      isChecked: false,
    });
  });

  it('should use provided options', () => {
    const mockPurchase = {
      _id: 'purchase-123',
      buy_count: 1,
      price: 100,
      status: 0,
    } as unknown as Purchase;

    const extended = createExtendedPurchase(mockPurchase, {
      disabled: true,
      isChecked: true,
    });

    expect(extended).toEqual({
      ...mockPurchase,
      disabled: true,
      isChecked: true,
    });
  });
});

describe('logOptimisticError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log to console.error with operation and error', () => {
    const error = new Error('Test error');
    logOptimisticError('addToCart', error);

    expect(console.error).toHaveBeenCalledWith('Optimistic addToCart error:', error);
  });

  it('should log context when provided', () => {
    const error = new Error('Test error');
    const context = { productId: '123' };
    logOptimisticError('addToCart', error, context);

    expect(console.error).toHaveBeenCalledWith('Optimistic addToCart error:', error);
    expect(console.error).toHaveBeenCalledWith('Context:', context);
  });
});
