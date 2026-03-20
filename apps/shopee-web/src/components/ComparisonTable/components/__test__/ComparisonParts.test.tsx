import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComparisonSummary from '../../components/ComparisonSummary';
import ComparisonMobileCard from '../../components/ComparisonMobileCard';

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => n.toLocaleString(),
  formatNumberToSocialStyle: (n: number) => `${n}`,
  generateNameId: ({ name, id }: any) => `${name}-i-${id}`,
}));

describe('ComparisonSummary', () => {
  it('returns null when comparisonSummary is null', () => {
    const { container } = render(<ComparisonSummary comparisonSummary={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when comparisonSummary is empty', () => {
    const { container } = render(<ComparisonSummary comparisonSummary={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders summary items', () => {
    const items = [
      { text: 'is cheaper', productName: 'Product A', color: 'text-green-500' },
      { text: 'has better rating', productName: 'Product B', color: 'text-blue-500' },
    ];
    render(<ComparisonSummary comparisonSummary={items} />);
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText(/is cheaper/)).toBeInTheDocument();
  });

  it('shows separator between items', () => {
    const items = [
      { text: 'a', productName: 'P1', color: 'text-red' },
      { text: 'b', productName: 'P2', color: 'text-blue' },
    ];
    const { container } = render(<ComparisonSummary comparisonSummary={items} />);
    expect(container.textContent).toContain(',');
  });
});

describe('ComparisonMobileCard', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Product 1',
      image: '/img1.jpg',
      price: 100000,
      rating: 4.5,
      sold: 1000,
    },
    {
      _id: '2',
      name: 'Product 2',
      image: '/img2.jpg',
      price: 200000,
      rating: 3.8,
      sold: 500,
    },
  ] as any;

  it('renders all products', () => {
    render(<ComparisonMobileCard compareList={mockProducts} removeFromCompare={vi.fn()} />);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('shows product prices', () => {
    render(<ComparisonMobileCard compareList={mockProducts} removeFromCompare={vi.fn()} />);
    expect(screen.getByText('₫100,000')).toBeInTheDocument();
  });

  it('shows product ratings', () => {
    render(<ComparisonMobileCard compareList={mockProducts} removeFromCompare={vi.fn()} />);
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
  });

  it('calls removeFromCompare when remove button clicked', () => {
    const remove = vi.fn();
    render(<ComparisonMobileCard compareList={mockProducts} removeFromCompare={remove} />);
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);
    expect(remove).toHaveBeenCalledWith('1');
  });

  it('renders product images', () => {
    render(<ComparisonMobileCard compareList={mockProducts} removeFromCompare={vi.fn()} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
  });
});
