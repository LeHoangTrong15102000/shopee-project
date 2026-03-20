import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import ComparisonMobileCard from '../ComparisonMobileCard';

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props;
    return (
      <button onClick={onClick} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    );
  },
}));

const product1 = {
  _id: 'p1',
  name: 'Sản phẩm A',
  price: 100000,
  price_before_discount: 200000,
  quantity: 50,
  sold: 500,
  rating: 4.5,
  view: 1000,
  description: 'desc',
  images: ['img1.jpg'],
  image: 'img1.jpg',
  category: { _id: 'c1', name: 'Điện tử' },
  createdAt: '',
  updatedAt: '',
};

const product2 = {
  _id: 'p2',
  name: 'Sản phẩm B',
  price: 150000,
  price_before_discount: 200000,
  quantity: 30,
  sold: 300,
  rating: 4.0,
  view: 500,
  description: 'desc',
  images: ['img2.jpg'],
  image: 'img2.jpg',
  category: { _id: 'c1', name: 'Điện tử' },
  createdAt: '',
  updatedAt: '',
};

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('ComparisonMobileCard', () => {
  it('renders product names', () => {
    wrap(
      <ComparisonMobileCard
        compareList={[product1, product2] as any}
        removeFromCompare={vi.fn()}
      />,
    );
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm B')).toBeInTheDocument();
  });

  it('renders product images', () => {
    wrap(
      <ComparisonMobileCard
        compareList={[product1, product2] as any}
        removeFromCompare={vi.fn()}
      />,
    );
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
  });

  it('renders formatted prices', () => {
    wrap(
      <ComparisonMobileCard
        compareList={[product1, product2] as any}
        removeFromCompare={vi.fn()}
      />,
    );
    expect(screen.getByText(/100\.000/)).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
  });

  it('renders ratings', () => {
    wrap(
      <ComparisonMobileCard
        compareList={[product1, product2] as any}
        removeFromCompare={vi.fn()}
      />,
    );
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getAllByText(/\b4\b/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders sold counts', () => {
    wrap(
      <ComparisonMobileCard
        compareList={[product1, product2] as any}
        removeFromCompare={vi.fn()}
      />,
    );
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('calls removeFromCompare when remove button clicked', () => {
    const remove = vi.fn();
    wrap(<ComparisonMobileCard compareList={[product1] as any} removeFromCompare={remove} />);
    const buttons = screen.getAllByRole('button');
    buttons[0].click();
    expect(remove).toHaveBeenCalledWith('p1');
  });
});
