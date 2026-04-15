import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContactInfoStep from '../AddressSelector/components/ContactInfoStep'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock react-hook-form Controller
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    Controller: ({ name, render }: any) => {
      const field = {
        name,
        value: '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      }
      return render({ field, fieldState: {}, formState: {} })
    },
  }
})

vi.mock('src/components/Input', () => ({
  default: ({ name, errorMessage, classNameInput, classNameError, register, ...props }: any) => {
    const reg = register ? register(name) : {}
    return (
      <div>
        <input data-testid={`input-${name}`} {...props} {...reg} className={classNameInput} />
        {errorMessage && <span className={classNameError}>{errorMessage}</span>}
      </div>
    )
  },
}))

vi.mock('src/i18n/i18n', () => ({
  default: { t: (key: string) => key },
}))

const createMockForm = (overrides: any = {}) => ({
  register: vi.fn(() => ({})),
  control: {} as any,
  formState: {
    errors: {},
    touchedFields: {},
    ...overrides.formState,
  },
  ...overrides,
})

describe('ContactInfoStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders contact title and subtitle', () => {
    const form = createMockForm()
    render(<ContactInfoStep form={form as any} />)
    expect(screen.getByText('contact.title')).toBeInTheDocument()
    expect(screen.getByText('contact.subtitle')).toBeInTheDocument()
  })

  it('renders full name and phone labels', () => {
    const form = createMockForm()
    render(<ContactInfoStep form={form as any} />)
    expect(screen.getByText(/form\.fullName/)).toBeInTheDocument()
    expect(screen.getByText(/form\.phone/)).toBeInTheDocument()
  })

  it('renders phone input with tel type', () => {
    const form = createMockForm()
    render(<ContactInfoStep form={form as any} />)
    const phoneInput = screen.getByPlaceholderText('contact.phonePlaceholder')
    expect(phoneInput).toHaveAttribute('type', 'tel')
  })

  it('shows error styling when fullName has error', () => {
    const form = createMockForm({
      formState: {
        errors: { fullName: { message: 'Name required' } },
        touchedFields: {},
      },
    })
    render(<ContactInfoStep form={form as any} />)
    const input = screen.getByTestId('input-fullName')
    expect(input.className).toContain('border-red-300')
  })

  it('shows success styling when fullName is touched without error', () => {
    const form = createMockForm({
      formState: {
        errors: {},
        touchedFields: { fullName: true },
      },
    })
    render(<ContactInfoStep form={form as any} />)
    const input = screen.getByTestId('input-fullName')
    expect(input.className).toContain('border-green-300')
  })

  it('shows phone error message', () => {
    const form = createMockForm({
      formState: {
        errors: { phone: { message: 'Invalid phone' } },
        touchedFields: {},
      },
    })
    render(<ContactInfoStep form={form as any} />)
    expect(screen.getByText('Invalid phone')).toBeInTheDocument()
  })

  it('shows phone success styling when touched without error', () => {
    const form = createMockForm({
      formState: {
        errors: {},
        touchedFields: { phone: true },
      },
    })
    render(<ContactInfoStep form={form as any} />)
    const phoneInput = screen.getByPlaceholderText('contact.phonePlaceholder')
    expect(phoneInput.className).toContain('border-green-300')
  })

  it('shows phone error styling when phone has error', () => {
    const form = createMockForm({
      formState: {
        errors: { phone: { message: 'Required' } },
        touchedFields: {},
      },
    })
    render(<ContactInfoStep form={form as any} />)
    const phoneInput = screen.getByPlaceholderText('contact.phonePlaceholder')
    expect(phoneInput.className).toContain('border-red-300')
  })

  it('shows phone hint text', () => {
    const form = createMockForm()
    render(<ContactInfoStep form={form as any} />)
    expect(screen.getByText('contact.phoneHint')).toBeInTheDocument()
  })

  it('shows default styling when no errors and not touched', () => {
    const form = createMockForm()
    render(<ContactInfoStep form={form as any} />)
    const input = screen.getByTestId('input-fullName')
    expect(input.className).toContain('border-gray-300')
  })
})
