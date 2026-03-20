import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RelatedProducts from '../RelatedProducts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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

describe('RelatedProducts', () => {
  const mockProducts = {
    data: {
      data: {
        products: [
          { _id: '1', name: 'Product 1', price: 100, image: 'img1.jpg' },
          { _id: '2', name: 'Product 2', price: 200, image: 'img2.jpg' },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryReturn = { data: undefined, isLoading: true };
  });

  it('should render loading skeleton when loading', () => {
    mockUseQueryReturn = { data: undefined, isLoading: true };
    render(<RelatedProducts categoryId="cat1" reducedMotion={false} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('related.loading')).toBeInTheDocument();
  });

  it('should render products when data is loaded', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<RelatedProducts categoryId="cat1" reducedMotion={false} />);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should render section title', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<RelatedProducts categoryId="cat1" reducedMotion={false} />);
    expect(screen.getByText('related.youMayAlsoLike')).toBeInTheDocument();
  });

  it('should render see more link with correct category', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<RelatedProducts categoryId="cat123" reducedMotion={false} />);
    const seeMoreLink = screen.getByText('related.seeMore');
    expect(seeMoreLink.closest('a')).toHaveAttribute('href', '/products?category=cat123');
  });

  it('should render with reduced motion', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    render(<RelatedProducts categoryId="cat1" reducedMotion={true} />);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should call useQuery with correct config', () => {
    mockUseQueryReturn = { data: undefined, isLoading: true };
    render(<RelatedProducts categoryId="cat1" reducedMotion={false} />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['products', { limit: '20', page: '1', category: 'cat1' }],
        enabled: true,
        staleTime: 180000,
      }),
    );
  });

  it('should not enable query when categoryId is empty', () => {
    mockUseQueryReturn = { data: undefined, isLoading: false };
    render(<RelatedProducts categoryId="" reducedMotion={false} />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should render 6 skeleton items when loading', () => {
    mockUseQueryReturn = { data: undefined, isLoading: true };
    const { container } = render(<RelatedProducts categoryId="cat1" reducedMotion={false} />);
    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBe(6);
  });

  it('should render products in grid layout', () => {
    mockUseQueryReturn = { data: mockProducts, isLoading: false };
    const { container } = render(<RelatedProducts categoryId="cat1" reducedMotion={false} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
