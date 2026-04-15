import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WalletSelectionView from '../WalletSelectionView'

describe('WalletSelectionView', () => {
  it('renders title', () => {
    render(
      <WalletSelectionView
        selectedWallet={null}
        onSelectWallet={vi.fn()}
        onLinkNewWallet={vi.fn()}
        onProceed={vi.fn()}
      />,
    )
    expect(screen.getByText('Chọn ví điện tử')).toBeInTheDocument()
  })

  it('renders all wallet cards', () => {
    render(
      <WalletSelectionView
        selectedWallet={null}
        onSelectWallet={vi.fn()}
        onLinkNewWallet={vi.fn()}
        onProceed={vi.fn()}
      />,
    )
    expect(screen.getByText('MoMo')).toBeInTheDocument()
    expect(screen.getByText('ZaloPay')).toBeInTheDocument()
    expect(screen.getByText('VNPay')).toBeInTheDocument()
  })

  it('renders link new wallet button', () => {
    render(
      <WalletSelectionView
        selectedWallet={null}
        onSelectWallet={vi.fn()}
        onLinkNewWallet={vi.fn()}
        onProceed={vi.fn()}
      />,
    )
    expect(screen.getByText('Liên kết ví mới')).toBeInTheDocument()
  })

  it('calls onLinkNewWallet when link button clicked', () => {
    const onLink = vi.fn()
    render(
      <WalletSelectionView
        selectedWallet={null}
        onSelectWallet={vi.fn()}
        onLinkNewWallet={onLink}
        onProceed={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Liên kết ví mới'))
    expect(onLink).toHaveBeenCalled()
  })

  it('shows proceed button when wallet selected', () => {
    render(
      <WalletSelectionView
        selectedWallet="momo"
        onSelectWallet={vi.fn()}
        onLinkNewWallet={vi.fn()}
        onProceed={vi.fn()}
      />,
    )
    expect(screen.getByText('Tiếp tục thanh toán')).toBeInTheDocument()
  })

  it('does not show proceed button when no wallet selected', () => {
    render(
      <WalletSelectionView
        selectedWallet={null}
        onSelectWallet={vi.fn()}
        onLinkNewWallet={vi.fn()}
        onProceed={vi.fn()}
      />,
    )
    expect(screen.queryByText('Tiếp tục thanh toán')).not.toBeInTheDocument()
  })

  it('calls onProceed when proceed button clicked', () => {
    const onProceed = vi.fn()
    render(
      <WalletSelectionView
        selectedWallet="momo"
        onSelectWallet={vi.fn()}
        onLinkNewWallet={vi.fn()}
        onProceed={onProceed}
      />,
    )
    fireEvent.click(screen.getByText('Tiếp tục thanh toán'))
    expect(onProceed).toHaveBeenCalled()
  })
})
