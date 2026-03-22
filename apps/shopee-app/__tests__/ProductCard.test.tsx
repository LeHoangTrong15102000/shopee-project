import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '../components/home/ProductCard';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockProduct = {
  _id: 'p1',
  images: ['https://example.com/img.jpg'],
  price: 100000,
  rating: 4.5,
  price_before_discount: 150000,
  quantity: 100,
  sold: 1500,
  view: 2000,
  name: 'Test Product with a very long name that should be truncated after two lines of text',
  category: { _id: 'cat-1', name: 'Áo thun' },
  image: 'https://example.com/img.jpg',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockProductNoDiscount = {
  ...mockProduct,
  _id: 'p2',
  price: 100000,
  price_before_discount: 100000,
};

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    warning: '#f4c790',
    neutrals400: '#6e6e6e',
  }),
}));

describe('ProductCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders product name and price', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText(mockProduct.name)).toBeTruthy();
    expect(getByText(/₫100/)).toBeTruthy();
  });

  it('shows discount badge when discounted', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText(/-33%/)).toBeTruthy();
  });

  it('does not show discount badge when no discount', () => {
    const { queryByText } = render(<ProductCard product={mockProductNoDiscount} />);
    expect(queryByText(/-%/)).toBeNull();
  });

  it('formats sold count with k suffix', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText(/1.5k sold/)).toBeTruthy();
  });

  it('navigates to product detail on press', () => {
    const { getByA11yRole } = render(<ProductCard product={mockProduct} />);
    const card = getByA11yRole('button');
    fireEvent.press(card);
    expect(mockPush).toHaveBeenCalledWith('/product/p1');
  });
});
