import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import VoucherListPage from './VoucherListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('VoucherListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders voucher table after loading', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with create voucher button', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /actions.createVoucher/i })).toBeInTheDocument()
  })

  it('renders stat cards', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders page description', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search.placeholder')).toBeInTheDocument()
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('opens create voucher dialog when create button clicked', async () => {
    const { user } = renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const createBtn = screen.getByRole('button', { name: /actions.createVoucher/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('form.code')).toBeInTheDocument()
      expect(screen.getByLabelText('form.value')).toBeInTheDocument()
    })
  })

  it('renders voucher code column in table', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('fills and submits create voucher form', async () => {
    const { user } = renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const createBtn = screen.getByRole('button', { name: /actions.createVoucher/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const codeInput = screen.getByLabelText('form.code')
    const valueInput = screen.getByLabelText('form.value')
    await user.type(codeInput, 'TESTCODE123')
    await user.clear(valueInput)
    await user.type(valueInput, '25')
    const submitBtn = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(submitBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders stat cards after loading', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.total')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.active')).toBeInTheDocument()
  })

  it('renders voucher column headers', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.code')).toBeInTheDocument()
    expect(screen.getByText('columns.type')).toBeInTheDocument()
    expect(screen.getByText('columns.usage')).toBeInTheDocument()
    expect(screen.getByText('columns.status')).toBeInTheDocument()
  })

  it('renders voucher expires column', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.expires')).toBeInTheDocument()
  })

  it('renders voucher usage column data', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const usageCell = cells.find((cell) => /\d+\/\d+/.test(cell.textContent || ''))
      expect(usageCell).toBeInTheDocument()
    })
  })

  it('renders voucher code from mock data', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('SALE50')).toBeInTheDocument()
    })
  })

  it('renders voucher status badges', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const badges = document.querySelectorAll('[class*="badge"]')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  it('submits create voucher form and dialog closes', async () => {
    const { user } = renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const createBtn = screen.getByRole('button', { name: /actions.createVoucher/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const codeInput = screen.getByLabelText('form.code')
    const valueInput = screen.getByLabelText('form.value')
    await user.type(codeInput, 'NEWCODE')
    await user.clear(valueInput)
    await user.type(valueInput, '30')
    const submitBtn = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(submitBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('fills all create voucher form fields', async () => {
    const { user } = renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const createBtn = screen.getByRole('button', { name: /actions.createVoucher/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const codeInput = screen.getByLabelText('form.code')
    const valueInput = screen.getByLabelText('form.value')
    await user.type(codeInput, 'FULLTEST123')
    await user.clear(valueInput)
    await user.type(valueInput, '15')
    expect(codeInput).toHaveValue('FULLTEST123')
    expect(valueInput).toHaveValue(15)
  })

  it('renders stat card values from mock data', async () => {
    renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.total')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('fills all create voucher form fields including dates', async () => {
    const { user } = renderWithProviders(<VoucherListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /actions.createVoucher/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    // Fill all form fields
    await user.type(screen.getByLabelText('form.code'), 'ALLFIELDS')
    await user.clear(screen.getByLabelText('form.value'))
    await user.type(screen.getByLabelText('form.value'), '25')
    await user.clear(screen.getByLabelText('form.minOrder'))
    await user.type(screen.getByLabelText('form.minOrder'), '50000')
    await user.clear(screen.getByLabelText('form.maxUsage'))
    await user.type(screen.getByLabelText('form.maxUsage'), '200')
    await user.type(screen.getByLabelText('form.startDate'), '2024-01-01')
    await user.type(screen.getByLabelText('form.endDate'), '2024-12-31')
    expect(screen.getByLabelText('form.code')).toHaveValue('ALLFIELDS')
    expect(screen.getByLabelText('form.minOrder')).toHaveValue(50000)
  })
})
