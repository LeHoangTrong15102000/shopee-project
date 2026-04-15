import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ProductFormPage from './ProductFormPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
let mockParams: Record<string, string> = {}
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams }
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
})
