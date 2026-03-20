import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddressDetailsStep from '../AddressSelector/components/AddressDetailsStep';
import { UseFormReturn } from 'react-hook-form';
import { AddressSchemaFormData } from '../AddressSelector/addressForm.constants';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'details.title': 'Address Details',
        'details.subtitle': 'Enter your street address and preferences',
        'form.street': 'Street Address',
        'details.streetPlaceholder': 'Enter street address',
        'details.streetSuggestions': 'Suggestions',
        'details.fullAddress': 'Full Address',
        'details.addressType': 'Address Type',
        'type.home': 'Home',
        'type.office': 'Office',
        'type.other': 'Other',
        'details.customLabel': 'Custom Label',
        'details.customLabelPlaceholder': 'e.g., Warehouse, Store',
        'details.setDefault': 'Set as default address',
        'details.setDefaultHint': 'Use this address for future orders',
        'details.viewOnMap': 'View on Map',
        'details.comingSoon': 'Coming Soon',
        'details.pinLocation': 'Pin Location',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Input component
vi.mock('src/components/Input', () => ({
  default: ({ name, placeholder, errorMessage, register, classNameInput, classNameError }: any) => (
    <div>
      <input
        {...register(name)}
        placeholder={placeholder}
        className={classNameInput}
        data-testid={`input-${name}`}
      />
      {errorMessage && <p className={classNameError}>{errorMessage}</p>}
    </div>
  ),
}));

