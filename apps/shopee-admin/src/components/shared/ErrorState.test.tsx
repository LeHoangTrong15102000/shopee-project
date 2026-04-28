import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders default message', () => {
    render(<ErrorState />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('states.error')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<ErrorState message="Custom error" />)
    expect(screen.getByText('Custom error')).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    const retryBtn = screen.getByRole('button', { name: /buttons.retry/i })
    await user.click(retryBtn)
    expect(onRetry).toHaveBeenCalled()
  })

  it('does not render retry button when onRetry not provided', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies custom className to wrapper', () => {
    const { container } = render(<ErrorState className="my-error-class" />)
    const alertEl = container.querySelector('[role="alert"]')
    expect(alertEl).toHaveClass('my-error-class')
  })

  it('renders default fallback message when no message prop provided', () => {
    render(<ErrorState />)
    expect(screen.getByText('states.somethingWentWrong')).toBeInTheDocument()
  })
})
