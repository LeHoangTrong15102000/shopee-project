import { describe, it, expect, vi, beforeEach } from 'vitest';
import { navigationService, PATHS } from '../navigation.service';

describe('NavigationService', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNavigate = vi.fn() as any;
    navigationService.init(mockNavigate);
  });

  describe('to', () => {
    it('should navigate to path', () => {
      navigationService.to('/test');
      expect(mockNavigate).toHaveBeenCalledWith('/test', { replace: undefined, state: undefined });
    });

    it('should support replace option', () => {
      navigationService.to('/test', { replace: true });
      expect(mockNavigate).toHaveBeenCalledWith('/test', { replace: true, state: undefined });
    });
  });

  describe('toLogin', () => {
    it('should navigate to login and store redirect', () => {
      navigationService.toLogin('/cart');
      expect(mockNavigate).toHaveBeenCalled();
      expect(navigationService.getPendingRedirect()).toBe('/cart');
    });
  });

  describe('handlePostLoginRedirect', () => {
    it('should redirect to pending URL and clear it', () => {
      navigationService.toLogin('/checkout');
      navigationService.handlePostLoginRedirect();
      expect(navigationService.getPendingRedirect()).toBeNull();
    });

    it('should redirect to home if no pending redirect', () => {
      navigationService.clearPendingRedirect();
      navigationService.handlePostLoginRedirect();
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('toProduct', () => {
    it('should navigate to product detail', () => {
      navigationService.toProduct('test-product-i.123');
      expect(mockNavigate).toHaveBeenCalledWith('/test-product-i.123', expect.any(Object));
    });
  });

  describe('toSearch', () => {
    it('should navigate to search with query', () => {
      navigationService.toSearch('áo thun');
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('buildUrl', () => {
    it('should build URL with params', () => {
      const url = navigationService.buildUrl('/products', { page: 1, limit: 20 });
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
    });

    it('should skip undefined params', () => {
      const url = navigationService.buildUrl('/products', { page: 1, name: undefined });
      expect(url).toContain('page=1');
      expect(url).not.toContain('name');
    });

    it('should return base path when no params', () => {
      const url = navigationService.buildUrl('/products', {});
      expect(url).toBe('/products');
    });
  });

  describe('PATHS', () => {
    it('should have correct static paths', () => {
      expect(PATHS.HOME).toBe('/');
      expect(PATHS.LOGIN).toBe('/login');
      expect(PATHS.CART).toBe('/cart');
    });

    it('should generate dynamic paths', () => {
      expect(PATHS.PRODUCT_DETAIL('test-i.123')).toBe('/test-i.123');
      expect(PATHS.SEARCH('áo')).toContain('name=');
    });
  });
});
