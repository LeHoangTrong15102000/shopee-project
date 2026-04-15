import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  ShimmerEffect,
  FloatingParticle,
  GoldenSparkle,
  ProfileIcons,
  PROFILE_FIELDS,
  isFieldComplete,
} from '../profileCompletion.constants'
import type { User } from 'src/types/user.type'

describe('profileCompletion.constants', () => {
  describe('ShimmerEffect', () => {
    it('renders a div with aria-hidden', () => {
      const { container } = render(<ShimmerEffect />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })
  })

  describe('FloatingParticle', () => {
    it('renders with given size and color', () => {
      const { container } = render(<FloatingParticle delay={0} size={8} color="bg-blue-500" />)
      const el = container.querySelector('[aria-hidden="true"]')
      expect(el).toBeInTheDocument()
    })
  })

  describe('GoldenSparkle', () => {
    it('renders with position and default size', () => {
      const { container } = render(<GoldenSparkle delay={0} x={10} y={20} />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })

    it('renders with custom size', () => {
      const { container } = render(<GoldenSparkle delay={0} x={10} y={20} size={12} />)
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })
  })

  describe('ProfileIcons', () => {
    const iconKeys = ['name', 'avatar', 'phone', 'address', 'date_of_birth'] as const

    iconKeys.forEach((key) => {
      it(`renders ${key} icon as svg`, () => {
        const { container } = render(ProfileIcons[key]('h-5 w-5'))
        expect(container.querySelector('svg')).toBeInTheDocument()
      })
    })
  })

  describe('PROFILE_FIELDS', () => {
    it('has 5 fields', () => {
      expect(PROFILE_FIELDS).toHaveLength(5)
    })

    it('all weights sum to 100', () => {
      const total = PROFILE_FIELDS.reduce((sum, f) => sum + f.weight, 0)
      expect(total).toBe(100)
    })

    it('contains expected keys', () => {
      const keys = PROFILE_FIELDS.map((f) => f.key)
      expect(keys).toEqual(['name', 'avatar', 'phone', 'address', 'date_of_birth'])
    })
  })

  describe('isFieldComplete', () => {
    const baseUser = {
      _id: '1',
      email: 'test@test.com',
      name: 'John',
      avatar: 'avatar.jpg',
      phone: '0123456789',
      address: '123 Street',
      date_of_birth: '1990-01-01',
      roles: ['User'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    } as unknown as User

    it('returns false for null user', () => {
      expect(isFieldComplete(null, 'name')).toBe(false)
    })

    it('returns true for filled name', () => {
      expect(isFieldComplete(baseUser, 'name')).toBe(true)
    })

    it('returns false for empty name', () => {
      expect(isFieldComplete({ ...baseUser, name: '' } as User, 'name')).toBe(false)
    })

    it('returns false for undefined field', () => {
      expect(isFieldComplete({ ...baseUser, phone: undefined } as unknown as User, 'phone')).toBe(
        false,
      )
    })

    it('returns false for null field', () => {
      expect(isFieldComplete({ ...baseUser, address: null } as unknown as User, 'address')).toBe(
        false,
      )
    })

    it('returns true for valid date_of_birth', () => {
      expect(isFieldComplete(baseUser, 'date_of_birth')).toBe(true)
    })

    it('returns false for invalid date_of_birth', () => {
      expect(
        isFieldComplete({ ...baseUser, date_of_birth: 'not-a-date' } as User, 'date_of_birth'),
      ).toBe(false)
    })

    it('returns true for avatar field', () => {
      expect(isFieldComplete(baseUser, 'avatar')).toBe(true)
    })
  })
})
