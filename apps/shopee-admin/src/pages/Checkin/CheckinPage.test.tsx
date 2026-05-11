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

  it('renders overview tab by default', async () => {
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.overview.label')).toBeInTheDocument()
    })
    expect(screen.getByText('tabs.users.label')).toBeInTheDocument()
    expect(screen.getByText('tabs.leaderboard.label')).toBeInTheDocument()
  })

  it('renders users table after clicking users tab', async () => {
    const { user } = renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.users.label')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.users.label'))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders users table column headers', async () => {
    const { user } = renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.users.label')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.users.label'))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('tabs.users.columns.user')).toBeInTheDocument()
    expect(screen.getByText('tabs.users.columns.currentStreak')).toBeInTheDocument()
    expect(screen.getByText('tabs.users.columns.totalCheckins')).toBeInTheDocument()
  })

  it('renders user names in users table', async () => {
    const { user } = renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.users.label')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.users.label'))
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

  it('shows empty state when no daily stats', async () => {
    server.use(
      http.get(`${API_URL}/admin/checkin/daily-stats`, () => {
        return HttpResponse.json({ message: 'Success', data: [] })
      }),
    )
    renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('emptyState')).toBeInTheDocument()
    })
  })

  it('renders leaderboard table after clicking leaderboard tab', async () => {
    const { user } = renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.leaderboard.label')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.leaderboard.label'))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('tabs.leaderboard.columns.user')).toBeInTheDocument()
  })

  it('renders leaderboard user names', async () => {
    const { user } = renderWithProviders(<CheckinPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.leaderboard.label')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.leaderboard.label'))
    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })
  })
})
