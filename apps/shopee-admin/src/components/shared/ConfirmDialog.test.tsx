import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    render(<ConfirmDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmDialog open={true} onOpenChange={vi.fn()} onConfirm={onConfirm} />)
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelBtn)
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(
      <ConfirmDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} isLoading={true} />,
    )
    expect(screen.getByText('states.loading')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ConfirmDialog open={false} onOpenChange={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
