import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import NotificationListPage from './NotificationListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('NotificationListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders notification table after loading', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with title', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders create notification buttons', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /tabs.targeted/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tabs.broadcast/i })).toBeInTheDocument()
  })

  it('renders page description', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/notifications`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders search input', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search.placeholder')).toBeInTheDocument()
  })

  it('opens targeted notification dialog when targeted button clicked', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('form.userId')).toBeInTheDocument()
      expect(screen.getByLabelText('form.title')).toBeInTheDocument()
    })
  })

  it('opens broadcast notification dialog when broadcast button clicked', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('form.title')).toBeInTheDocument()
      expect(screen.getByLabelText('form.message')).toBeInTheDocument()
    })
  })

  it('fills targeted notification form', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const titleInput = screen.getByLabelText('form.title')
    const messageInput = screen.getByLabelText('form.message')
    await user.type(titleInput, 'Test Notification')
    await user.type(messageInput, 'Test message content')
    expect(titleInput).toHaveValue('Test Notification')
    expect(messageInput).toHaveValue('Test message content')
  })

  it('renders notification type badges', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.type')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('submits targeted notification form', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.userId'), 'user-123')
    await user.type(screen.getByLabelText('form.title'), 'Test Notification Title')
    await user.type(screen.getByLabelText('form.message'), 'Test notification message content')
    // Select a notification type (required field)
    const typeSelect = screen.getByRole('combobox', { name: /form.type/i })
    await user.click(typeSelect)
    await waitFor(() => {
      expect(screen.getByText('form.typeOptions.order')).toBeInTheDocument()
    })
    await user.click(screen.getByText('form.typeOptions.order'))
    const sendBtn = screen.getByRole('button', { name: /buttons.send/i })
    await user.click(sendBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows validation error when submitting targeted form without type', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.userId'), 'user-123')
    await user.type(screen.getByLabelText('form.title'), 'Test Title')
    await user.type(screen.getByLabelText('form.message'), 'Test message')
    const sendBtn = screen.getByRole('button', { name: /buttons.send/i })
    await user.click(sendBtn)
    await waitFor(() => {
      expect(screen.getByText('form.typeRequired')).toBeInTheDocument()
    })
    // Dialog should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders notification title column header in table', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.title')
  })

  it('fills broadcast notification form', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const titleInput = screen.getByLabelText('form.title')
    const messageInput = screen.getByLabelText('form.message')
    await user.type(titleInput, 'Broadcast Title')
    await user.type(messageInput, 'Broadcast message content')
    expect(titleInput).toHaveValue('Broadcast Title')
    expect(messageInput).toHaveValue('Broadcast message content')
  })

  it('renders notification date column header in table', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.date')
  })

  it('opens delete notification confirm dialog via dropdown menu', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
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
  })

  it('confirms delete notification and dialog closes', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
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

  it('shows mark as read action for unread notifications', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.markAsRead')).toBeInTheDocument()
    })
  })

  it('clicks mark as read action', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.markAsRead')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.markAsRead'))
  })

  it('submits broadcast notification form and dialog closes', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.title'), 'Broadcast Title')
    await user.type(screen.getByLabelText('form.message'), 'Broadcast message content')
    // Select a notification type (required field)
    const typeSelect = screen.getByRole('combobox', { name: /form.type/i })
    await user.click(typeSelect)
    await waitFor(() => {
      expect(screen.getByText('form.typeOptions.promotion')).toBeInTheDocument()
    })
    await user.click(screen.getByText('form.typeOptions.promotion'))
    const sendBtn = screen.getByRole('button', { name: /buttons.send/i })
    await user.click(sendBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders empty state when API returns no notifications', async () => {
    server.use(
      http.get(`${API_URL}/admin/notifications`, () => {
        return HttpResponse.json({
          data: { notifications: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
        })
      }),
    )
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('states.noResults')).toBeInTheDocument()
    })
  })

  it('does not show mark as read for already-read notifications', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    // notif-3 and notif-4 are is_read: true — click their action menus
    const actionBtns = screen.getAllByLabelText('common:aria.actions')
    // Click the 3rd action button (notif-3 is is_read: true)
    if (actionBtns.length >= 3) {
      await user.click(actionBtns[2])
      await waitFor(() => {
        expect(screen.getByText('actions.delete')).toBeInTheDocument()
      })
      // Mark as read should NOT appear for read notifications
      expect(screen.queryByText('actions.markAsRead')).not.toBeInTheDocument()
    }
  })

  it('selects a non-custom template in broadcast dialog and prefills form', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    // The template select should be visible in broadcast mode
    const templateSelect = screen.getByRole('combobox', { name: /form.template/i })
    await user.click(templateSelect)
    await waitFor(() => {
      expect(screen.getByText('form.templates.maintenance')).toBeInTheDocument()
    })
    await user.click(screen.getByText('form.templates.maintenance'))
    // After selecting a non-custom template, title and message should be prefilled
    await waitFor(() => {
      const titleInput = screen.getByLabelText('form.title')
      expect(titleInput).toHaveValue('form.templates.maintenanceTitle')
    })
  })

  it('selects custom template in broadcast dialog and clears form', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    // First select a non-custom template to fill the form
    const templateSelect = screen.getByRole('combobox', { name: /form.template/i })
    await user.click(templateSelect)
    await waitFor(() => {
      expect(screen.getByText('form.templates.maintenance')).toBeInTheDocument()
    })
    await user.click(screen.getByText('form.templates.maintenance'))
    await waitFor(() => {
      expect(screen.getByLabelText('form.title')).toHaveValue('form.templates.maintenanceTitle')
    })
    // Now select custom to clear the form
    await user.click(screen.getByRole('combobox', { name: /form.template/i }))
    await waitFor(() => {
      expect(screen.getByText('form.custom')).toBeInTheDocument()
    })
    await user.click(screen.getByText('form.custom'))
    await waitFor(() => {
      expect(screen.getByLabelText('form.title')).toHaveValue('')
    })
  })

  it('closes broadcast dialog when onOpenChange is called with false', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('closes targeted dialog when onOpenChange is called with false', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('cancels delete notification dialog', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
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
    await user.click(screen.getByRole('button', { name: /buttons.cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })
})
