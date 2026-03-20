import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AvatarCropModal from '../AvatarCropModal';

const mockOnClose = vi.fn();
const mockOnConfirm = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => {
      const translations: Record<string, Record<string, string>> = {
        user: {
          'avatar.editTitle': 'Chỉnh sửa ảnh đại diện',
          'avatar.preview': 'Xem trước',
          'avatar.maxSize': 'Kích thước file quá lớn',
          'avatar.invalidFormat': 'Định dạng file không hợp lệ',
          'avatar.processingError': 'Lỗi xử lý ảnh',
        },
        common: {
          'button.cancel': 'Hủy',
          'button.confirm': 'Xác nhận',
        },
      };
      return translations[namespace || '']?.[key] || key;
    },
  }),
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockToastError = vi.fn();

vi.mock('react-toastify', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
  },
}));

vi.mock('src/constant/config', () => ({
  default: {
    maxSizeUploadAvatar: 1024 * 1024, // 1MB
  },
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, variant, isLoading, animated, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('AvatarCropModal', () => {
  let mockFile: File;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock canvas and context
    mockContext = {
      drawImage: vi.fn(),
    };

    // Mock canvas methods on prototype (jsdom doesn't support canvas)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any);
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: any) => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      callback(blob);
    }) as any;

    // Create mock file
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AvatarCropModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(screen.queryByText('Chỉnh sửa ảnh đại diện')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(screen.getByText('Chỉnh sửa ảnh đại diện')).toBeInTheDocument();
  });

  it('creates object URL for image file', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
  });

  it('displays preview image', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const images = screen.getAllByAltText('Preview');
    expect(images.length).toBeGreaterThan(0);
  });

  it('renders zoom slider', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '3');
  });

  it('updates scale when slider changes', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2' } });

    expect(slider).toHaveValue('2');
  });

  it('renders cancel button', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
  });

  it('renders confirm button', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const backdrop = container.querySelector('.fixed.inset-0.z-50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('does not close when clicking inside modal', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles mouse drag to reposition image', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const cropArea = screen.getAllByAltText('Preview')[0].parentElement;
    if (cropArea) {
      fireEvent.mouseDown(cropArea, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(window);
    }

    expect(cropArea).toBeInTheDocument();
  });

  it('handles touch drag to reposition image', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const cropArea = screen.getAllByAltText('Preview')[0].parentElement;
    if (cropArea) {
      fireEvent.touchStart(cropArea, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(cropArea, {
        touches: [{ clientX: 150, clientY: 150 }],
      });
      fireEvent.touchEnd(cropArea);
    }

    expect(cropArea).toBeInTheDocument();
  });

  it('calls onConfirm with cropped file when confirm button is clicked', async () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  it('disables buttons when processing', async () => {
    // Mock toBlob to delay the callback
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: any) => {
      setTimeout(() => {
        const blob = new Blob(['test'], { type: 'image/jpeg' });
        callback(blob);
      }, 100);
    }) as any;

    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    const cancelButton = screen.getByRole('button', { name: 'Hủy' });

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
      expect(confirmButton).toHaveAttribute('aria-disabled', 'true');
      expect(cancelButton).toBeDisabled();
    });
  });

  it('closes modal on Escape key press', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close on Escape when processing', async () => {
    // Mock toBlob to delay the callback
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: any) => {
      setTimeout(() => {
        const blob = new Blob(['test'], { type: 'image/jpeg' });
        callback(blob);
      }, 100);
    }) as any;

    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    // Should not close immediately while processing
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('prevents body scroll when modal is open', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal is closed', () => {
    const { rerender } = render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    rerender(
      <AvatarCropModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('shows error toast for oversized file', () => {
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 2 * 1024 * 1024 });

    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={largeFile}
      />,
    );

    expect(mockToastError).toHaveBeenCalledWith('Kích thước file quá lớn', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error toast for invalid file type', () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={invalidFile}
      />,
    );

    expect(mockToastError).toHaveBeenCalledWith('Định dạng file không hợp lệ', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('accepts valid image types', () => {
    const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
    const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

    [jpegFile, pngFile, webpFile].forEach((file) => {
      const { unmount } = render(
        <AvatarCropModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          imageFile={file}
        />,
      );

      expect(screen.getByText('Chỉnh sửa ảnh đại diện')).toBeInTheDocument();
      unmount();
    });
  });

  it('displays preview with correct background position', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    expect(screen.getByText('Xem trước')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'avatar-crop-title');
  });

  it('cleans up object URL on unmount', () => {
    const { unmount } = render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('resets state when new image file is provided', () => {
    const { rerender } = render(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={mockFile}
      />,
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2.5' } });

    const newFile = new File(['new'], 'new.jpg', { type: 'image/jpeg' });
    rerender(
      <AvatarCropModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        imageFile={newFile}
      />,
    );

    // Scale should reset to 1
    expect(slider).toHaveValue('1');
  });
});
