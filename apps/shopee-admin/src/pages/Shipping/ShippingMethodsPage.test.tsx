import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ShippingMethodsPage from './ShippingMethodsPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('ShippingMethodsPage', () => {
  it('renders page header', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders shipping methods table after loading', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders column headers', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.name')).toBeInTheDocument()
    expect(screen.getByText('columns.price')).toBeInTheDocument()
    expect(screen.getByText('columns.status')).toBeInTheDocument()
  })

  it('renders active/inactive badges', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByText('active').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/shipping-methods`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    server.use(
      http.get(`${API_URL}/admin/shipping-methods`, () => {
        return HttpResponse.json({ message: 'Success', data: [] })
      }),
    )
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByText('states.noResults')).toBeInTheDocument()
    })
  })

  it('renders description column with fallback', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.description')).toBeInTheDocument()
  })

  it('renders estimated days column', async () => {
    renderWithProviders(<ShippingMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.estimatedDays')).toBeInTheDocument()
  })
})
