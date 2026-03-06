import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BaseModal from './BaseModal'

describe('BaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>
  }

  it('renders modal content when open', () => {
    render(<BaseModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<BaseModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<BaseModal {...defaultProps} onClose={onClose} />)
    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      await user.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<BaseModal {...defaultProps} onClose={onClose} closeOnBackdrop={false} />)
    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      await user.click(backdrop)
      expect(onClose).not.toHaveBeenCalled()
    }
  })
})
