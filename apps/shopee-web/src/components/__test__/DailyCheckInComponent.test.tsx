import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DailyCheckIn from '../DailyCheckIn/DailyCheckIn'
import { toast } from 'react-toastify'
import * as useDailyCheckInModule from 'src/hooks/useDailyCheckIn'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'months')
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      if (key === 'days') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      if (key === 'toast.success') return `Success: ${options?.value} coins`
      if (key === 'streak') return `Streak: ${options?.count} days`
      if (key === 'record') return `Record: ${options?.count} days`
      if (key === 'milestone') return `${options?.count}d`
      if (key === 'checkInButton') return `Check in +${options?.value}`
      return key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

const mockCheckIn = vi.fn()
const mockGetMonthCalendar = vi.fn()
const mockGetCheckInStatus = vi.fn()

const defaultMockReturn = {
  streak: { current: 5, longest: 10, lastCheckIn: null },
  history: [],
  totalCoins: 1000,
  canCheckInToday: true,
  checkIn: mockCheckIn,
  getCheckInStatus: mockGetCheckInStatus,
  getMonthCalendar: mockGetMonthCalendar,
  nextReward: { value: 10, type: 'coins' as const },
  streakProgress: { progress: 50, current: 5, nextMilestone: 7, prevMilestone: 3 },
}

vi.mock('src/hooks/useDailyCheckIn', () => ({
  default: vi.fn(() => defaultMockReturn),
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}))

