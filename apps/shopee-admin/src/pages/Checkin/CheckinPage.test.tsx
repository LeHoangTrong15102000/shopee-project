import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import CheckinPage from './CheckinPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('CheckinPage', () => {
  it('renders page header', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders stat cards with data', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalToday')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.activeStreaks')).toBeInTheDocument()
  })

  it('renders stat card values', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders activity table', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders activity table column headers', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('activity.columns.user')).toBeInTheDocument()
    expect(screen.getByText('activity.columns.streak')).toBeInTheDocument()
    expect(screen.getByText('activity.columns.pointsEarned')).toBeInTheDocument()
  })

  it('renders activity title', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('activity.title')).toBeInTheDocument()
    })
  })

  it('renders user names in activity table', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })
  })

  it('shows backend required state on 404', async () => {
    server.use(
      http.get(`${API_URL}/admin/checkin`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('backendRequired')).toBeInTheDocument()
    })
  })

  it('shows backend required state on 403', async () => {
    server.use(
      http.get(`${API_URL}/admin/checkin`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      }),
    )
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('backendRequired')).toBeInTheDocument()
    })
  })

  it('shows error state on other API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/checkin`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no activity', async () => {
    server.use(
      http.get(`${API_URL}/admin/checkin`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: { total_today: 0, active_streaks: 0, recent_activity: [] },
        })
      }),
    )
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('emptyState')).toBeInTheDocument()
    })
  })

  it('renders date column in activity table', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('activity.columns.date')).toBeInTheDocument()
  })

  it('renders user ID fallback when user is a string', async () => {
    server.use(
      http.get(`${API_URL}/admin/checkin`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            total_today: 1,
            active_streaks: 1,
            recent_activity: [
              {
                _id: 'checkin-str',
                user: 'user-id-string',
                streak: 1,
                points_earned: 10,
                createdAt: '2024-01-15T08:00:00.000Z',
              },
            ],
          },
        })
      }),
    )
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('d-string')).toBeInTheDocument()
    })
  })
})
