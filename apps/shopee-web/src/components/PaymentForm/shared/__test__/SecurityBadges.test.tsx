import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SecurityBadges from '../SecurityBadges'

describe('SecurityBadges', () => {
  it('renders PCI DSS badge', () => {
    render(<SecurityBadges />)
    expect(screen.getByText('PCI DSS')).toBeInTheDocument()
  })

  it('renders SSL Secured badge', () => {
    render(<SecurityBadges />)
    expect(screen.getByText('SSL Secured')).toBeInTheDocument()
  })
})
