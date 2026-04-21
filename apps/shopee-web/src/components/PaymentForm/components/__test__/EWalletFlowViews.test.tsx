import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WaitingView, SuccessView, FailedView, TimeoutView } from '../EWalletFlowViews'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    svg: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <svg {...rest}>{children}</svg>
    },
    path: (props: any) => {
      const { initial, animate, transition, ...rest } = props
      return <path {...rest} />
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    )
  },
}))

vi.mock('./WalletCard', () => ({
  formatCurrency: (n: number) => n.toLocaleString('vi-VN'),
}))

describe('EWalletFlowViews', () => {
  describe('WaitingView', () => {
    it('renders wallet name', () => {
      render(<WaitingView walletName="MoMo" />)
      expect(screen.getByText(/MoMo/)).toBeInTheDocument()
    })

    it('renders waiting payment text', () => {
      render(<WaitingView walletName="ZaloPay" />)
      expect(screen.getByText(/ZaloPay/)).toBeInTheDocument()
    })

    it('renders "eWallet.waitingPayment" text', () => {
      render(<WaitingView walletName="MoMo" />)
      expect(screen.getByText('Đang chờ thanh toán...')).toBeInTheDocument()
    })

    it('renders "eWallet.processingTransaction" text', () => {
      render(<WaitingView walletName="MoMo" />)
      expect(screen.getByText('Đang xử lý giao dịch')).toBeInTheDocument()
    })
  })

  describe('SuccessView', () => {
    it('renders success with formatted amount', () => {
      render(<SuccessView amount={200000} />)
      expect(screen.getByText(/200/)).toBeInTheDocument()
    })

    it('renders "eWallet.paymentSuccess" heading', () => {
      render(<SuccessView amount={100000} />)
      expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
    })

    it('renders "eWallet.orderProcessing" text', () => {
      render(<SuccessView amount={100000} />)
      expect(screen.getByText('Đơn hàng của bạn đang được xử lý')).toBeInTheDocument()
    })

    it('renders with zero amount', () => {
      render(<SuccessView amount={0} />)
      expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      expect(screen.getByText(/0/)).toBeInTheDocument()
    })
  })

  describe('FailedView', () => {
    it('renders error message', () => {
      render(<FailedView message="Lỗi kết nối" onRetry={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument()
    })

    it('calls onRetry when retry clicked', () => {
      const onRetry = vi.fn()
      render(<FailedView message="err" onRetry={onRetry} onCancel={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      expect(onRetry).toHaveBeenCalled()
    })

    it('calls onCancel when cancel clicked', () => {
      const onCancel = vi.fn()
      render(<FailedView message="err" onRetry={vi.fn()} onCancel={onCancel} />)
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[1])
      expect(onCancel).toHaveBeenCalled()
    })

    it('renders "eWallet.paymentFailed" heading', () => {
      render(<FailedView message="some error" onRetry={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
    })

    it('renders both button texts (retry and choose other method)', () => {
      render(<FailedView message="some error" onRetry={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Thử lại')).toBeInTheDocument()
      expect(screen.getByText('Chọn phương thức khác')).toBeInTheDocument()
    })
  })

  describe('TimeoutView', () => {
    it('renders timeout content', () => {
      render(<TimeoutView onRegenerateQR={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2)
    })

    it('calls onRegenerateQR when clicked', () => {
      const onRegenerate = vi.fn()
      render(<TimeoutView onRegenerateQR={onRegenerate} onCancel={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      expect(onRegenerate).toHaveBeenCalled()
    })

    it('calls onCancel when cancel clicked', () => {
      const onCancel = vi.fn()
      render(<TimeoutView onRegenerateQR={vi.fn()} onCancel={onCancel} />)
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[1])
      expect(onCancel).toHaveBeenCalled()
    })

    it('renders "eWallet.qrExpired" heading', () => {
      render(<TimeoutView onRegenerateQR={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Mã QR đã hết hạn')).toBeInTheDocument()
    })

    it('renders "eWallet.qrExpiredMessage" text', () => {
      render(<TimeoutView onRegenerateQR={vi.fn()} onCancel={vi.fn()} />)
      expect(
        screen.getByText('Mã QR thanh toán đã hết hạn. Vui lòng tạo mã mới để tiếp tục.'),
      ).toBeInTheDocument()
    })
  })
})
