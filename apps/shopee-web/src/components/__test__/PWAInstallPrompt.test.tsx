import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import PWAInstallPrompt from '../PWAInstallPrompt/PWAInstallPrompt'
import SellerDashboardPanel from '../SellerDashboardPanel/SellerDashboardPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({
    isInstallable: false,
    promptInstall: vi.fn(),
    dismissPrompt: vi.fn(),
  }),
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/hooks/useSellerDashboard', () => ({
  default: () => ({
    metrics: {
      today_orders: 10,
      today_revenue: 1000000,
      pending_orders: 5,
      pending_qa: 3,
    },
    orderNotifications: [],
    qaNotifications: [],
    isActive: false,
  }),
}))

vi.mock('@shopee/shared-utils', () => ({
  formatVNDCurrency: (value: number) => value.toString(),
}))

describe('PWAInstallPrompt', () => {
  it('renders nothing when not installable', () => {
    const { container } = render(<PWAInstallPrompt />)
    expect(container.firstChild).toBeFalsy()
  })

  it('renders prompt when installable', () => {
    vi.doMock('src/hooks/usePWAInstall', () => ({
      usePWAInstall: () => ({
        isInstallable: true,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
      }),
    }))

    const { container } = render(<PWAInstallPrompt />)
    expect(container).toBeInstanceOf(HTMLDivElement)
  })
})

describe('SellerDashboardPanel', () => {
  it('renders nothing when not active', () => {
    const { container } = render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeFalsy()
  })

  it('renders dashboard when active', () => {
    vi.doMock('src/hooks/useSellerDashboard', () => ({
      default: () => ({
        metrics: {
          today_orders: 10,
          today_revenue: 1000000,
          pending_orders: 5,
          pending_qa: 3,
        },
        orderNotifications: [
          {
            order_id: '1',
            product_names: ['Product 1'],
            total: 100000,
          },
        ],
        qaNotifications: [
          {
            product_id: '1',
            product_name: 'Product 1',
            user_name: 'User 1',
            question_preview: 'Question?',
          },
        ],
        isActive: true,
      }),
    }))

    const { container } = render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>,
    )
    expect(container).toBeInstanceOf(HTMLDivElement)
  })

  it('renders with metrics', () => {
    vi.doMock('src/hooks/useSellerDashboard', () => ({
      default: () => ({
        metrics: {
          today_orders: 15,
          today_revenue: 2000000,
          pending_orders: 8,
          pending_qa: 5,
        },
        orderNotifications: [],
        qaNotifications: [],
        isActive: true,
      }),
    }))

    const { container } = render(
      <MemoryRouter>
        <SellerDashboardPanel className="test-class" />
      </MemoryRouter>,
    )
    expect(container).toBeInstanceOf(HTMLDivElement)
  })
})
