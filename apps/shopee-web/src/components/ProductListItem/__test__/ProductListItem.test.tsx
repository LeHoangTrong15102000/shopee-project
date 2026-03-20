import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductListItem from '../ProductListItem';
import { Product } from 'src/types/product.type';

let mockNavigate = vi.fn();
const mockSavePosition = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating }: any) => <div data-testid="rating">{rating}</div>,
}));

vi.mock('src/components/OptimizedImage', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('src/components/WishlistButton', () => ({
  default: ({ productId }: any) => <button data-testid="wishlist">{productId}</button>,
}));

vi.mock('src/hooks/useScrollRestoration', () => ({
  scrollManager: {
    savePosition: (...args: any[]) => mockSavePosition(...args),
  },
}));

describe('ProductListItem', () => {
  const mockProduct: Product = {
    _id: '1',
    name: 'Test Product Item',
    price: 200000,
    price_before_discount: 300000,
    rating: 4.8,
    sold: 2500,
    image: 'test-item.jpg',
    location: 'TP. Hồ Chí Minh',
    description: 'Test description',
    category: { _id: 'cat1', name: 'Category 1' },
    quantity: 20,
    view: 1000,
    images: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    mockSavePosition.mockClear();
  });

  it('should render product information', () => {
    render(<ProductListItem product={mockProduct} />);
    expect(screen.getByText('Test Product Item')).toBeInTheDocument();
    expect(screen.getByText('TP. Hồ Chí Minh')).toBeInTheDocument();
  });

  it('should render product image', () => {
    render(<ProductListItem product={mockProduct} />);
    const image = screen.getByAltText('Test Product Item');
    expect(image).toHaveAttribute('src', 'test-item.jpg');
  });

  it('should render product prices', () => {
    render(<ProductListItem product={mockProduct} />);
    expect(screen.getByText('200.000')).toBeInTheDocument();
    expect(screen.getByText('300.000')).toBeInTheDocument();
  });

  it('should render discount percentage', () => {
    render(<ProductListItem product={mockProduct} />);
    expect(screen.getByText('-33%')).toBeInTheDocument();
  });

  it('should not render discount when prices are equal', () => {
    const productNoDiscount = { ...mockProduct, price_before_discount: 200000 };
    render(<ProductListItem product={productNoDiscount} />);
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it('should render product rating', () => {
    render(<ProductListItem product={mockProduct} />);
    expect(screen.getByTestId('rating')).toHaveTextContent('4.8');
    expect(screen.getByText('(4.8)')).toBeInTheDocument();
  });

  it('should render sold count', () => {
    render(<ProductListItem product={mockProduct} />);
    expect(screen.getByText('2,5k')).toBeInTheDocument();
  });

  it('should render wishlist button', () => {
    render(<ProductListItem product={mockProduct} />);
    expect(screen.getByTestId('wishlist')).toBeInTheDocument();
  });

  it('should navigate on click', () => {
    render(<ProductListItem product={mockProduct} />);
    const productElement = screen.getByRole('link');
    fireEvent.click(productElement);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should navigate on Enter key press', () => {
    render(<ProductListItem product={mockProduct} />);
    const productElement = screen.getByRole('link');
    fireEvent.keyDown(productElement, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should navigate on Space key press', () => {
    render(<ProductListItem product={mockProduct} />);
    const productElement = screen.getByRole('link');
    fireEvent.keyDown(productElement, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should save scroll position on click', () => {
    render(<ProductListItem product={mockProduct} />);
    const productElement = screen.getByRole('link');
    fireEvent.click(productElement);
    expect(mockSavePosition).toHaveBeenCalled();
  });

  it('should have proper aria-label', () => {
    render(<ProductListItem product={mockProduct} />);
    const productElement = screen.getByRole('link');
    expect(productElement).toHaveAttribute('aria-label', 'Test Product Item - ₫200.000');
  });

  it('should be keyboard accessible', () => {
    render(<ProductListItem product={mockProduct} />);
    const productElement = screen.getByRole('link');
    expect(productElement).toHaveAttribute('tabIndex', '0');
  });

  it('should have location icon', () => {
    const { container } = render(<ProductListItem product={mockProduct} />);
    const locationIcon = container.querySelector('svg');
    expect(locationIcon).toBeInTheDocument();
  });
});
