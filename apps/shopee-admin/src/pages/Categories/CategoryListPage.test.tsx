import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import CategoryListPage from './CategoryListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('CategoryListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders category table after loading', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with add category button', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /actions.addCategory/i })).toBeInTheDocument()
  })

  it('renders search input', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/categories`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('opens create category dialog when add button clicked', async () => {
    const { user } = renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addBtn = screen.getByRole('button', { name: /actions.addCategory/i })
    await user.click(addBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('form.name')).toBeInTheDocument()
    })
  })

  it('renders category names in table', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('fills and submits create category form', async () => {
    const { user } = renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addBtn = screen.getByRole('button', { name: /actions.addCategory/i })
    await user.click(addBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const nameInput = screen.getByLabelText('form.name')
    await user.type(nameInput, 'New Test Category')
    const createBtn = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders category ID column header', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.id')).toBeInTheDocument()
  })

  it('renders edit and delete buttons in table rows', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /aria.editItem/i })
      const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
      expect(editButtons.length).toBeGreaterThan(0)
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })

  it('renders column headers', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.name')).toBeInTheDocument()
    expect(screen.getByText('columns.id')).toBeInTheDocument()
  })

  it('renders edit and delete action buttons in rows', async () => {
    renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /aria.editItem/i })
      const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
      expect(editButtons.length).toBeGreaterThan(0)
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })

  it('submits create category form', async () => {
    const { user } = renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addBtn = screen.getByRole('button', { name: /actions.addCategory/i })
    await user.click(addBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const nameInput = screen.getByLabelText('form.name')
    await user.type(nameInput, 'Test Category')
    const createBtn = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('clicks edit button opens edit dialog', async () => {
    const { user } = renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.editItem/i }).length).toBeGreaterThan(0)
    })
    const editButtons = screen.getAllByRole('button', { name: /aria.editItem/i })
    await user.click(editButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('actions.editCategory')).toBeInTheDocument()
    })
  })

  it('clicks delete button opens confirm dialog', async () => {
    const { user } = renderWithProviders(<CategoryListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.deleteItem/i }).length).toBeGreaterThan(0)
    })
    const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByText('toast.deleteTitle')).toBeInTheDocument()
    })
  })
})
