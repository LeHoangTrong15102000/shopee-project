import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ProductFormPage from './ProductFormPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
let mockParams: Record<string, string> = {}
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams }
})

// Mock base-ui Select with a native <select> so onValueChange can be triggered in jsdom
vi.mock('src/components/ui/select', async () => {
  const React = await import('react')
  const SelectContext = React.createContext<{ onValueChange?: (v: string) => void }>({})
  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: React.ReactNode
      onValueChange?: (v: string) => void
      defaultValue?: string
      value?: string
    }) =>
      React.createElement(
        SelectContext.Provider,
        { value: { onValueChange } },
        React.createElement('div', { 'data-testid': 'select-root' }, children),
      ),
    SelectTrigger: ({
      children,
      id,
      ...props
    }: {
      children: React.ReactNode
      id?: string
      [key: string]: unknown
    }) => React.createElement('button', { id, type: 'button', ...props }, children),
    SelectValue: ({ placeholder }: { placeholder?: string }) =>
      React.createElement('span', null, placeholder),
    SelectContent: ({ children }: { children: React.ReactNode }) => {
      const { onValueChange } = React.useContext(SelectContext)
      return React.createElement(
        React.Fragment,
        null,
        React.createElement('input', {
          type: 'text',
          'data-testid': 'select-native',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValueChange?.(e.target.value),
        }),
        children,
      )
    },
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) =>
      React.createElement('option', { value }, children),
    SelectGroup: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SelectLabel: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SelectSeparator: () => null,
  }
})

describe('ProductFormPage', () => {
  beforeEach(() => {
    mockParams = {}
    mockNavigate.mockClear()
  })

  it('renders form title for create mode', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByText('form.newProduct')).toBeInTheDocument()
    })
  })

  it('renders form fields', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('form.description')).toBeInTheDocument()
  })

  it('renders loading state in edit mode', async () => {
    mockParams = { id: 'prod-1' }
    renderWithProviders(<ProductFormPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders edit title after product loads', async () => {
    mockParams = { id: 'prod-1' }
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByText('form.editProduct')).toBeInTheDocument()
    })
  })

  it('renders category select', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('form.category')).toBeInTheDocument()
  })

  it('renders price and quantity fields', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('form.price')).toBeInTheDocument()
    expect(screen.getByLabelText('form.quantity')).toBeInTheDocument()
  })

  it('renders submit button', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.create/i })).toBeInTheDocument()
  })

  it('renders image URL field', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('form.imageUrl')).toBeInTheDocument()
  })

  it('renders location field', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('form.location')).toBeInTheDocument()
  })

  it('renders price before discount field', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('form.priceBeforeDiscount')).toBeInTheDocument()
  })

  it('renders cancel button and navigates to /products when clicked', async () => {
    const { user } = renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    const cancelButton = screen.getByRole('button', { name: /buttons.cancel/i })
    expect(cancelButton).toBeInTheDocument()
    await user.click(cancelButton)
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('shows name required validation error on empty submit', async () => {
    const { user } = renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    const submitButton = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows image URL required validation error', async () => {
    const { user } = renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.name'), 'Test Product')
    const submitButton = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Image URL is required')).toBeInTheDocument()
    })
  })

  it('submits form successfully in create mode and navigates to /products', async () => {
    const { user } = renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.name'), 'New Test Product')
    await user.type(screen.getByLabelText('form.imageUrl'), 'https://example.com/image.jpg')
    // Use fireEvent.change for number inputs to reliably set valueAsNumber
    fireEvent.change(screen.getByLabelText('form.price'), { target: { value: '10000', valueAsNumber: 10000 } })
    fireEvent.change(screen.getByLabelText('form.quantity'), { target: { value: '5', valueAsNumber: 5 } })
    // Use the native select rendered by our mock to trigger onValueChange
    const nativeSelect = screen.getByTestId('select-native')
    fireEvent.change(nativeSelect, { target: { value: 'cat-1' } })
    const submitButton = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(submitButton)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products')
    })
  })

  it('shows error toast when API call fails in create mode', async () => {
    server.use(
      http.post(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    const { toast } = await import('sonner')
    const { user } = renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.name'), 'New Test Product')
    await user.type(screen.getByLabelText('form.imageUrl'), 'https://example.com/image.jpg')
    // Use fireEvent.change for number inputs to reliably set valueAsNumber
    fireEvent.change(screen.getByLabelText('form.price'), { target: { value: '10000', valueAsNumber: 10000 } })
    fireEvent.change(screen.getByLabelText('form.quantity'), { target: { value: '5', valueAsNumber: 5 } })
    // Use the native select rendered by our mock to trigger onValueChange
    const nativeSelect = screen.getByTestId('select-native')
    fireEvent.change(nativeSelect, { target: { value: 'cat-1' } })
    const submitButton = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(submitButton)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('pre-fills form fields with product data in edit mode', async () => {
    mockParams = { id: 'prod-1' }
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByText('form.editProduct')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toHaveValue('iPhone 15 Pro Max')
    })
    expect(screen.getByLabelText('form.imageUrl')).toHaveValue('https://example.com/iphone.jpg')
  })

  it('renders update button in edit mode', async () => {
    mockParams = { id: 'prod-1' }
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByText('form.editProduct')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.update/i })).toBeInTheDocument()
  })

  it('submits updated form in edit mode and navigates', async () => {
    mockParams = { id: 'prod-1' }
    const { user } = renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('form.name')).toHaveValue('iPhone 15 Pro Max')
    })
    const submitButton = screen.getByRole('button', { name: /buttons.update/i })
    await user.click(submitButton)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products')
    })
  })

  it('renders form card title', async () => {
    renderWithProviders(<ProductFormPage />)
    await waitFor(() => {
      expect(screen.getByText('form.productDetails')).toBeInTheDocument()
    })
  })
})
