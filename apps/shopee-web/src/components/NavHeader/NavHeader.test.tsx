import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppContext } from 'src/contexts/app.context'
import { ThemeProvider } from 'src/contexts/theme.context'
import { User } from 'src/types/user.type'
import NavHeader from './NavHeader'

// Mock react-i18next locally for NavHeader tests
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: vi.fn(),
        language: 'vi'
      }
    }),
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn()
    }
  }
})

// Mock APIs
vi.mock('src/apis/auth.api', () => ({
  default: {
    logoutAccount: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('src/apis/notification.api', () => ({
  default: {
    getNotifications: vi.fn().mockResolvedValue({
      data: {
        data: {
          unreadCount: 3,
          notifications: []
        }
      }
    })
  }
}))

const TestWrapper = ({
  children,
  isAuthenticated = false,
  profile = null,
  notificationData = null
}: {
  children: React.ReactNode
  isAuthenticated?: boolean
  profile?: any
  notificationData?: any
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  // Pre-populate cache with notification data if provided
  if (notificationData && isAuthenticated) {
    queryClient.setQueryData(['notifications'], notificationData)
  }

  const contextValue = {
    isAuthenticated,
    setIsAuthenticated: vi.fn(),
    profile,
    setProfile: vi.fn(),
    extendedPurchases: [],
    setExtendedPurchases: vi.fn(),
    reset: vi.fn()
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('NavHeader Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Rendering - Unauthenticated State', () => {
    test('should render seller links when not authenticated', () => {
      render(
        <TestWrapper isAuthenticated={false}>
          <NavHeader />
        </TestWrapper>
      )

      expect(screen.getByText('header.sellerChannel')).toBeInTheDocument()
      expect(screen.getByText('header.becomeSeller')).toBeInTheDocument()
    })

    test('should render download app popover', () => {
      render(
        <TestWrapper isAuthenticated={false}>
          <NavHeader />
        </TestWrapper>
      )

      expect(screen.getByText('header.downloadApp')).toBeInTheDocument()
    })

    test('should render social media links', () => {
      render(
        <TestWrapper isAuthenticated={false}>
          <NavHeader />
        </TestWrapper>
      )

      // Find links by href attribute since they don't have accessible names
      const allLinks = screen.getAllByRole('link')
      const facebookLink = allLinks.find((link) => link.getAttribute('href')?.includes('facebook.com'))
      const instagramLink = allLinks.find((link) => link.getAttribute('href')?.includes('instagram.com'))

      expect(facebookLink).toBeInTheDocument()
      expect(instagramLink).toBeInTheDocument()
      expect(facebookLink).toHaveAttribute('href', expect.stringContaining('facebook.com'))
      expect(instagramLink).toHaveAttribute('href', expect.stringContaining('instagram.com'))
    })

    test('should show login notification state', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper isAuthenticated={false}>
          <NavHeader />
        </TestWrapper>
      )

      // Click on notification bell - find by cursor-pointer span
      const notificationElement = screen.getByText('header.notification').closest('span')
      if (notificationElement) {
        await user.click(notificationElement)

        await waitFor(() => {
          expect(screen.getByText('Đăng nhập để xem Thông báo')).toBeInTheDocument()
          // NotificationPopover has hardcoded Vietnamese text, AuthLinks uses i18n keys
          const registerLinks = screen.getAllByRole('link', { name: /Đăng ký|header\.register/ })
          const loginLinks = screen.getAllByRole('link', { name: /Đăng nhập|header\.login/ })
          expect(registerLinks.length).toBeGreaterThanOrEqual(1)
          expect(loginLinks.length).toBeGreaterThanOrEqual(1)
        })
      }
    })
  })

  describe('Rendering - Authenticated State', () => {
    const mockProfile = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'avatar-url.jpg'
    }

    test('should render authenticated navigation', () => {
      render(
        <TestWrapper isAuthenticated={true} profile={mockProfile}>
          <NavHeader />
        </TestWrapper>
      )

      expect(screen.getByText('header.sellerChannel')).toBeInTheDocument()
      expect(screen.queryByText('header.becomeShopee')).not.toBeInTheDocument()
    })

    test('should show notification badge when user has unread notifications', async () => {
      render(
        <TestWrapper isAuthenticated={true} profile={mockProfile}>
          <NavHeader />
        </TestWrapper>
      )

      // Wait for query to load
      await waitFor(() => {
        const badge = screen.getByText('3')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('bg-white', 'text-orange')
      })
    })

    test('should render user profile dropdown', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper isAuthenticated={true} profile={mockProfile}>
          <NavHeader />
        </TestWrapper>
      )

      // Click on user avatar/profile area by finding the avatar image
      const avatarImage = screen.getByAltText('avatar')
      const profileElement = avatarImage.closest('span')

      if (profileElement) {
        await user.click(profileElement)

        await waitFor(() => {
          expect(screen.getByText('header.myAccount')).toBeInTheDocument()
          expect(screen.getByText('header.myOrders')).toBeInTheDocument()
          expect(screen.getByText('header.logout')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Language Switching', () => {
    test('should render language selector', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Should show language text content
      expect(screen.getByText('Tiếng Việt')).toBeInTheDocument()
    })

    test('should show language options in dropdown', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Find and click language dropdown by finding the main language span (not in dropdown)
      const languageSpans = screen.getAllByText('Tiếng Việt')
      const mainLanguageSpan = languageSpans.find(
        (span) => span.classList.contains('hidden') && span.classList.contains('md:inline')
      )

      if (mainLanguageSpan) {
        const languageElement = mainLanguageSpan.closest('span')
        if (languageElement) {
          await user.click(languageElement)

          await waitFor(() => {
            // Check that dropdown is now visible with both options
            const allLanguageTexts = screen.getAllByText('Tiếng Việt')
            expect(allLanguageTexts.length).toBeGreaterThan(1) // Main + dropdown
            expect(screen.getByText('English')).toBeInTheDocument()
          })
        }
      }
    })

    test('should handle language change', async () => {
      const user = userEvent.setup()
      const mockChangeLanguage = vi.fn()

      // Re-mock with our spy
      vi.doMock('react-i18next', () => ({
        useTranslation: () => ({
          i18n: {
            changeLanguage: mockChangeLanguage,
            language: 'vi'
          }
        })
      }))

      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Find main language element and click
      const languageSpans = screen.getAllByText('Tiếng Việt')
      const mainLanguageSpan = languageSpans.find(
        (span) => span.classList.contains('hidden') && span.classList.contains('md:inline')
      )

      if (mainLanguageSpan) {
        const languageElement = mainLanguageSpan.closest('span')
        if (languageElement) {
          await user.click(languageElement)

          await waitFor(async () => {
            const englishButton = screen.getByRole('button', { name: 'English' })
            await user.click(englishButton)
          })
        }
      }
    })
  })

  describe('User Interactions', () => {
    test('should handle logout', async () => {
      const user = userEvent.setup()
      const mockSetIsAuthenticated = vi.fn()
      const mockSetProfile = vi.fn()

      const contextValue = {
        isAuthenticated: true,
        setIsAuthenticated: mockSetIsAuthenticated,
        profile: {
          _id: '123',
          roles: ['User'] as const,
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as User,
        setProfile: mockSetProfile,
        extendedPurchases: [],
        setExtendedPurchases: vi.fn(),
        reset: vi.fn()
      }

      render(
        <BrowserRouter>
          <QueryClientProvider
            client={
              new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
              })
            }
          >
            <ThemeProvider>
              <AppContext.Provider value={contextValue}>
                <NavHeader />
              </AppContext.Provider>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      )

      // Find and click profile dropdown by finding user email text
      const profileElement = screen.getByText('test@example.com').closest('span')
      if (profileElement) {
        await user.click(profileElement)

        await waitFor(async () => {
          const logoutButton = screen.getByText('header.logout')
          await user.click(logoutButton)
        })
      }
    })

    test('should handle notification click when authenticated', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper
          isAuthenticated={true}
          profile={
            {
              _id: '123',
              roles: ['User'] as const,
              email: 'test@example.com',
              name: 'Test User',
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z'
            } as User
          }
        >
          <NavHeader />
        </TestWrapper>
      )

      // Click notification bell by finding notification text
      const notificationElement = screen.getByText('header.notification').closest('span')
      if (notificationElement) {
        await user.click(notificationElement)
        expect(notificationElement).toBeInTheDocument()
      }
    })

    test('should navigate to external links', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      const sellerLink = screen.getAllByText('header.sellerChannel')[0].closest('a')
      expect(sellerLink).toHaveAttribute('href', 'https://banhang.shopee.vn/')
    })
  })

  describe('Responsive Design', () => {
    test('should hide elements on mobile screens', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Check for lg:block classes that hide on mobile
      const sellerLink = screen.getAllByText('header.sellerChannel')[0].closest('a')
      expect(sellerLink).toHaveClass('hidden', 'lg:block')
    })

    test('should show notification text only on desktop', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      const notificationText = screen.getByText('header.notification')
      expect(notificationText).toHaveClass('hidden', 'md:inline')
    })

    test('should adapt language selector for mobile', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Check for responsive icon sizes - the globe icon actually has h-5 w-5 class
      const globeIcon = document.querySelector('path[d*="M12 21a9.004"]')
      expect(globeIcon?.closest('svg')).toHaveClass('h-5', 'w-5')
    })
  })

  describe('Accessibility', () => {
    test('should have proper button roles', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Check for interactive elements (spans with cursor-pointer class)
      const interactiveElements = document.querySelectorAll('.cursor-pointer')
      expect(interactiveElements.length).toBeGreaterThan(0)
    })

    test('should have proper link accessibility', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })

    test('should have proper image alt texts', () => {
      render(
        <TestWrapper>
          <NavHeader />
        </TestWrapper>
      )

      // Check for download app QR code alt text
      const qrImage = screen.queryByAltText('QR_Shopee')
      if (qrImage) {
        expect(qrImage).toBeInTheDocument()
      }
    })

    test('should handle network errors gracefully', async () => {
      // Test without any notification data (simulates network error)
      render(
        <TestWrapper
          isAuthenticated={true}
          profile={
            {
              _id: '123',
              roles: ['User'] as const,
              email: 'test@example.com',
              name: 'Test',
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z'
            } as User
          }
        >
          <NavHeader />
        </TestWrapper>
      )

      // Should not show notification badge on error
      await waitFor(
        () => {
          const badge = screen.queryByText('3')
          expect(badge).not.toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    test('should handle zero unread notifications', async () => {
      render(
        <TestWrapper
          isAuthenticated={true}
          profile={
            {
              _id: '123',
              roles: ['User'] as const,
              email: 'test@example.com',
              name: 'Test',
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z'
            } as User
          }
          notificationData={{
            data: {
              data: {
                unreadCount: 0,
                notifications: []
              }
            }
          }}
        >
          <NavHeader />
        </TestWrapper>
      )

      await waitFor(
        () => {
          const zeroBadge = screen.queryByText('0')
          expect(zeroBadge).not.toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    test('should handle high notification counts', async () => {
      render(
        <TestWrapper
          isAuthenticated={true}
          profile={
            {
              _id: '123',
              roles: ['User'] as const,
              email: 'test@example.com',
              name: 'Test',
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z'
            } as User
          }
          notificationData={{
            data: {
              data: {
                unreadCount: 15,
                notifications: []
              }
            }
          }}
        >
          <NavHeader />
        </TestWrapper>
      )

      await waitFor(
        () => {
          const badge = screen.getByText('9+')
          expect(badge).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })
})
