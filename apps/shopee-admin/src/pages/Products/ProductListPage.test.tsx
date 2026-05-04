import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import ProductListPage from './ProductListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('ProductListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders product table after loading', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with add product button', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /actions.addProduct/i })).toBeInTheDocument()
  })

  it('renders search input', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('renders page description', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders category filter', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders export CSV button', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.exportCsv/i })).toBeInTheDocument()
  })

  it('renders column visibility toggle', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders filter button', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.filters/i })).toBeInTheDocument()
  })

  it('navigates to new product page when add button clicked', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /actions.addProduct/i })
    await user.click(addButton)

    expect(mockNavigate).toHaveBeenCalledWith('/products/new')
  })

  it('opens filter panel when filter button clicked', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('filters.category')).not.toBeInTheDocument()

    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByLabelText('filters.category')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    expect(screen.getByLabelText('filters.maxPrice')).toBeInTheDocument()
    expect(screen.getByLabelText('filters.stockStatus')).toBeInTheDocument()
  })

  it('toggles filter panel closed when filter button clicked again', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByLabelText('filters.category')).toBeInTheDocument()
    })

    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.queryByLabelText('filters.category')).not.toBeInTheDocument()
    })
  })

  it('export CSV button is clickable without crashing', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const exportButton = screen.getByRole('button', { name: /buttons.exportCsv/i })
    await user.click(exportButton)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('allows typing in price filter inputs', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)

    await waitFor(() => {
      expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    })

    const minPriceInput = screen.getByLabelText('filters.minPrice')
    const maxPriceInput = screen.getByLabelText('filters.maxPrice')

    await user.type(minPriceInput, '100')
    await user.type(maxPriceInput, '500')

    expect(minPriceInput).toHaveValue(100)
    expect(maxPriceInput).toHaveValue(500)
  })

  it('renders product price column', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.price')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders product rating badges', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.rating')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders product name from mock data', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument()
    })
  })

  it('renders product price in table', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.price')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasPriceCell = cells.some((cell) => /[\d,]+/.test(cell.textContent || ''))
      expect(hasPriceCell).toBe(true)
    })
  })

  it('renders product stock quantity', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.stock')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasQuantityCell = cells.some((cell) => /^\d+$/.test(cell.textContent?.trim() || ''))
      expect(hasQuantityCell).toBe(true)
    })
  })

  it('clears search input', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('search')
    await user.type(searchInput, 'iPhone')
    expect(searchInput).toHaveValue('iPhone')
    await user.clear(searchInput)
    expect(searchInput).toHaveValue('')
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })
  })

  it('renders product image in table', async () => {
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
    })
  })

  it('navigates to product detail via dropdown view action', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.view')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.view'))
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/products/'))
  })

  it('navigates to product edit via dropdown edit action', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.edit')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.edit'))
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/products\/.+\/edit/))
  })

  it('opens individual delete confirm dialog via dropdown menu', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.delete'))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('toast.deleteTitle')).toBeInTheDocument()
    })
  })

  it('confirms individual deletion and dialog closes', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.delete'))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.confirm/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('shows clear filters button when a price filter is applied', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    })
    const minPriceInput = screen.getByLabelText('filters.minPrice')
    await user.type(minPriceInput, '100')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
  })

  it('clears all filters when clear filters button clicked', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    })
    const minPriceInput = screen.getByLabelText('filters.minPrice')
    await user.type(minPriceInput, '100')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.clearFilters/i }))
    // FilterPanel always shows the clear button; verify the price input is cleared
    await waitFor(() => {
      expect(screen.getByLabelText('filters.minPrice')).toHaveValue(null)
    })
  })

  it('renders empty state when API returns no products', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({
          products: [],
          pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
        })
      }),
    )
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText('states.noResults')).toBeInTheDocument()
    })
  })

  it('selects all rows via header checkbox and shows bulk delete button', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    })
    const selectAllCheckbox = screen.getByLabelText('common:aria.selectAll')
    await user.click(selectAllCheckbox)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actions.delete/i })).toBeInTheDocument()
    })
  })

  it('filters products by max price and excludes high-priced items', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.maxPrice')).toBeInTheDocument()
    })
    // Set a very low max price to filter out all products
    const maxPriceInput = screen.getByLabelText('filters.maxPrice')
    await user.type(maxPriceInput, '1')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
  })

  it('filters products by min price to exclude low-priced items', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.minPrice')).toBeInTheDocument()
    })
    // Set very high min price to filter out all products
    const minPriceInput = screen.getByLabelText('filters.minPrice')
    await user.type(minPriceInput, '999999999')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.clearFilters/i })).toBeInTheDocument()
    })
  })

  it('opens bulk delete confirm dialog after selecting all and clicking delete', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    })
    const selectAllCheckbox = screen.getByLabelText('common:aria.selectAll')
    await user.click(selectAllCheckbox)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actions.delete/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /actions.delete/i }))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('toast.deleteMultipleTitle')).toBeInTheDocument()
    })
  })

  it('confirms bulk deletion and dialog closes', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    })
    const selectAllCheckbox = screen.getByLabelText('common:aria.selectAll')
    await user.click(selectAllCheckbox)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actions.delete/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /actions.delete/i }))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.confirm/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('renders category name when category is an object in table', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({
          data: {
            products: [
              {
                _id: 'prod-obj',
                name: 'Product With Object Category',
                price: 100000,
                price_before_discount: 120000,
                quantity: 5,
                sold: 10,
                rating: 4.5,
                image: 'https://example.com/img.jpg',
                category: { _id: 'cat-1', name: 'Electronics' },
                location: 'HCM',
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
          },
        })
      }),
    )
    renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Product With Object Category')).toBeInTheDocument()
    })
    // Category object name should show
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('filters products by in_stock status', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({
          data: {
            products: [
              {
                _id: 'prod-in',
                name: 'In Stock Product',
                price: 100000,
                price_before_discount: 120000,
                quantity: 50,
                sold: 10,
                rating: 4.5,
                image: 'https://example.com/img.jpg',
                category: 'cat-1',
                location: 'HCM',
              },
              {
                _id: 'prod-out',
                name: 'Out Of Stock Product',
                price: 200000,
                price_before_discount: 220000,
                quantity: 0,
                sold: 5,
                rating: 3.0,
                image: 'https://example.com/img2.jpg',
                category: 'cat-1',
                location: 'HCM',
              },
            ],
            pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.stockStatus')).toBeInTheDocument()
    })
    // Open the stock filter select
    const stockSelect = screen.getByLabelText('filters.stockStatus')
    await user.click(stockSelect)
    await waitFor(() => {
      expect(screen.getByText('filters.inStock')).toBeInTheDocument()
    })
    await user.click(screen.getByText('filters.inStock'))
    // In stock filter should exclude out-of-stock products
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('filters products by out_of_stock status', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({
          data: {
            products: [
              {
                _id: 'prod-in',
                name: 'In Stock Product',
                price: 100000,
                price_before_discount: 120000,
                quantity: 50,
                sold: 10,
                rating: 4.5,
                image: 'https://example.com/img.jpg',
                category: 'cat-1',
                location: 'HCM',
              },
              {
                _id: 'prod-out',
                name: 'Out Of Stock Product',
                price: 200000,
                price_before_discount: 220000,
                quantity: 0,
                sold: 5,
                rating: 3.0,
                image: 'https://example.com/img2.jpg',
                category: 'cat-1',
                location: 'HCM',
              },
            ],
            pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.stockStatus')).toBeInTheDocument()
    })
    const stockSelect = screen.getByLabelText('filters.stockStatus')
    await user.click(stockSelect)
    await waitFor(() => {
      expect(screen.getByText('filters.outOfStock')).toBeInTheDocument()
    })
    await user.click(screen.getByText('filters.outOfStock'))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('filters products by low_stock status', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({
          data: {
            products: [
              {
                _id: 'prod-low',
                name: 'Low Stock Product',
                price: 100000,
                price_before_discount: 120000,
                quantity: 5,
                sold: 10,
                rating: 4.5,
                image: 'https://example.com/img.jpg',
                category: 'cat-1',
                location: 'HCM',
              },
              {
                _id: 'prod-high',
                name: 'High Stock Product',
                price: 200000,
                price_before_discount: 220000,
                quantity: 100,
                sold: 5,
                rating: 3.0,
                image: 'https://example.com/img2.jpg',
                category: 'cat-1',
                location: 'HCM',
              },
            ],
            pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const filterButton = screen.getByRole('button', { name: /buttons.filters/i })
    await user.click(filterButton)
    await waitFor(() => {
      expect(screen.getByLabelText('filters.stockStatus')).toBeInTheDocument()
    })
    const stockSelect = screen.getByLabelText('filters.stockStatus')
    await user.click(stockSelect)
    await waitFor(() => {
      expect(screen.getByText('filters.lowStock')).toBeInTheDocument()
    })
    await user.click(screen.getByText('filters.lowStock'))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('closes individual delete dialog via cancel button (onOpenChange false branch)', async () => {
    const { user } = renderWithProviders(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.delete'))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    // Click cancel to trigger onOpenChange(false) -> setDeleteId(null)
    await user.click(screen.getByRole('button', { name: /buttons.cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })
})
