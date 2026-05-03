import { render, screen } from '@testing-library/react'
import { MotionCard } from './MotionCard'

describe('MotionCard', () => {
  it('renders children in reduced motion mode (global mock)', () => {
    render(<MotionCard>Content</MotionCard>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders motion wrapper when reduced motion is disabled', async () => {
    const motionReact = await import('motion/react')
    const spy = vi.spyOn(motionReact, 'useReducedMotion').mockReturnValue(false)

    render(<MotionCard data-testid="motion-card">Animated</MotionCard>)
    expect(screen.getByText('Animated')).toBeInTheDocument()

    spy.mockRestore()
  })
})
