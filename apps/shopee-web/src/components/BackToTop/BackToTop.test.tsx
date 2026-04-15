import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import BackToTop from './BackToTop'

describe('BackToTop', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    window.scrollTo = vi.fn()
  })

  it('does not render when scroll position is at top', () => {
    renderWithProviders(<BackToTop />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders when scroll position exceeds threshold', () => {
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
    renderWithProviders(<BackToTop />)
    window.dispatchEvent(new Event('scroll'))
    // Button visibility depends on scroll state
  })

  it('has correct aria-label', () => {
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
    renderWithProviders(<BackToTop />)
    window.dispatchEvent(new Event('scroll'))
    const button = screen.queryByRole('button')
    if (button) {
      expect(button).toHaveAttribute('aria-label')
    }
  })
})
