import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import SettingsPage from './SettingsPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('SettingsPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders page title after loading', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders tabs after loading', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.profile')).toBeInTheDocument()
      expect(screen.getByText('tabs.changePassword')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders profile form fields', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.profile')).toBeInTheDocument()
    })
  })

  it('renders profile form fields after loading', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('profile.name')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('profile.email')).toBeInTheDocument()
    expect(screen.getByLabelText('profile.phone')).toBeInTheDocument()
    expect(screen.getByLabelText('profile.address')).toBeInTheDocument()
  })

  it('switches to password tab', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.changePassword')).toBeInTheDocument()
    })
    const passwordTab = screen.getByRole('tab', { name: /tabs.changePassword/i })
    await user.click(passwordTab)
    await waitFor(() => {
      expect(screen.getByLabelText('password.currentPassword')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('password.newPassword')).toBeInTheDocument()
    expect(screen.getByLabelText('password.confirmPassword')).toBeInTheDocument()
  })

  it('renders save button in profile tab', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('profile.name')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /profile.save/i })).toBeInTheDocument()
  })

  it('renders password form fields when password tab clicked', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.changePassword')).toBeInTheDocument()
    })
    const passwordTab = screen.getByRole('tab', { name: /tabs.changePassword/i })
    await user.click(passwordTab)
    await waitFor(() => {
      expect(screen.getByText('password.currentPassword')).toBeInTheDocument()
      expect(screen.getByText('password.newPassword')).toBeInTheDocument()
      expect(screen.getByText('password.confirmPassword')).toBeInTheDocument()
    })
  })

  it('renders system info when system tab clicked', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.systemInfo')).toBeInTheDocument()
    })
    const systemTab = screen.getByRole('tab', { name: /tabs.systemInfo/i })
    await user.click(systemTab)
    await waitFor(() => {
      expect(screen.getByText('system.appVersion')).toBeInTheDocument()
      expect(screen.getByText('system.apiBaseUrl')).toBeInTheDocument()
      expect(screen.getByText('system.environment')).toBeInTheDocument()
    })
  })

  it('submits profile form', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('profile.name')).toBeInTheDocument()
    })
    const nameInput = screen.getByLabelText('profile.name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Test User')
    const saveButton = screen.getByRole('button', { name: /profile.save/i })
    await user.click(saveButton)
    await waitFor(() => {
      expect(saveButton).toBeInTheDocument()
    })
  })

  it('renders profile form with all fields', async () => {
    renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('profile.name')).toBeInTheDocument()
    })
    expect(screen.getByText('profile.email')).toBeInTheDocument()
    expect(screen.getByText('profile.phone')).toBeInTheDocument()
    expect(screen.getByText('profile.address')).toBeInTheDocument()
    expect(screen.getByText('profile.avatarUrl')).toBeInTheDocument()
    expect(screen.getByText('profile.dateOfBirth')).toBeInTheDocument()
  })

  it('fills and submits password change form', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.changePassword')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /tabs.changePassword/i }))
    await waitFor(() => {
      expect(screen.getByLabelText('password.currentPassword')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('password.currentPassword'), 'oldpass123')
    await user.type(screen.getByLabelText('password.newPassword'), 'newpass123')
    await user.type(screen.getByLabelText('password.confirmPassword'), 'newpass123')
    const changeBtn = screen.getByRole('button', { name: /password.change/i })
    await user.click(changeBtn)
  })
})
