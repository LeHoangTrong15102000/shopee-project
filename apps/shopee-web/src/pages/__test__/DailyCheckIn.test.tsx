import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import DailyCheckInPage from '../User/pages/DailyCheckIn/DailyCheckIn'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'page.title': 'Điểm danh hàng ngày',
        'page.subtitle': 'Điểm danh mỗi ngày để nhận xu và phần thưởng hấp dẫn',
        'rewards.title': 'Phần thưởng theo chuỗi điểm danh',
        'tips.title': 'Mẹo nhỏ',
        'tips.streak': 'Điểm danh liên tục để nhận thưởng cao hơn',
        'tips.reset': 'Chuỗi điểm danh sẽ bị reset nếu bạn bỏ lỡ 1 ngày',
        'tips.voucher': 'Xu có thể dùng để đổi voucher giảm giá',
      }

      if (key === 'milestone' && params?.count) {
        return `${params.count} ngày`
      }
      if (key === 'rewards.multiplier' && params?.value) {
        return `x${params.value} xu`
      }

      return translations[key] || key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

vi.mock('src/components/DailyCheckIn', () => ({
  default: ({ className }: { className?: string }) => (
    <div className={className} data-testid="daily-checkin-component">
      Daily Check-In Component
    </div>
  ),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    )
}

describe('DailyCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders daily check-in page', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Điểm danh hàng ngày')).toBeInTheDocument()
    })
  })

  it('displays daily check-in component', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('daily-checkin-component')).toBeInTheDocument()
    })
  })

  it('displays reward tiers', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Phần thưởng theo chuỗi điểm danh')).toBeInTheDocument()
      expect(screen.getByText('3 ngày')).toBeInTheDocument()
      expect(screen.getByText('7 ngày')).toBeInTheDocument()
      expect(screen.getByText('14 ngày')).toBeInTheDocument()
      expect(screen.getByText('30 ngày')).toBeInTheDocument()
    })
  })

  it('displays tips section', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(DailyCheckInPage), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Mẹo nhỏ')).toBeInTheDocument()
      expect(screen.getByText('• Điểm danh liên tục để nhận thưởng cao hơn')).toBeInTheDocument()
      expect(
        screen.getByText('• Chuỗi điểm danh sẽ bị reset nếu bạn bỏ lỡ 1 ngày'),
      ).toBeInTheDocument()
      expect(screen.getByText('• Xu có thể dùng để đổi voucher giảm giá')).toBeInTheDocument()
    })
  })
})
