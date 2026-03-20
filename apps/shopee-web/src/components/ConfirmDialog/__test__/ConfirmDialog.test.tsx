import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('src/components/Button', () => ({
  default: vi.fn().mockImplementation(({ children, onClick, disabled, ref, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} ref={ref} {...props}>
      {children}
    </button>
  )),
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Xác nhận xóa',
    message: 'Bạn có chắc chắn muốn xóa?',
  };

  it('renders title when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Xác nhận xóa')).toBeInTheDocument();
  });

  it('renders message when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Bạn có chắc chắn muốn xóa?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Xác nhận xóa')).not.toBeInTheDocument();
  });

  it('renders default confirm and cancel text', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Hủy')).toBeInTheDocument();
  });

  it('renders custom confirm and cancel text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Đồng ý" cancelText="Không" />);
    expect(screen.getByText('Đồng ý')).toBeInTheDocument();
    expect(screen.getByText('Không')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Xác nhận'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Hủy'));
    expect(onClose).toHaveBeenCalled();
  });

  it('has dialog role', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal attribute', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on Escape when loading', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} isLoading={true} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('renders danger variant by default', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);
    expect(container.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('renders warning variant', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} variant="warning" />);
    expect(container.querySelector('.text-yellow-500')).toBeInTheDocument();
  });

  it('renders info variant', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} variant="info" />);
    expect(container.querySelector('.text-blue-500')).toBeInTheDocument();
  });
});
