import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddressForm from '../AddressForm'
import { renderWithProviders } from 'src/utils/testUtils'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        ({ children, ...props }: any) => {
          const { initial, animate, exit, transition, variants, ...rest } = props
          const Tag = (typeof prop === 'string' ? prop : 'div') as any
          return <Tag {...rest}>{children}</Tag>
        },
    },
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock child step components
vi.mock('../components/ContactInfoStep', () => ({
  default: () => <div data-testid="contact-info-step">ContactInfoStep</div>,
}))

vi.mock('../components/LocationStep', () => ({
  default: () => <div data-testid="location-step">LocationStep</div>,
}))

vi.mock('../components/AddressDetailsStep', () => ({
  default: () => <div data-testid="address-details-step">AddressDetailsStep</div>,
}))

vi.mock('../components/AddressFormHeader', () => ({
  default: ({ isEditing, onClose }: any) => (
    <div data-testid="address-form-header">
      <span>{isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</span>
      <button onClick={onClose} aria-label="close-header">
        Close
      </button>
    </div>
  ),
}))

vi.mock('../components/StepIndicator', () => ({
  default: ({ currentStep, onStepClick }: any) => (
    <div data-testid="step-indicator">
      <span>Step {currentStep}</span>
      <button onClick={() => onStepClick(1)}>Step1</button>
      <button onClick={() => onStepClick(2)}>Step2</button>
      <button onClick={() => onStepClick(3)}>Step3</button>
    </div>
  ),
}))

vi.mock('../components/AddressFormFooter', () => ({
  default: ({ currentStep, isLoading, isEditing, onBack, onNext, onClose, onSubmit }: any) => (
    <div data-testid="address-form-footer">
      <span>Footer Step {currentStep}</span>
      {currentStep > 1 && (
        <button onClick={onBack} data-testid="back-btn">
          Back
        </button>
      )}
      {currentStep < 3 ? (
        <button onClick={onNext} data-testid="next-btn">
          Next
        </button>
      ) : (
        <button onClick={onSubmit} disabled={isLoading} data-testid="submit-btn">
          {isEditing ? 'Cập nhật' : 'Thêm địa chỉ'}
        </button>
      )}
      <button onClick={onClose} data-testid="cancel-footer-btn">
        Cancel
      </button>
    </div>
  ),
}))

// Mock useAddressForm
const mockSetCurrentStep = vi.fn()
const mockOnSubmit = vi.fn()
const mockHandleSubmit = vi.fn((fn) => (e?: any) => {
  e?.preventDefault?.()
  fn({})
})

const defaultHookReturn = {
  form: {
    handleSubmit: mockHandleSubmit,
    formState: { errors: {}, touchedFields: {} },
    register: vi.fn(),
    watch: vi.fn(),
    setValue: vi.fn(),
    control: {} as any,
  },
  isEditing: false,
  currentStep: 1,
  setCurrentStep: mockSetCurrentStep,
  districts: [],
  wards: [],
  isLoadingDistricts: false,
  isLoadingWards: false,
  showStreetSuggestions: false,
  setShowStreetSuggestions: vi.fn(),
  filteredStreetSuggestions: [],
  watchedProvinceId: '',
  watchedDistrictId: '',
  watchedAddressType: 'home' as const,
  addressPreview: '',
  stepProgress: 0,
  canProceedToStep: vi.fn(() => true),
  handleProvinceChange: vi.fn(),
  handleDistrictChange: vi.fn(),
  handleWardChange: vi.fn(),
  handleStreetSelect: vi.fn(),
  handleTypeSelect: vi.fn(),
  onSubmit: mockOnSubmit,
  isLoading: false,
}

vi.mock('../useAddressForm', () => ({
  useAddressForm: vi.fn(() => defaultHookReturn),
}))

import { useAddressForm } from '../useAddressForm'

const mockUseAddressForm = vi.mocked(useAddressForm)

describe('AddressForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn })
  })

  it('renders the form header', () => {
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('address-form-header')).toBeInTheDocument()
  })

  it('shows "add" title when address is null (not editing)', () => {
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Thêm địa chỉ mới')).toBeInTheDocument()
  })

  it('shows "edit" title when address is provided', () => {
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, isEditing: true })
    const address = {
      _id: 'addr1',
      fullName: 'Nguyễn Test',
      phone: '0901234567',
      province: 'Hà Nội',
      provinceId: '01',
      district: 'Quận 1',
      districtId: 'd1',
      ward: 'Phường 1',
      wardId: 'w1',
      street: '123 Đường ABC',
      addressType: 'home' as const,
      isDefault: false,
    }
    render(<AddressForm address={address} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Cập nhật địa chỉ')).toBeInTheDocument()
  })

  it('renders step indicator', () => {
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
  })

  it('renders ContactInfoStep on step 1', () => {
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('contact-info-step')).toBeInTheDocument()
    expect(screen.queryByTestId('location-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('address-details-step')).not.toBeInTheDocument()
  })

  it('renders LocationStep on step 2', () => {
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, currentStep: 2 })
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('location-step')).toBeInTheDocument()
    expect(screen.queryByTestId('contact-info-step')).not.toBeInTheDocument()
  })

  it('renders AddressDetailsStep on step 3', () => {
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, currentStep: 3 })
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('address-details-step')).toBeInTheDocument()
    expect(screen.queryByTestId('contact-info-step')).not.toBeInTheDocument()
  })

  it('renders form footer', () => {
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('address-form-footer')).toBeInTheDocument()
  })

  it('calls onClose when close button in header is clicked', () => {
    const onClose = vi.fn()
    render(<AddressForm address={null} onClose={onClose} onSuccess={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('close-header'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls setCurrentStep when step navigator is clicked', () => {
    const setCurrentStep = vi.fn()
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, setCurrentStep })
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    fireEvent.click(screen.getByText('Step2'))
    expect(setCurrentStep).toHaveBeenCalledWith(2)
  })

  it('calls setCurrentStep(next) when next button is clicked', () => {
    const setCurrentStep = vi.fn()
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, currentStep: 1, setCurrentStep })
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    fireEvent.click(screen.getByTestId('next-btn'))
    expect(setCurrentStep).toHaveBeenCalledWith(2)
  })

  it('calls setCurrentStep(prev) when back button is clicked', () => {
    const setCurrentStep = vi.fn()
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, currentStep: 2, setCurrentStep })
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    fireEvent.click(screen.getByTestId('back-btn'))
    expect(setCurrentStep).toHaveBeenCalledWith(1)
  })

  it('disables submit button while loading', () => {
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, currentStep: 3, isLoading: true })
    render(<AddressForm address={null} onClose={vi.fn()} onSuccess={vi.fn()} />)
    const submitBtn = screen.getByTestId('submit-btn')
    expect(submitBtn).toBeDisabled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <AddressForm address={null} onClose={onClose} onSuccess={vi.fn()} />,
    )
    // The outer div has onClick={onClose}
    const backdrop = container.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('stops propagation on inner modal click (does not trigger onClose)', () => {
    const onClose = vi.fn()
    const { container } = render(
      <AddressForm address={null} onClose={onClose} onSuccess={vi.fn()} />,
    )
    const innerModal = container.querySelector('.rounded-2xl')
    if (innerModal) {
      fireEvent.click(innerModal)
      expect(onClose).not.toHaveBeenCalled()
    }
  })

  it('renders with non-null address (edit mode)', () => {
    const address = {
      _id: 'addr1',
      fullName: 'Test User',
      phone: '0912345678',
      province: 'TP.HCM',
      provinceId: '79',
      district: 'Quận Bình Thạnh',
      districtId: '765',
      ward: 'Phường 6',
      wardId: 'w6',
      street: '100 Đường XYZ',
      addressType: 'office' as const,
      isDefault: true,
    }
    mockUseAddressForm.mockReturnValue({ ...defaultHookReturn, isEditing: true })
    render(<AddressForm address={address} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByTestId('address-form-header')).toBeInTheDocument()
  })
})
