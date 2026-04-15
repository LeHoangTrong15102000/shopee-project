import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each(['active', 'inactive', 'pending', 'shipped', 'delivered', 'cancelled'])(
    'renders %s status',
    (status) => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
    },
  )

  it.each(['enabled', 'disabled', 'processing', 'approved', 'flagged'])(
    'renders %s status variant',
    (status) => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
    },
  )

  it('applies custom className', () => {
    const { container } = render(<StatusBadge status="active" className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('handles unknown status gracefully', () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText('unknown')).toBeInTheDocument()
  })

  it('handles uppercase status', () => {
    render(<StatusBadge status="ACTIVE" />)
    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })
})
