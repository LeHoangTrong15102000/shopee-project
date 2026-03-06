import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/utils/testUtils'
import ConfirmDialog from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  }

  it('renders dialog when open', () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderWithProviders(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
    await user.click(screen.getByRole('button', { name: /xác nhận|confirm/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<ConfirmDialog {...defaultProps} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /hủy|cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
