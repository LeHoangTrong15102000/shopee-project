import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PasswordStrengthMeter from './PasswordStrengthMeter'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'passwordStrength.weak': 'Weak',
        'passwordStrength.fair': 'Fair',
        'passwordStrength.good': 'Good',
        'passwordStrength.strong': 'Strong',
        'passwordStrength.aria': 'Password strength meter'
      }
      return translations[key] || key
    }
  })
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false
}))

describe('PasswordStrengthMeter', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password='' />)
    expect(container.firstChild).toBeNull()
  })

  it('renders weak strength for password meeting only 1 requirement', () => {
    // 'ABCDE' has uppercase only (length < 6) → 1 requirement → strength 1 (Weak)
    render(<PasswordStrengthMeter password='ABCDE' />)
    const meter = screen.getByRole('meter')
    expect(meter).toBeInTheDocument()
    expect(meter).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByText('Weak')).toBeInTheDocument()
  })

  it('renders fair strength for password meeting 2 requirements', () => {
    // 'ABCDEF' has length≥6 + uppercase → 2 requirements → strength 2 (Fair)
    render(<PasswordStrengthMeter password='ABCDEF' />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '2')
    expect(screen.getByText('Fair')).toBeInTheDocument()
  })

  it('renders good strength for password meeting 3-4 requirements', () => {
    render(<PasswordStrengthMeter password='Abcdef1' />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('renders strong strength for password meeting all 5 requirements', () => {
    render(<PasswordStrengthMeter password='Abcdef1!' />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '4')
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<PasswordStrengthMeter password='test' className='custom-class' />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveClass('custom-class')
  })

  it('has correct aria attributes', () => {
    render(<PasswordStrengthMeter password='test' />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-label', 'Password strength meter')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '4')
  })
})
