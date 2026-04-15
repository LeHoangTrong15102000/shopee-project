import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders default text', () => {
    render(<EmptyState />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders custom title and description', () => {
    render(<EmptyState title="No items" description="Try adding some" />)
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Try adding some')).toBeInTheDocument()
  })

  it('renders action button when provided', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<EmptyState action={{ label: 'Add Item', onClick }} />)
    const btn = screen.getByRole('button', { name: 'Add Item' })
    await user.click(btn)
    expect(onClick).toHaveBeenCalled()
  })

  it('renders custom icon', () => {
    render(<EmptyState icon={<span data-testid="custom-icon">🎯</span>} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
