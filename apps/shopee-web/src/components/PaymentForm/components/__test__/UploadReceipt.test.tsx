import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadReceipt from '../UploadReceipt';

describe('UploadReceipt', () => {
  it('renders upload label', () => {
    render(<UploadReceipt onFileSelect={vi.fn()} />);
    expect(screen.getByText(/Tải lên biên lai/)).toBeInTheDocument();
  });

  it('renders upload prompt when no file selected', () => {
    render(<UploadReceipt onFileSelect={vi.fn()} />);
    expect(screen.getByText('Nhấn để tải ảnh biên lai')).toBeInTheDocument();
  });

  it('renders file size hint', () => {
    render(<UploadReceipt onFileSelect={vi.fn()} />);
    expect(screen.getByText('PNG, JPG tối đa 5MB')).toBeInTheDocument();
  });

  it('has hidden file input', () => {
    const { container } = render(<UploadReceipt onFileSelect={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('hidden');
  });

  it('accepts image files', () => {
    const { container } = render(<UploadReceipt onFileSelect={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  it('calls onFileSelect when file is selected', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<UploadReceipt onFileSelect={onFileSelect} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'receipt.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows file info after selection', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<UploadReceipt onFileSelect={onFileSelect} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test content'], 'receipt.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    expect(screen.getByText('receipt.png')).toBeInTheDocument();
  });

  it('shows remove button after file selection', () => {
    const { container } = render(<UploadReceipt onFileSelect={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'receipt.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    expect(screen.getByLabelText('Xóa biên lai')).toBeInTheDocument();
  });

  it('removes file when remove button clicked', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<UploadReceipt onFileSelect={onFileSelect} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'receipt.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    fireEvent.click(screen.getByLabelText('Xóa biên lai'));
    expect(onFileSelect).toHaveBeenLastCalledWith(null);
    expect(screen.getByText('Nhấn để tải ảnh biên lai')).toBeInTheDocument();
  });
});
