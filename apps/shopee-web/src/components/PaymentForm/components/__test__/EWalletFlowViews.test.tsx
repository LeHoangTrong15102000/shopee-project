import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaitingView, SuccessView, FailedView, TimeoutView } from '../EWalletFlowViews';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    svg: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <svg {...rest}>{children}</svg>;
    },
    path: (props: any) => {
      const { initial, animate, transition, ...rest } = props;
      return <path {...rest} />;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props;
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    );
  },
}));

vi.mock('./WalletCard', () => ({
  formatCurrency: (n: number) => n.toLocaleString('vi-VN'),
}));

describe('EWalletFlowViews', () => {
  describe('WaitingView', () => {
    it('renders wallet name', () => {
      render(<WaitingView walletName="MoMo" />);
      expect(screen.getByText(/MoMo/)).toBeInTheDocument();
    });

    it('renders waiting payment text', () => {
      render(<WaitingView walletName="ZaloPay" />);
      expect(screen.getByText(/ZaloPay/)).toBeInTheDocument();
    });
  });

  describe('SuccessView', () => {
    it('renders success with formatted amount', () => {
      render(<SuccessView amount={200000} />);
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });
  });

  describe('FailedView', () => {
    it('renders error message', () => {
      render(<FailedView message="Lỗi kết nối" onRetry={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument();
    });

    it('calls onRetry when retry clicked', () => {
      const onRetry = vi.fn();
      render(<FailedView message="err" onRetry={onRetry} onCancel={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(onRetry).toHaveBeenCalled();
    });

    it('calls onCancel when cancel clicked', () => {
      const onCancel = vi.fn();
      render(<FailedView message="err" onRetry={vi.fn()} onCancel={onCancel} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('TimeoutView', () => {
    it('renders timeout content', () => {
      render(<TimeoutView onRegenerateQR={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
    });

    it('calls onRegenerateQR when clicked', () => {
      const onRegenerate = vi.fn();
      render(<TimeoutView onRegenerateQR={onRegenerate} onCancel={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(onRegenerate).toHaveBeenCalled();
    });

    it('calls onCancel when cancel clicked', () => {
      const onCancel = vi.fn();
      render(<TimeoutView onRegenerateQR={vi.fn()} onCancel={onCancel} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
