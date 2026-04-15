import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Products" />)
    expect(screen.getByText('Products')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<PageHeader title="Products" description="Manage your products" />)
    expect(screen.getByText('Manage your products')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<PageHeader title="Products" actions={<button>Add</button>} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Products" />)
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })

  it('does not render actions when not provided', () => {
    render(<PageHeader title="Products" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
