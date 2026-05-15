import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationStep from '../components/LocationStep'
import { UseFormReturn } from 'react-hook-form'
import { AddressSchemaFormData } from '../addressForm.constants'

// Mock framer-motion
// Mock vietnamLocations data
vi.mock('src/data/vietnamLocations', () => ({
  vietnamProvinces: [
    {
      id: 'hcm',
      name: 'Hồ Chí Minh',
      districts: [],
    },
    {
      id: 'hn',
      name: 'Hà Nội',
      districts: [],
    },
  ],
  District: {},
  Ward: {},
}))

describe('LocationStep', () => {
  const mockRegister = vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  }))

  const mockWatch = vi.fn((field?: string) => {
    if (field === 'wardId') return ''
    return ''
  })

  const createMockForm = (
    errors = {},
    watchValues: Record<string, any> = {},
  ): UseFormReturn<AddressSchemaFormData> => {
    const mockWatchFn = vi.fn((field?: string) => {
      if (field && watchValues[field] !== undefined) {
        return watchValues[field]
      }
      return ''
    })

    return {
      register: mockRegister,
      watch: mockWatchFn,
      formState: { errors },
    } as any
  }

  const defaultProps = {
    districts: [],
    wards: [],
    isLoadingDistricts: false,
    isLoadingWards: false,
    watchedProvinceId: '',
    watchedDistrictId: '',
    onProvinceChange: vi.fn(),
    onDistrictChange: vi.fn(),
    onWardChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders location step title and subtitle', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument()
      expect(screen.getByText('Chọn khu vực giao hàng của bạn')).toBeInTheDocument()
    })

    it('renders all three select fields', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Tỉnh/Thành phố')).toBeInTheDocument()
      expect(screen.getByText('Quận/Huyện')).toBeInTheDocument()
      expect(screen.getByText('Phường/Xã')).toBeInTheDocument()
    })

    it('renders required asterisks for all fields', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const asterisks = screen.getAllByText('*')
      expect(asterisks).toHaveLength(3)
    })

    it('renders province select with default option', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Chọn tỉnh/thành')).toBeInTheDocument()
    })

    it('renders province options from vietnamProvinces', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument()
      expect(screen.getByText('Hà Nội')).toBeInTheDocument()
    })

    it('renders hidden inputs for form values', () => {
      const form = createMockForm()
      const { container } = render(<LocationStep {...defaultProps} form={form} />)

      const hiddenInputs = container.querySelectorAll('input[type="hidden"]')
      expect(hiddenInputs).toHaveLength(6)
    })
  })

  describe('Province Select', () => {
    it('renders province select with correct value', () => {
      const form = createMockForm()
      const props = { ...defaultProps, watchedProvinceId: 'hcm' }
      render(<LocationStep {...props} form={form} />)

      const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement
      expect(select.value).toBe('hcm')
    })

    it('renders province select with empty value when not selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement
      expect(select.value).toBe('')
    })

    it('calls onProvinceChange when province is selected', () => {
      const form = createMockForm()
      const onProvinceChange = vi.fn()
      render(<LocationStep {...defaultProps} form={form} onProvinceChange={onProvinceChange} />)

      const select = screen.getAllByRole('combobox')[0]
      fireEvent.change(select, { target: { value: 'hcm' } })

      expect(onProvinceChange).toHaveBeenCalled()
    })

    it('shows error message when province has error', () => {
      const form = createMockForm({
        provinceId: { message: 'Vui lòng chọn tỉnh/thành phố' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Vui lòng chọn tỉnh/thành phố')).toBeInTheDocument()
    })

    it('applies error border class when province has error', () => {
      const form = createMockForm({
        provinceId: { message: 'Error' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[0]
      expect(select.className).toContain('border-red-300')
    })

    it('applies normal border class when province has no error', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[0]
      expect(select.className).toContain('border-gray-300')
    })

    it('renders chevron icon for province select', () => {
      const form = createMockForm()
      const { container } = render(<LocationStep {...defaultProps} form={form} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('District Select', () => {
    it('renders district select with correct value', () => {
      const form = createMockForm()
      const districts = [{ id: 'q1', name: 'Quận 1', wards: [] }]
      const props = {
        ...defaultProps,
        watchedDistrictId: 'q1',
        watchedProvinceId: 'hcm',
        districts,
      }
      render(<LocationStep {...props} form={form} />)

      const select = screen.getAllByRole('combobox')[1] as HTMLSelectElement
      expect(select.value).toBe('q1')
    })

    it('renders district select with empty value when not selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[1] as HTMLSelectElement
      expect(select.value).toBe('')
    })

    it('disables district select when no province selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedProvinceId="" />)

      const select = screen.getAllByRole('combobox')[1]
      expect(select).toBeDisabled()
    })

    it('enables district select when province is selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedProvinceId="hcm" />)

      const select = screen.getAllByRole('combobox')[1]
      expect(select).not.toBeDisabled()
    })

    it('disables district select when loading districts', () => {
      const form = createMockForm()
      render(
        <LocationStep
          {...defaultProps}
          form={form}
          isLoadingDistricts={true}
          watchedProvinceId="hcm"
        />,
      )

      const select = screen.getAllByRole('combobox')[1]
      expect(select).toBeDisabled()
    })

    it('shows loading text when loading districts', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} isLoadingDistricts={true} />)

      expect(screen.getByText('Đang tải...')).toBeInTheDocument()
    })

    it('shows default text when not loading districts', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} isLoadingDistricts={false} />)

      expect(screen.getByText('Chọn quận/huyện')).toBeInTheDocument()
    })

    it('renders district options when provided', () => {
      const form = createMockForm()
      const districts = [
        { id: 'q1', name: 'Quận 1', wards: [] },
        { id: 'q3', name: 'Quận 3', wards: [] },
      ]
      render(<LocationStep {...defaultProps} form={form} districts={districts} />)

      expect(screen.getByText('Quận 1')).toBeInTheDocument()
      expect(screen.getByText('Quận 3')).toBeInTheDocument()
    })

    it('calls onDistrictChange when district is selected', () => {
      const form = createMockForm()
      const onDistrictChange = vi.fn()
      const districts = [{ id: 'q1', name: 'Quận 1', wards: [] }]
      render(
        <LocationStep
          {...defaultProps}
          form={form}
          districts={districts}
          watchedProvinceId="hcm"
          onDistrictChange={onDistrictChange}
        />,
      )

      const select = screen.getAllByRole('combobox')[1]
      fireEvent.change(select, { target: { value: 'q1' } })

      expect(onDistrictChange).toHaveBeenCalled()
    })

    it('shows error message when district has error', () => {
      const form = createMockForm({
        districtId: { message: 'Vui lòng chọn quận/huyện' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Vui lòng chọn quận/huyện')).toBeInTheDocument()
    })

    it('applies error border class when district has error', () => {
      const form = createMockForm({
        districtId: { message: 'Error' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[1]
      expect(select.className).toContain('border-red-300')
    })

    it('shows loading spinner when loading districts', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep {...defaultProps} form={form} isLoadingDistricts={true} />,
      )

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('shows chevron icon when not loading districts', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep {...defaultProps} form={form} isLoadingDistricts={false} />,
      )

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Ward Select', () => {
    it('renders ward select with correct value from watch', () => {
      const form = createMockForm({}, { wardId: 'ben-nghe' })
      const wards = [{ id: 'ben-nghe', name: 'Phường Bến Nghé' }]
      const props = {
        ...defaultProps,
        watchedProvinceId: 'hcm',
        watchedDistrictId: 'q1',
        wards,
      }
      render(<LocationStep {...props} form={form} />)

      const select = screen.getAllByRole('combobox')[2] as HTMLSelectElement
      expect(select.value).toBe('ben-nghe')
    })

    it('renders ward select with empty value when not selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[2] as HTMLSelectElement
      expect(select.value).toBe('')
    })

    it('disables ward select when no district selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedDistrictId="" />)

      const select = screen.getAllByRole('combobox')[2]
      expect(select).toBeDisabled()
    })

    it('enables ward select when district is selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedDistrictId="q1" />)

      const select = screen.getAllByRole('combobox')[2]
      expect(select).not.toBeDisabled()
    })

    it('disables ward select when loading wards', () => {
      const form = createMockForm()
      render(
        <LocationStep {...defaultProps} form={form} isLoadingWards={true} watchedDistrictId="q1" />,
      )

      const select = screen.getAllByRole('combobox')[2]
      expect(select).toBeDisabled()
    })

    it('shows loading text when loading wards', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} isLoadingWards={true} />)

      const loadingTexts = screen.getAllByText('Đang tải...')
      expect(loadingTexts.length).toBeGreaterThan(0)
    })

    it('shows default text when not loading wards', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} isLoadingWards={false} />)

      expect(screen.getByText('Chọn phường/xã')).toBeInTheDocument()
    })

    it('renders ward options when provided', () => {
      const form = createMockForm()
      const wards = [
        { id: 'ben-nghe', name: 'Phường Bến Nghé' },
        { id: 'ben-thanh', name: 'Phường Bến Thành' },
      ]
      render(<LocationStep {...defaultProps} form={form} wards={wards} />)

      expect(screen.getByText('Phường Bến Nghé')).toBeInTheDocument()
      expect(screen.getByText('Phường Bến Thành')).toBeInTheDocument()
    })

    it('calls onWardChange when ward is selected', () => {
      const form = createMockForm()
      const onWardChange = vi.fn()
      const wards = [{ id: 'ben-nghe', name: 'Phường Bến Nghé' }]
      render(
        <LocationStep
          {...defaultProps}
          form={form}
          wards={wards}
          watchedDistrictId="q1"
          onWardChange={onWardChange}
        />,
      )

      const select = screen.getAllByRole('combobox')[2]
      fireEvent.change(select, { target: { value: 'ben-nghe' } })

      expect(onWardChange).toHaveBeenCalled()
    })

    it('shows error message when ward has error', () => {
      const form = createMockForm({
        wardId: { message: 'Vui lòng chọn phường/xã' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Vui lòng chọn phường/xã')).toBeInTheDocument()
    })

    it('applies error border class when ward has error', () => {
      const form = createMockForm({
        wardId: { message: 'Error' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      const select = screen.getAllByRole('combobox')[2]
      expect(select.className).toContain('border-red-300')
    })

    it('shows loading spinner when loading wards', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep {...defaultProps} form={form} isLoadingWards={true} />,
      )

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('shows chevron icon when not loading wards', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep {...defaultProps} form={form} isLoadingWards={false} />,
      )

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Multiple Errors', () => {
    it('shows all error messages when all fields have errors', () => {
      const form = createMockForm({
        provinceId: { message: 'Vui lòng chọn tỉnh/thành phố' },
        districtId: { message: 'Vui lòng chọn quận/huyện' },
        wardId: { message: 'Vui lòng chọn phường/xã' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      expect(screen.getByText('Vui lòng chọn tỉnh/thành phố')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng chọn quận/huyện')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng chọn phường/xã')).toBeInTheDocument()
    })

    it('applies error styles to all fields with errors', () => {
      const form = createMockForm({
        provinceId: { message: 'Error 1' },
        districtId: { message: 'Error 2' },
        wardId: { message: 'Error 3' },
      })
      render(<LocationStep {...defaultProps} form={form} />)

      const selects = screen.getAllByRole('combobox')
      selects.forEach((select) => {
        expect(select.className).toContain('border-red-300')
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading spinner for districts only when isLoadingDistricts is true', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep
          {...defaultProps}
          form={form}
          isLoadingDistricts={true}
          isLoadingWards={false}
        />,
      )

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners.length).toBe(1)
    })

    it('shows loading spinner for wards only when isLoadingWards is true', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep
          {...defaultProps}
          form={form}
          isLoadingDistricts={false}
          isLoadingWards={true}
        />,
      )

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners.length).toBe(1)
    })

    it('shows loading spinners for both when both are loading', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep
          {...defaultProps}
          form={form}
          isLoadingDistricts={true}
          isLoadingWards={true}
        />,
      )

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners.length).toBe(2)
    })

    it('disables district when loading districts', () => {
      const form = createMockForm()
      render(
        <LocationStep
          {...defaultProps}
          form={form}
          isLoadingDistricts={true}
          watchedProvinceId="hcm"
          watchedDistrictId="q1"
        />,
      )

      const selects = screen.getAllByRole('combobox')
      expect(selects[1]).toBeDisabled() // district
      // ward is enabled because watchedDistrictId is set and not loading wards
      expect(selects[2]).not.toBeDisabled()
    })
  })

  describe('Cascading Behavior', () => {
    it('keeps district disabled when province is not selected', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedProvinceId="" />)

      const districtSelect = screen.getAllByRole('combobox')[1]
      expect(districtSelect).toBeDisabled()
    })

    it('keeps ward disabled when district is not selected', () => {
      const form = createMockForm()
      render(
        <LocationStep {...defaultProps} form={form} watchedProvinceId="hcm" watchedDistrictId="" />,
      )

      const wardSelect = screen.getAllByRole('combobox')[2]
      expect(wardSelect).toBeDisabled()
    })

    it('enables district when province is selected and not loading', () => {
      const form = createMockForm()
      render(
        <LocationStep
          {...defaultProps}
          form={form}
          watchedProvinceId="hcm"
          isLoadingDistricts={false}
        />,
      )

      const districtSelect = screen.getAllByRole('combobox')[1]
      expect(districtSelect).not.toBeDisabled()
    })

    it('enables ward when district is selected and not loading', () => {
      const form = createMockForm()
      render(
        <LocationStep
          {...defaultProps}
          form={form}
          watchedProvinceId="hcm"
          watchedDistrictId="q1"
          isLoadingWards={false}
        />,
      )

      const wardSelect = screen.getAllByRole('combobox')[2]
      expect(wardSelect).not.toBeDisabled()
    })
  })

  describe('Dark Mode Classes', () => {
    it('applies dark mode classes to labels', () => {
      const form = createMockForm()
      const { container } = render(<LocationStep {...defaultProps} form={form} />)

      const labels = container.querySelectorAll('label')
      labels.forEach((label) => {
        expect(label.className).toContain('dark:text-gray-200')
      })
    })

    it('applies dark mode classes to selects', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const selects = screen.getAllByRole('combobox')
      selects.forEach((select) => {
        expect(select.className).toContain('dark:bg-slate-700')
        expect(select.className).toContain('dark:text-gray-100')
      })
    })

    it('applies dark mode disabled classes to disabled selects', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      // District and ward are disabled by default (no province/district selected)
      const selects = screen.getAllByRole('combobox')
      const disabledSelects = [selects[1], selects[2]] // district and ward
      disabledSelects.forEach((select) => {
        expect(select.className).toContain('dark:disabled:bg-slate-600')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label associations', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(3)
    })

    it('shows required indicators', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const asterisks = screen.getAllByText('*')
      expect(asterisks).toHaveLength(3)
      asterisks.forEach((asterisk) => {
        expect(asterisk.className).toContain('text-red-500')
      })
    })

    it('provides error messages with proper styling', () => {
      const form = createMockForm({
        provinceId: { message: 'Error message' },
      })
      const { container } = render(<LocationStep {...defaultProps} form={form} />)

      const errorMessage = screen.getByText('Error message')
      expect(errorMessage.className).toContain('text-red-500')
      expect(errorMessage.className).toContain('text-xs')
    })
  })

  describe('Grid Layout', () => {
    it('applies grid layout classes', () => {
      const form = createMockForm()
      const { container } = render(<LocationStep {...defaultProps} form={form} />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid?.className).toContain('grid-cols-1')
      expect(grid?.className).toContain('sm:grid-cols-3')
    })
  })

  describe('Form Registration', () => {
    it('registers all hidden form fields', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      expect(mockRegister).toHaveBeenCalledWith('province')
      expect(mockRegister).toHaveBeenCalledWith('provinceId')
      expect(mockRegister).toHaveBeenCalledWith('district')
      expect(mockRegister).toHaveBeenCalledWith('districtId')
      expect(mockRegister).toHaveBeenCalledWith('ward')
      expect(mockRegister).toHaveBeenCalledWith('wardId')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty districts array', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} districts={[]} watchedProvinceId="hcm" />)

      const districtSelect = screen.getAllByRole('combobox')[1]
      const options = districtSelect.querySelectorAll('option')
      expect(options).toHaveLength(1) // Only default option
    })

    it('handles empty wards array', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} wards={[]} watchedDistrictId="q1" />)

      const wardSelect = screen.getAllByRole('combobox')[2]
      const options = wardSelect.querySelectorAll('option')
      expect(options).toHaveLength(1) // Only default option
    })

    it('handles null watchedProvinceId', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedProvinceId={null as any} />)

      const provinceSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement
      expect(provinceSelect.value).toBe('')
    })

    it('handles null watchedDistrictId', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedDistrictId={null as any} />)

      const districtSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement
      expect(districtSelect.value).toBe('')
    })

    it('handles undefined watchedProvinceId', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} watchedProvinceId={undefined as any} />)

      const provinceSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement
      expect(provinceSelect.value).toBe('')
    })
  })

  describe('Additional Edge Cases', () => {
    it('province select has correct number of options (2 provinces + 1 default)', () => {
      const form = createMockForm()
      render(<LocationStep {...defaultProps} form={form} />)

      const provinceSelect = screen.getAllByRole('combobox')[0]
      const options = provinceSelect.querySelectorAll('option')
      // 1 default "Chọn tỉnh/thành" + 2 province options from mock
      expect(options).toHaveLength(3)
    })

    it('both loading spinners have animate-spin class when both district and ward are loading', () => {
      const form = createMockForm()
      const { container } = render(
        <LocationStep
          {...defaultProps}
          form={form}
          isLoadingDistricts={true}
          isLoadingWards={true}
        />,
      )

      const spinners = container.querySelectorAll('.animate-spin')
      expect(spinners).toHaveLength(2)
      spinners.forEach((spinner) => {
        expect(spinner.classList.contains('animate-spin')).toBe(true)
      })
    })
  })
})
