import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ...rest } = props;
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    );
  },
}));

describe('EmptyState', () => {
  it('renders empty state title', () => {
    render(<EmptyState onAddNew={vi.fn()} />);
    expect(screen.getByText('Chưa có địa chỉ nào')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<EmptyState onAddNew={vi.fn()} />);
    expect(screen.getByText(/Thêm địa chỉ giao hàng/)).toBeInTheDocument();
  });

  it('renders add button', () => {
    render(<EmptyState onAddNew={vi.fn()} />);
    expect(screen.getByText('Thêm địa chỉ đầu tiên')).toBeInTheDocument();
  });

  it('calls onAddNew when button clicked', () => {
    const onAddNew = vi.fn();
    render(<EmptyState onAddNew={onAddNew} />);
    fireEvent.click(screen.getByText('Thêm địa chỉ đầu tiên'));
    expect(onAddNew).toHaveBeenCalled();
  });

  it('renders feature list', () => {
    render(<EmptyState onAddNew={vi.fn()} />);
    expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument();
    expect(screen.getByText('Lưu nhiều địa chỉ')).toBeInTheDocument();
    expect(screen.getByText('Thanh toán dễ dàng')).toBeInTheDocument();
  });
});
