import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/utils/testUtils'
import DeleteModal from './DeleteModal'
import { createMockProduct } from 'src/utils/testUtils'

describe('DeleteModal', () => {
  const mockProduct = createMockProduct({ name: 'Test Product to Delete' })
  const defaultProps = {
    open: true,
    product: mockProduct,
    handleIsAgree: vi.fn(),
    handleIsCancel: vi.fn()
  }

  it('renders modal when open', () => {
    renderWithProviders(<DeleteModal {...defaultProps} />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Test Product to Delete')).toBeInTheDocument()
  })

  it('calls handleIsAgree and handleIsCancel when delete is confirmed', async () => {
    const user = userEvent.setup()
    const handleIsAgree = vi.fn()
    const handleIsCancel = vi.fn()
    renderWithProviders(<DeleteModal {...defaultProps} handleIsAgree={handleIsAgree} handleIsCancel={handleIsCancel} />)
    await user.click(screen.getByRole('button', { name: /có|yes/i }))
    expect(handleIsAgree).toHaveBeenCalled()
    expect(handleIsCancel).toHaveBeenCalled()
  })

  it('calls handleIsCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const handleIsCancel = vi.fn()
    renderWithProviders(<DeleteModal {...defaultProps} handleIsCancel={handleIsCancel} />)
    await user.click(screen.getByRole('button', { name: /không|no/i }))
    expect(handleIsCancel).toHaveBeenCalled()
  })
})