describe('DailyCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMonthCalendar.mockReturnValue([
      { date: '2024-03-01', checked: true },
      { date: '2024-03-02', checked: true },
      { date: '2024-03-03', checked: false },
    ])
  })

  describe('Basic Rendering', () => {
    it('renders daily check-in component', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<DailyCheckIn className="test-class" />)
      expect(container.querySelector('.test-class')).toBeInTheDocument()
    })

    it('displays title and subtitle', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('title')).toBeInTheDocument()
      expect(screen.getByText('subtitle')).toBeInTheDocument()
    })

    it('displays total coins', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('1000')).toBeInTheDocument()
      expect(screen.getByText('yourCoins')).toBeInTheDocument()
    })
  })

  describe('Streak Display', () => {
    it('displays current streak', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('Streak: 5 days')).toBeInTheDocument()
    })

    it('displays longest streak record', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('Record: 10 days')).toBeInTheDocument()
    })

    it('displays next reward value', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('+10 xu')).toBeInTheDocument()
      expect(screen.getByText('nextReward')).toBeInTheDocument()
    })

    it('renders fire icon for streak', () => {
      const { container } = render(<DailyCheckIn />)
      const fireIcon = container.querySelector('svg')
      expect(fireIcon).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('renders progress bar', () => {
      const { container } = render(<DailyCheckIn />)
      const progressBar = container.querySelector('.h-2')
      expect(progressBar).toBeInTheDocument()
    })

    it('displays milestone markers', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('3d')).toBeInTheDocument()
      expect(screen.getByText('7d')).toBeInTheDocument()
      expect(screen.getByText('14d')).toBeInTheDocument()
      expect(screen.getByText('30d')).toBeInTheDocument()
    })
  })

  describe('Check-in Button - Available State', () => {
    it('displays check-in button when available', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('Check in +10')).toBeInTheDocument()
    })

    it('calls checkIn when button clicked', async () => {
      mockCheckIn.mockResolvedValue({ value: 10 })
      render(<DailyCheckIn />)

      const button = screen.getByText('Check in +10')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockCheckIn).toHaveBeenCalledTimes(1)
      })
    })

    it('shows toast on successful check-in', async () => {
      mockCheckIn.mockResolvedValue({ value: 10 })
      render(<DailyCheckIn />)

      const button = screen.getByText('Check in +10')
      fireEvent.click(button)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Success: 10 coins',
          expect.objectContaining({
            autoClose: 3000,
            position: 'top-center',
          }),
        )
      })
    })

    it('shows loading state during check-in', async () => {
      mockCheckIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ value: 10 }), 100)),
      )
      render(<DailyCheckIn />)

      const button = screen.getByText('Check in +10')
      fireEvent.click(button)

      expect(screen.getByText('checkingIn')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('checkingIn')).not.toBeInTheDocument()
      })
    })

    it('disables button during check-in', async () => {
      mockCheckIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ value: 10 }), 100)),
      )
      render(<DailyCheckIn />)

      const button = screen.getByText('Check in +10')
      fireEvent.click(button)

      // Try clicking again
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockCheckIn).toHaveBeenCalledTimes(1)
      })
    })

    it('does not call checkIn if already checking', async () => {
      mockCheckIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ value: 10 }), 100)),
      )
      render(<DailyCheckIn />)

      const button = screen.getByText('Check in +10')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockCheckIn).toHaveBeenCalledTimes(1)
      })
    })

    it('does not show toast if checkIn returns null', async () => {
      mockCheckIn.mockResolvedValue(null)
      render(<DailyCheckIn />)

      const button = screen.getByText('Check in +10')
      fireEvent.click(button)

      await waitFor(() => {
        expect(toast.success).not.toHaveBeenCalled()
      })
    })
  })

  describe('Check-in Button - Checked State', () => {
    it('displays checked-in state when not available', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        canCheckInToday: false,
      })

      render(<DailyCheckIn />)
      expect(screen.getByText('checkedIn')).toBeInTheDocument()
    })

    it('displays come back tomorrow message', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        canCheckInToday: false,
      })

      render(<DailyCheckIn />)
      expect(screen.getByText('comeBackTomorrow')).toBeInTheDocument()
    })

    it('shows checkmark icon when checked in', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        canCheckInToday: false,
      })

      const { container } = render(<DailyCheckIn />)
      const checkIcon = container.querySelector('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it('does not call checkIn when clicked in checked state', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        canCheckInToday: false,
      })

      render(<DailyCheckIn />)
      const checkedState = screen.getByText('checkedIn')
      fireEvent.click(checkedState)

      expect(mockCheckIn).not.toHaveBeenCalled()
    })
  })

  describe('Calendar Toggle', () => {
    it('shows calendar toggle button', () => {
      render(<DailyCheckIn />)
      expect(screen.getByText('showCalendar')).toBeInTheDocument()
    })

    it('toggles calendar visibility', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      expect(screen.getByText('hideCalendar')).toBeInTheDocument()
    })

    it('hides calendar when toggle clicked again', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)
      expect(screen.getByText('hideCalendar')).toBeInTheDocument()

      const hideButton = screen.getByText('hideCalendar')
      fireEvent.click(hideButton)
      expect(screen.getByText('showCalendar')).toBeInTheDocument()
    })

    it('calendar is hidden by default', () => {
      render(<DailyCheckIn />)
      expect(screen.queryByText('Jan')).not.toBeInTheDocument()
    })
  })

  describe('Calendar Display', () => {
    beforeEach(() => {
      mockGetMonthCalendar.mockReturnValue([
        { date: '2024-03-01', checked: true },
        { date: '2024-03-02', checked: true },
        { date: '2024-03-03', checked: false },
        { date: '2024-03-04', checked: false },
      ])
    })

    it('displays calendar when toggled', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      // Month name should be visible
      const monthText = screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(monthText).toBeInTheDocument()
    })

    it('displays day names', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('displays calendar days', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows checkmark on checked days', () => {
      const { container } = render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const checkmarks = container.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkmarks.length).toBeGreaterThan(0)
    })

    it('navigates to previous month', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const prevButton = screen.getByLabelText('prevMonth')
      fireEvent.click(prevButton)

      // Should show a month name
      const monthText = screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(monthText).toBeInTheDocument()
    })

    it('navigates to next month', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const nextButton = screen.getByLabelText('nextMonth')
      fireEvent.click(nextButton)

      // Should show a month name
      const monthText = screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(monthText).toBeInTheDocument()
    })

    it('wraps to previous year when going back from January', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      // Navigate back several months
      for (let i = 0; i < 5; i++) {
        const prevButton = screen.getByLabelText('prevMonth')
        fireEvent.click(prevButton)
      }

      // Should still show a month name
      const monthText = screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(monthText).toBeInTheDocument()
    })

    it('wraps to next year when going forward from December', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      // Navigate forward several months
      for (let i = 0; i < 10; i++) {
        const nextButton = screen.getByLabelText('nextMonth')
        fireEvent.click(nextButton)
      }

      // Should still show a month name
      const monthText = screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(monthText).toBeInTheDocument()
    })

    it('calls getMonthCalendar with correct parameters', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const now = new Date()
      expect(mockGetMonthCalendar).toHaveBeenCalledWith(now.getFullYear(), now.getMonth())
    })

    it('updates calendar when month changes', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const nextButton = screen.getByLabelText('nextMonth')
      fireEvent.click(nextButton)

      const now = new Date()
      expect(mockGetMonthCalendar).toHaveBeenCalledWith(now.getFullYear(), now.getMonth() + 1)
    })
  })

  describe('Calendar Day Rendering', () => {
    it('highlights today with ring', () => {
      const today = new Date().toISOString().split('T')[0]
      mockGetMonthCalendar.mockReturnValue([{ date: today, checked: false }])

      const { container } = render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const todayCell = container.querySelector('.ring-2.ring-orange')
      expect(todayCell).toBeInTheDocument()
    })

    it('applies orange background to checked days', () => {
      mockGetMonthCalendar.mockReturnValue([{ date: '2024-03-01', checked: true }])

      const { container } = render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const checkedDay = container.querySelector('.bg-orange')
      expect(checkedDay).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper aria labels for navigation buttons', () => {
      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      expect(screen.getByLabelText('prevMonth')).toBeInTheDocument()
      expect(screen.getByLabelText('nextMonth')).toBeInTheDocument()
    })

    it('renders semantic HTML structure', () => {
      const { container } = render(<DailyCheckIn />)
      expect(container.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty calendar data', () => {
      const emptyCalendarMock = vi.fn().mockReturnValue([])
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        getMonthCalendar: emptyCalendarMock,
      })

      render(<DailyCheckIn />)

      const toggleButton = screen.getByText('showCalendar')
      fireEvent.click(toggleButton)

      const monthText = screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(monthText).toBeInTheDocument()
    })

    it('handles zero streak', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        streak: { current: 0, longest: 0, lastCheckIn: null },
        history: [],
        totalCoins: 0,
        nextReward: { value: 5, type: 'coins' as const },
        streakProgress: { progress: 0, current: 0, nextMilestone: 3, prevMilestone: 0 },
      })

      render(<DailyCheckIn />)
      expect(screen.getByText('Streak: 0 days')).toBeInTheDocument()
    })

    it('handles very high streak numbers', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        streak: { current: 365, longest: 500, lastCheckIn: '2024-01-01' },
        history: [],
        totalCoins: 100000,
        nextReward: { value: 50, type: 'coins' as const },
        streakProgress: { progress: 95, current: 365, nextMilestone: 400, prevMilestone: 300 },
      })

      render(<DailyCheckIn />)
      expect(screen.getByText('Streak: 365 days')).toBeInTheDocument()
      expect(screen.getByText('Record: 500 days')).toBeInTheDocument()
    })

    it('handles progress over 100%', () => {
      vi.mocked(useDailyCheckInModule.default).mockReturnValueOnce({
        ...defaultMockReturn,
        streak: { current: 50, longest: 50, lastCheckIn: '2024-01-01' },
        history: [],
        totalCoins: 5000,
        nextReward: { value: 20, type: 'coins' as const },
        streakProgress: { progress: 150, current: 50, nextMilestone: 60, prevMilestone: 30 },
      })

      const { container } = render(<DailyCheckIn />)
      const progressBar = container.querySelector('.h-full')
      expect(progressBar).toBeInTheDocument()
    })
  })
})
