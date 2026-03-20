import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonSummary from '../ComparisonSummary';

describe('ComparisonSummary', () => {
  it('renders nothing when comparisonSummary is null', () => {
    const { container } = render(<ComparisonSummary comparisonSummary={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when comparisonSummary is empty', () => {
    const { container } = render(<ComparisonSummary comparisonSummary={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders summary items', () => {
    const summary = [
      { text: 'giá tốt nhất', productName: 'Sản phẩm A', color: 'text-green-600' },
      { text: 'đánh giá cao nhất', productName: 'Sản phẩm B', color: 'text-blue-600' },
    ];
    render(<ComparisonSummary comparisonSummary={summary} />);
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm B')).toBeInTheDocument();
    expect(screen.getByText(/giá tốt nhất/)).toBeInTheDocument();
    expect(screen.getByText(/đánh giá cao nhất/)).toBeInTheDocument();
  });

  it('renders separator between items', () => {
    const summary = [
      { text: 'giá tốt nhất', productName: 'A', color: 'text-green-600' },
      { text: 'bán chạy nhất', productName: 'B', color: 'text-orange-600' },
    ];
    render(<ComparisonSummary comparisonSummary={summary} />);
    expect(screen.getByText(',')).toBeInTheDocument();
  });

  it('renders single item without separator', () => {
    const summary = [{ text: 'giá tốt nhất', productName: 'A', color: 'text-green-600' }];
    render(<ComparisonSummary comparisonSummary={summary} />);
    expect(screen.queryByText(',')).not.toBeInTheDocument();
  });
});
