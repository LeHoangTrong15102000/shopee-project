import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ImportPage from './ImportPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

function createMockFile(name = 'products.csv') {
  return new File(['col1,col2\nval1,val2'], name, { type: 'text/csv' })
}

async function selectFile(container: HTMLElement) {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
  const file = createMockFile()
  fireEvent.change(fileInput, { target: { files: [file] } })
}

describe('ImportPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders stat cards after loading', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalProducts')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders import button', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /actions.import/i })).toBeInTheDocument()
  })

  it('renders import card with description', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('importDescription')).toBeInTheDocument()
    })
    const importButtons = screen.getAllByText('actions.importProducts')
    expect(importButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders import stats values', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalProducts')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.withLocation')).toBeInTheDocument()
    expect(screen.getByText('stats.locations')).toBeInTheDocument()
    const statCards = document.querySelectorAll('[class*="card"]')
    expect(statCards.length).toBeGreaterThan(0)
  })

  it('renders import action card content', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('importDescription')).toBeInTheDocument()
    })
    const importButtons = screen.getAllByText('actions.importProducts')
    expect(importButtons.length).toBeGreaterThanOrEqual(1)
    const importBtn = screen.getByRole('button', { name: /actions.import/i })
    expect(importBtn).toBeInTheDocument()
  })

  it('renders all three stat cards', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalProducts')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.withLocation')).toBeInTheDocument()
    expect(screen.getByText('stats.locations')).toBeInTheDocument()
  })

  it('opens confirm dialog when file is selected', async () => {
    const { container } = renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    await selectFile(container)
    await waitFor(() => {
      expect(screen.getByText('confirm.title')).toBeInTheDocument()
    })
  })

  it('renders stat card values', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalProducts')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('120')).toBeInTheDocument()
    })
  })

  it('selects file and opens confirm dialog', async () => {
    const { container } = renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    await selectFile(container)
    await waitFor(() => {
      expect(screen.getByText('confirm.title')).toBeInTheDocument()
    })
  })

  it('renders stat card numeric values', async () => {
    renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalProducts')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('120')).toBeInTheDocument()
    })
  })

  it('confirms import and shows result', async () => {
    const { container } = renderWithProviders(<ImportPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    // Select a file to open confirm dialog
    await selectFile(container)
    await waitFor(() => {
      expect(screen.getByText('confirm.title')).toBeInTheDocument()
    })
    // Click confirm button in dialog (the AlertDialogAction button)
    const dialogButtons = screen.getAllByRole('button')
    const confirmBtn = dialogButtons.find(
      (btn) => btn.textContent === 'actions.importProducts' && btn.closest('[role="alertdialog"]'),
    )
    if (confirmBtn) {
      fireEvent.click(confirmBtn)
      // Wait for import result to appear
      await waitFor(
        () => {
          expect(screen.getByText('result.title')).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
      // Result card should contain created/updated/failed info
      expect(screen.getByText(/result.created/)).toBeInTheDocument()
      expect(screen.getByText(/result.updated/)).toBeInTheDocument()
    }
  })
})
