import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDailyCheckIn } from '../useDailyCheckIn'
import checkinApi from 'src/apis/checkin.api'

vi.mock('src/apis/checkin.api', () => ({
  default: {
    getStreak: vi.fn(),
    checkIn: vi.fn(),
  },
}))

/**
 * Build a minimal API response object matching the shape that checkinApi.getStreak()
 * resolves with. Using explicit types removes all need for `as any`.
 */
function makeStreakResponse(
  current_streak: number,
  longest_streak = current_streak,
  last_checkin_date: string | null = null,
  total_coins = 0,
  can_checkin_today = true,
) {
  return {
    data: {
      data: {
        current_streak,
        longest_streak,
        last_checkin_date,
        total_coins,
        can_checkin_today,
      },
    },
  }
}

describe('useDailyCheckIn', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns initial state with canCheckInToday true', () => {
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useDailyCheckIn())

    expect(result.current.canCheckInToday).toBe(true)
    expect(result.current.streak.current).toBe(0)
    expect(result.current.totalCoins).toBe(0)
  })

  it('loads streak from API on mount', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(
      makeStreakResponse(5, 10, '2026-03-15', 100, true),
    )

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(5)
    })

    expect(result.current.streak.longest).toBe(10)
    expect(result.current.totalCoins).toBe(100)
    expect(result.current.canCheckInToday).toBe(true)
  })

  it('falls back to localStorage when API fails', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const storedData = {
      streak: { current: 3, longest: 5, lastCheckIn: yesterdayStr },
      history: [],
      totalCoins: 50,
    }
    localStorage.setItem('shopee_daily_checkin', JSON.stringify(storedData))
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(3)
    })

    expect(result.current.totalCoins).toBe(50)
  })

  it('exposes checkIn and getMonthCalendar functions', () => {
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useDailyCheckIn())

    expect(typeof result.current.checkIn).toBe('function')
    expect(typeof result.current.getMonthCalendar).toBe('function')
  })

  it('getMonthCalendar returns array of days', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(0, 0, null, 0, true))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.canCheckInToday).toBe(true)
    })

    const calendar = result.current.getMonthCalendar(2026, 2)

    expect(calendar.length).toBe(31)
    expect(calendar[0].date).toBe('2026-03-01')
    expect(calendar[0].checked).toBe(false)
  })
})

describe('useDailyCheckIn — streakProgress.progress formula', () => {
  // Milestones for DEFAULT_CHECKIN_CONFIG: [3, 7, 14, 30]
  // N = 4, centers: 12.5 / 37.5 / 62.5 / 87.5 %

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  const cases: [number, number][] = [
    [0, 0],
    [2, (2 / 3) * 12.5], // 8.333...% — below first milestone
    [3, 12.5], // exactly at first milestone
    [5, 12.5 + ((5 - 3) / (7 - 3)) * (37.5 - 12.5)], // between 3 and 7
    [7, 37.5], // exactly at second milestone
    [10, 37.5 + ((10 - 7) / (14 - 7)) * (62.5 - 37.5)], // between 7 and 14
    [14, 62.5], // exactly at third milestone
    [20, 62.5 + ((20 - 14) / (30 - 14)) * (87.5 - 62.5)], // between 14 and 30
    [30, 87.5], // exactly at last milestone
    [31, 87.5], // beyond last milestone — capped
    [100, 87.5], // way beyond — capped
  ]

  it.each(cases)('streak %i → progress ≈ %f%', async (streak, expectedProgress) => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(streak))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(streak)
    })

    expect(result.current.streakProgress.progress).toBeCloseTo(expectedProgress, 5)
  })

  it('streak 0 → progress is exactly 0', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(0))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(0)
    })

    expect(result.current.streakProgress.progress).toBe(0)
  })

  it('progress never exceeds 100 for any streak', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(9999))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(9999)
    })

    expect(result.current.streakProgress.progress).toBeLessThanOrEqual(100)
  })

  it('streakProgress retains required shape fields', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(5))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(5)
    })

    const sp = result.current.streakProgress
    expect(sp).toHaveProperty('current')
    expect(sp).toHaveProperty('nextMilestone')
    expect(sp).toHaveProperty('prevMilestone')
    expect(sp).toHaveProperty('progress')
  })
})

describe('useDailyCheckIn — mount-once effect (no loop)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('calls checkinApi.getStreak() exactly once on mount', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(3))

    const { result } = renderHook(() => useDailyCheckIn())

    // Wait for the API response to be applied
    await waitFor(() => {
      expect(result.current.streak.current).toBe(3)
    })

    // getStreak must have been called exactly once — no re-render loop
    expect(checkinApi.getStreak).toHaveBeenCalledTimes(1)
  })

  it('subsequent state updates do not trigger additional getStreak() calls', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue(makeStreakResponse(3))

    const { result, rerender } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(3)
    })

    // Force multiple re-renders
    rerender()
    rerender()
    rerender()

    expect(checkinApi.getStreak).toHaveBeenCalledTimes(1)
  })

  it('API failure falls back to localStorage exactly once (no loop)', async () => {
    const storedData = {
      streak: { current: 7, longest: 10, lastCheckIn: null },
      history: [],
      totalCoins: 70,
    }
    localStorage.setItem('shopee_daily_checkin', JSON.stringify(storedData))
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDailyCheckIn())

    await waitFor(() => {
      expect(result.current.streak.current).toBe(7)
    })

    // API was tried once then fell back — still only one attempt
    expect(checkinApi.getStreak).toHaveBeenCalledTimes(1)
  })
})
