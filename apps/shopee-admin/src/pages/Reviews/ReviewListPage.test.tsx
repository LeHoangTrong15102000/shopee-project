import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ReviewListPage from './ReviewListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('ReviewListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders review table after loading', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with title', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders stat cards', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders search input', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders review stat cards with data', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalReviews')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.averageRating')).toBeInTheDocument()
  })

  it('renders rating column in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders review comment text in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.comment')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders moderation status badges', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.moderation')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders review comment in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm rất tốt, giao hàng nhanh')).toBeInTheDocument()
    })
  })

  it('renders review rating in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.rating')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasRatingCell = cells.some((cell) => /[1-5]/.test(cell.textContent || ''))
      expect(hasRatingCell).toBe(true)
    })
  })

  it('renders review stat card values', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalReviews')).toBeInTheDocument()
    })
    await waitFor(() => {
      const statCards = document.querySelectorAll('[class*="card"]')
      expect(statCards.length).toBeGreaterThan(0)
      expect(screen.getByText('stats.averageRating')).toBeInTheDocument()
    })
  })

  it('renders five star reviews stat', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.fiveStarReviews')).toBeInTheDocument()
    })
  })
})
