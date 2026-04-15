import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import InventoryPage from './InventoryPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('InventoryPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders tabs after loading', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders low stock tab content', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    // Low stock tab should be default
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders search input', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/inventory/low-stock`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('can switch to out-of-stock tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const outOfStockTab = screen.getByRole('tab', { name: /outOfStockCount/i })
    await user.click(outOfStockTab)
    expect(outOfStockTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders inventory stats in tab labels', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: /lowStockCount/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /outOfStockCount/i })).toBeInTheDocument()
  })

  it('renders stock quantity in table', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.stock')
  })

  it('renders product names in low stock table', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.product')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders stock quantity values', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
    const cells = screen.getAllByRole('cell')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('renders column headers in table', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.product')).toBeInTheDocument()
    expect(screen.getByText('columns.stock')).toBeInTheDocument()
    expect(screen.getByText('columns.sold')).toBeInTheDocument()
    expect(screen.getByText('columns.price')).toBeInTheDocument()
  })

  it('renders update stock button in table rows', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const updateButtons = screen.getAllByRole('button', { name: /actions.updateStock/i })
      expect(updateButtons.length).toBeGreaterThan(0)
    })
  })

  it('renders out-of-stock tab content', async () => {
    const { user } = renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const outOfStockTab = screen.getByRole('tab', { name: /outOfStockCount/i })
    await user.click(outOfStockTab)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders update stock button in table rows', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const updateButtons = screen.getAllByRole('button', { name: /actions.updateStock/i })
      expect(updateButtons.length).toBeGreaterThan(0)
    })
  })

  it('clicks update stock button opens dialog', async () => {
    const { user } = renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /actions.updateStock/i }).length,
      ).toBeGreaterThan(0)
    })
    const updateButtons = screen.getAllByRole('button', { name: /actions.updateStock/i })
    await user.click(updateButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('actions.newQuantity')).toBeInTheDocument()
    })
  })

  it('renders product price in table', async () => {
    renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.price')).toBeInTheDocument()
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const priceCell = cells.find((cell) => /₫|đ|\d+[.,]\d+/.test(cell.textContent || ''))
      expect(priceCell).toBeTruthy()
    })
  })

  it('opens update stock dialog when row button clicked', async () => {
    const { user } = renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /actions.updateStock/i }).length,
      ).toBeGreaterThan(0)
    })
    const updateButtons = screen.getAllByRole('button', { name: /actions.updateStock/i })
    await user.click(updateButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('actions.newQuantity')).toBeInTheDocument()
    })
  })

  it('fills quantity in update stock dialog', async () => {
    const { user } = renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /actions.updateStock/i }).length,
      ).toBeGreaterThan(0)
    })
    const updateButtons = screen.getAllByRole('button', { name: /actions.updateStock/i })
    await user.click(updateButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const quantityInput = screen.getByLabelText('actions.newQuantity')
    await user.clear(quantityInput)
    await user.type(quantityInput, '50')
    expect(quantityInput).toHaveValue(50)
  })

  it('submits update stock form', async () => {
    const { user } = renderWithProviders(<InventoryPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /actions.updateStock/i }).length,
      ).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByRole('button', { name: /actions.updateStock/i })[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const quantityInput = screen.getByLabelText('actions.newQuantity')
    await user.clear(quantityInput)
    await user.type(quantityInput, '100')
    const submitBtn = screen.getByRole('button', { name: /buttons.update/i })
    await user.click(submitBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
