import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import PaymentMethodsPage from './PaymentMethodsPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('PaymentMethodsPage', () => {
  it('renders page header', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders payment methods table after loading', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders column headers', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.name')).toBeInTheDocument()
    expect(screen.getByText('columns.type')).toBeInTheDocument()
    expect(screen.getByText('columns.status')).toBeInTheDocument()
  })

  it('renders enabled/disabled badges', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByText('active').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/payment-methods`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    server.use(
      http.get(`${API_URL}/admin/payment-methods`, () => {
        return HttpResponse.json({ message: 'Success', data: [] })
      }),
    )
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByText('states.noResults')).toBeInTheDocument()
    })
  })

  it('renders description column', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.description')).toBeInTheDocument()
  })

  it('shows disabled badge for inactive methods', async () => {
    renderWithProviders(<PaymentMethodsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('inactive')).toBeInTheDocument()
    })
  })
})
