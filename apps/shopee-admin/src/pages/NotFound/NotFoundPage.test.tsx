import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import NotFoundPage from './NotFoundPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('NotFoundPage', () => {
  it('renders 404 message', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByText('notFound.title')).toBeInTheDocument()
  })

  it('renders dashboard button', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByRole('button', { name: 'notFound.goToDashboard' })).toBeInTheDocument()
  })

  it('renders description text', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByText('notFound.description')).toBeInTheDocument()
  })

  it('navigates to dashboard when button clicked', async () => {
    const { user } = renderWithProviders(<NotFoundPage />)
    await user.click(screen.getByRole('button', { name: 'notFound.goToDashboard' }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
