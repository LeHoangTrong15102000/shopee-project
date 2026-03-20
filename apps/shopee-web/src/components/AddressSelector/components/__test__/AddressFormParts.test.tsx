import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressFormHeader from '../AddressFormHeader';
import AddressFormFooter from '../AddressFormFooter';

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, type, className, isLoading, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      type={type}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('AddressFormHeader', () => {
  it('shows add title when not editing', () => {
    render(<AddressFormHeader isEditing={false} onClose={vi.fn()} />);
    expect(screen.getByText('Thêm địa chỉ mới')).toBeInTheDocument();
  });

  it('shows edit title when editing', () => {
    render(<AddressFormHeader isEditing={true} onClose={vi.fn()} />);
    expect(screen.getByText('Cập nhật địa chỉ')).toBeInTheDocument();
  });

  it('shows subtitle', () => {
    render(<AddressFormHeader isEditing={false} onClose={vi.fn()} />);
    expect(screen.getByText('Điền thông tin giao hàng của bạn')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<AddressFormHeader isEditing={false} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AddressFormFooter', () => {
  const defaultProps = {
    currentStep: 1,
    isLoading: false,
    canProceedToNext: true,
    isEditing: false,
    onBack: vi.fn(),
    onNext: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('shows cancel button', () => {
    render(<AddressFormFooter {...defaultProps} />);
    expect(screen.getByText('Hủy')).toBeInTheDocument();
  });

  it('shows next button on step 1', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={1} />);
    expect(screen.getByText('Tiếp tục')).toBeInTheDocument();
  });

  it('shows next button on step 2', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={2} />);
    expect(screen.getByText('Tiếp tục')).toBeInTheDocument();
  });

  it('shows add button on step 3 when not editing', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={3} />);
    expect(screen.getByText('Thêm địa chỉ')).toBeInTheDocument();
  });

  it('shows update button on step 3 when editing', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={3} isEditing={true} />);
    expect(screen.getByText('Cập nhật')).toBeInTheDocument();
  });

  it('hides back button on step 1', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={1} />);
    expect(screen.queryByText('Quay lại')).toBeNull();
  });

  it('shows back button on step 2', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={2} />);
    expect(screen.getByText('Quay lại')).toBeInTheDocument();
  });

  it('calls onNext when next clicked', () => {
    const onNext = vi.fn();
    render(<AddressFormFooter {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByText('Tiếp tục'));
    expect(onNext).toHaveBeenCalled();
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<AddressFormFooter {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Hủy'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onBack when back clicked', () => {
    const onBack = vi.fn();
    render(<AddressFormFooter {...defaultProps} currentStep={2} onBack={onBack} />);
    fireEvent.click(screen.getByText('Quay lại'));
    expect(onBack).toHaveBeenCalled();
  });

  it('disables next when canProceedToNext is false', () => {
    render(<AddressFormFooter {...defaultProps} canProceedToNext={false} />);
    expect(screen.getByText('Tiếp tục').closest('button')).toBeDisabled();
  });

  it('disables submit when loading', () => {
    render(<AddressFormFooter {...defaultProps} currentStep={3} isLoading={true} />);
    expect(screen.getByText('Thêm địa chỉ').closest('button')).toBeDisabled();
  });
});
