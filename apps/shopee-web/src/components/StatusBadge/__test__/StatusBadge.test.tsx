import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

vi.mock('src/config/orderStatus', () => ({
  ORDER_STATUS_CONFIG: {
    pending: {
      color: { light: 'text-yellow-700', dark: 'text-yellow-300' },
      bgColor: { light: 'bg-yellow-50', dark: 'bg-yellow-900/20' },
      borderColor: { light: 'border-yellow-200', dark: 'border-yellow-700' },
    },
    confirmed: {
      color: { light: 'text-blue-700', dark: 'text-blue-300' },
      bgColor: { light: 'bg-blue-50', dark: 'bg-blue-900/20' },
      borderColor: { light: 'border-blue-200', dark: 'border-blue-700' },
    },
    delivered: {
      color: { light: 'text-green-700', dark: 'text-green-300' },
      bgColor: { light: 'bg-green-50', dark: 'bg-green-900/20' },
      borderColor: { light: 'border-green-200', dark: 'border-green-700' },
    },
  },
  getStatusLabel: (status: string) => `Status: ${status}`,
}));

describe('StatusBadge', () => {
  it('renders status label', () => {
    render(<StatusBadge status={'pending' as any} />);
    expect(screen.getByText('Status: pending')).toBeInTheDocument();
  });

  it('renders with sm size', () => {
    const { container } = render(<StatusBadge status={'pending' as any} size="sm" />);
    expect(container.firstChild).toHaveClass('px-2');
  });

  it('renders with md size by default', () => {
    const { container } = render(<StatusBadge status={'pending' as any} />);
    expect(container.firstChild).toHaveClass('px-3');
  });

  it('renders with lg size', () => {
    const { container } = render(<StatusBadge status={'pending' as any} size="lg" />);
    expect(container.firstChild).toHaveClass('px-4');
  });

  it('returns null for unknown status', () => {
    const { container } = render(<StatusBadge status={'unknown' as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatusBadge status={'pending' as any} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