describe('AddressDetailsStep', () => {
  let mockForm: UseFormReturn<AddressSchemaFormData>;
  let mockOnShowStreetSuggestions: ReturnType<typeof vi.fn>;
  let mockOnStreetSelect: ReturnType<typeof vi.fn>;
  let mockOnTypeSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnShowStreetSuggestions = vi.fn();
    mockOnStreetSelect = vi.fn();
    mockOnTypeSelect = vi.fn();

    // Create mock form object
    mockForm = {
      register: vi.fn((name: string) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      })),
      formState: {
        errors: {},
        isDirty: false,
        isValid: false,
        isSubmitting: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isValidating: false,
        submitCount: 0,
        touchedFields: {},
        dirtyFields: {},
        defaultValues: {},
      },
      watch: vi.fn(),
      handleSubmit: vi.fn(),
      reset: vi.fn(),
      resetField: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
      setValue: vi.fn(),
      setFocus: vi.fn(),
      getValues: vi.fn(),
      getFieldState: vi.fn(),
      trigger: vi.fn(),
      control: {} as any,
      unregister: vi.fn(),
    } as unknown as UseFormReturn<AddressSchemaFormData>;
  });

  const getDefaultProps = () => ({
    form: mockForm,
    watchedAddressType: 'home' as const,
    addressPreview: '',
    showStreetSuggestions: false,
    filteredStreetSuggestions: [],
    onShowStreetSuggestions: mockOnShowStreetSuggestions,
    onStreetSelect: mockOnStreetSelect,
    onTypeSelect: mockOnTypeSelect,
  });

  it('renders street input field', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    const streetInput = screen.getByPlaceholderText('Enter street address');
    expect(streetInput).toBeInTheDocument();
    expect(screen.getByText('Street Address')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
  });

  it('shows street suggestions when showStreetSuggestions is true and suggestions exist', () => {
    const suggestions = ['123 Main Street', '456 Oak Avenue', '789 Pine Road'];
    render(
      <AddressDetailsStep
        {...getDefaultProps()}
        showStreetSuggestions={true}
        filteredStreetSuggestions={suggestions}
      />,
    );

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    suggestions.forEach((suggestion) => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('hides suggestions when showStreetSuggestions is false', () => {
    const suggestions = ['123 Main Street', '456 Oak Avenue'];
    render(
      <AddressDetailsStep
        {...getDefaultProps()}
        showStreetSuggestions={false}
        filteredStreetSuggestions={suggestions}
      />,
    );

    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    suggestions.forEach((suggestion) => {
      expect(screen.queryByText(suggestion)).not.toBeInTheDocument();
    });
  });

  it('calls onStreetSelect when a suggestion is clicked', () => {
    const suggestions = ['123 Main Street', '456 Oak Avenue'];
    render(
      <AddressDetailsStep
        {...getDefaultProps()}
        showStreetSuggestions={true}
        filteredStreetSuggestions={suggestions}
      />,
    );

    const firstSuggestion = screen.getByText('123 Main Street');
    fireEvent.click(firstSuggestion);

    expect(mockOnStreetSelect).toHaveBeenCalledWith('123 Main Street');
    expect(mockOnStreetSelect).toHaveBeenCalledTimes(1);
  });

  it('shows error message when street has errors', () => {
    const errorMessage = 'Street address is required';
    mockForm.formState.errors = {
      street: { message: errorMessage, type: 'required' },
    };

    render(<AddressDetailsStep {...getDefaultProps()} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows address preview when addressPreview is provided', () => {
    const addressPreview = '123 Main Street, District 1, Ho Chi Minh City';
    render(<AddressDetailsStep {...getDefaultProps()} addressPreview={addressPreview} />);

    expect(screen.getByText('Full Address')).toBeInTheDocument();
    expect(screen.getByText(addressPreview)).toBeInTheDocument();
  });

  it('renders address type options (home, office, other)', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    expect(screen.getByText('Address Type')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Office')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('highlights selected address type', () => {
    render(<AddressDetailsStep {...getDefaultProps()} watchedAddressType="office" />);

    const homeButton = screen.getByText('Home').closest('button');
    const officeButton = screen.getByText('Office').closest('button');
    const otherButton = screen.getByText('Other').closest('button');

    expect(officeButton).toHaveClass('border-orange', 'bg-orange/5', 'text-orange');
    expect(homeButton).not.toHaveClass('border-orange');
    expect(otherButton).not.toHaveClass('border-orange');
  });

  it('shows custom label input when type is "other"', () => {
    render(<AddressDetailsStep {...getDefaultProps()} watchedAddressType="other" />);

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Warehouse, Store')).toBeInTheDocument();
    expect(screen.getByTestId('input-label')).toBeInTheDocument();
  });

  it('calls onTypeSelect when type button is clicked', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    const officeButton = screen.getByText('Office').closest('button');
    fireEvent.click(officeButton!);

    expect(mockOnTypeSelect).toHaveBeenCalledWith('office');
    expect(mockOnTypeSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onShowStreetSuggestions(true) when street input is focused', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    const streetInput = screen.getByPlaceholderText('Enter street address');
    fireEvent.focus(streetInput);

    expect(mockOnShowStreetSuggestions).toHaveBeenCalledWith(true);
  });

  it('calls onShowStreetSuggestions(false) when street input is blurred', async () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    const streetInput = screen.getByPlaceholderText('Enter street address');
    fireEvent.blur(streetInput);

    // Wait for the setTimeout delay (200ms)
    await waitFor(
      () => {
        expect(mockOnShowStreetSuggestions).toHaveBeenCalledWith(false);
      },
      { timeout: 300 },
    );
  });

  it('does not show custom label input when type is not "other"', () => {
    render(<AddressDetailsStep {...getDefaultProps()} watchedAddressType="home" />);

    expect(screen.queryByText('Custom Label')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g., Warehouse, Store')).not.toBeInTheDocument();
  });

  it('renders default address checkbox', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    expect(screen.getByText('Set as default address')).toBeInTheDocument();
    expect(screen.getByText('Use this address for future orders')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders map preview placeholder', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    expect(screen.getByText('View on Map')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Pin Location')).toBeInTheDocument();
  });

  it('applies error styling to street input when there is an error', () => {
    mockForm.formState.errors = {
      street: { message: 'Street is required', type: 'required' },
    };

    render(<AddressDetailsStep {...getDefaultProps()} />);

    const streetInput = screen.getByPlaceholderText('Enter street address');
    expect(streetInput).toHaveClass('border-red-300');
  });

  it('does not show address preview when addressPreview is empty', () => {
    render(<AddressDetailsStep {...getDefaultProps()} addressPreview="" />);

    expect(screen.queryByText('Full Address')).not.toBeInTheDocument();
  });

  it('renders multiple suggestions correctly', () => {
    const suggestions = ['Street A', 'Street B', 'Street C', 'Street D'];
    render(
      <AddressDetailsStep
        {...getDefaultProps()}
        showStreetSuggestions={true}
        filteredStreetSuggestions={suggestions}
      />,
    );

    suggestions.forEach((suggestion) => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('calls onTypeSelect with correct value for each address type', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    const homeButton = screen.getByText('Home').closest('button');
    const officeButton = screen.getByText('Office').closest('button');
    const otherButton = screen.getByText('Other').closest('button');

    fireEvent.click(homeButton!);
    expect(mockOnTypeSelect).toHaveBeenCalledWith('home');

    fireEvent.click(officeButton!);
    expect(mockOnTypeSelect).toHaveBeenCalledWith('office');

    fireEvent.click(otherButton!);
    expect(mockOnTypeSelect).toHaveBeenCalledWith('other');

    expect(mockOnTypeSelect).toHaveBeenCalledTimes(3);
  });

  it('shows error message for custom label when type is "other" and has error', () => {
    const labelError = 'Label is too long';
    mockForm.formState.errors = {
      label: { message: labelError, type: 'maxLength' },
    };

    render(<AddressDetailsStep {...getDefaultProps()} watchedAddressType="other" />);

    expect(screen.getByText(labelError)).toBeInTheDocument();
  });

  it('registers all form fields correctly', () => {
    render(<AddressDetailsStep {...getDefaultProps()} />);

    expect(mockForm.register).toHaveBeenCalledWith('street');
    expect(mockForm.register).toHaveBeenCalledWith('addressType');
    expect(mockForm.register).toHaveBeenCalledWith('isDefault');
  });

  it('registers label field when address type is "other"', () => {
    render(<AddressDetailsStep {...getDefaultProps()} watchedAddressType="other" />);

    expect(mockForm.register).toHaveBeenCalledWith('label');
  });
});
