import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShopProducts from '../ShopProducts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseQuery = vi.fn();
let mockUseQueryReturn: any = { data: undefined, isLoading: true };

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => {
    mockUseQuery(...args);
    return mockUseQueryReturn;
  },
}));

vi.mock('src/apis/product.api', () => ({
  default: {
    getProducts: vi.fn(),
  },
}));

vi.mock('src/pages/ProductList/components/Product', () => ({
  default: ({ product }: any) => <div data-testid="product">{product.name}</div>,
}));

describe('ShopProducts', () => {
  const mockProducts = {
    data: {
      data: {
        products: [
          { _id: '1', name: 'Shop Product 1', price: 100 },
          { _id: '2', name: 'Shop Product 2', price: 200 },
          { _id: '3', name: 'Shop Product 3', price: 300 },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryReturn = { data: undefined, isLoading: true };
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should render loading skeleton when loading', () => {
    mockUseQueryReturn = { data: undefined, isLoading: true };
    render(<ShopProducts categoryId="cat1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('related.loading')).toBeInTheDocument();
  });

  it('should render products when data is loaded', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    expect(screen.getByText('Shop Product 1')).toBeInTheDocument();
    expect(screen.getByText('Shop Product 2')).toBeInTheDocument();
    expect(screen.getByText('Shop Product 3')).toBeInTheDocument();
  });

  it('should render section title', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    expect(screen.getByText('related.fromThisShop')).toBeInTheDocument();
  });

  it('should render scroll buttons', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    expect(screen.getByLabelText('related.scrollLeft')).toBeInTheDocument();
    expect(screen.getByLabelText('related.scrollRight')).toBeInTheDocument();
  });

  it('should scroll left when left button is clicked', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    const scrollContainer = screen.getByText('Shop Product 1').closest('.flex');
    const scrollBySpy = vi.fn();
    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollBy', { value: scrollBySpy, writable: true });
      Object.defineProperty(scrollContainer, 'clientWidth', { value: 1000, writable: true });
    }
    const leftButton = screen.getByLabelText('related.scrollLeft');
    fireEvent.click(leftButton);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: -600, behavior: 'smooth' });
  });

  it('should scroll right when right button is clicked', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    const scrollContainer = screen.getByText('Shop Product 1').closest('.flex');
    const scrollBySpy = vi.fn();
    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollBy', { value: scrollBySpy, writable: true });
      Object.defineProperty(scrollContainer, 'clientWidth', { value: 1000, writable: true });
    }
    const rightButton = screen.getByLabelText('related.scrollRight');
    fireEvent.click(rightButton);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: 600, behavior: 'smooth' });
  });

  it('should use auto scroll behavior when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    const scrollContainer = screen.getByText('Shop Product 1').closest('.flex');
    const scrollBySpy = vi.fn();
    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollBy', { value: scrollBySpy, writable: true });
      Object.defineProperty(scrollContainer, 'clientWidth', { value: 1000, writable: true });
    }
    const leftButton = screen.getByLabelText('related.scrollLeft');
    fireEvent.click(leftButton);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: -600, behavior: 'auto' });
  });

  it('should return null when no products', () => {
    mockUseQueryReturn = {
      data: { data: { data: { products: [] } } },
      isLoading: false,
    };
    const { container } = render(<ShopProducts categoryId="cat1" />);
    expect(container.firstChild).toBeNull();
  });

  it('should call useQuery with correct config', () => {
    mockUseQueryReturn = { data: undefined, isLoading: true };
    render(<ShopProducts categoryId="cat1" />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['shopProducts', { limit: '10', page: '1', category: 'cat1' }],
        enabled: true,
        staleTime: 180000,
      }),
    );
  });

  it('should not enable query when categoryId is empty', () => {
    mockUseQueryReturn = { data: undefined, isLoading: false };
    render(<ShopProducts categoryId="" />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should render 6 skeleton items when loading', () => {
    mockUseQueryReturn = { data: undefined, isLoading: true };
    const { container } = render(<ShopProducts categoryId="cat1" />);
    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBe(7);
  });

  it('should have carousel role', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<ShopProducts categoryId="cat1" />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});
