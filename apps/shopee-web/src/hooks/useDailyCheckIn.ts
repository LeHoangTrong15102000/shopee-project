import { useEffect, useState } from 'react'
import checkinApi, { type HistoryResponse } from 'src/apis/checkin.api'
import {
  CheckInDay,
  CheckInReward,
  CheckInState,
  CheckInStreak,
  DEFAULT_CHECKIN_CONFIG,
  getRewardForDay,
} from 'src/types/checkin.type'

const CHECKIN_STORAGE_KEY = 'shopee_daily_checkin'
const COINS_STORAGE_KEY = 'shopee_user_coins'

interface StoredCheckInData {
  streak: CheckInStreak
  history: CheckInDay[]
  totalCoins: number
}

// Module-level function — closes over only module-level constants so its
// reference is stable across renders and cannot cause useEffect re-runs.
const saveToStorage = (data: StoredCheckInData): void => {
  localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(COINS_STORAGE_KEY, data.totalCoins.toString())
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Helper to check if two dates are consecutive
const areConsecutiveDays = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1
}

// Helper to check if date is today
const isToday = (date: string): boolean => {
  return date === getTodayDate()
}

const normalizeHistoryDate = (date: string): string => {
  return date.split('T')[0]
}

const getCheckInRewardType = (type: string): CheckInReward['type'] => {
  switch (type) {
    case 'voucher':
    case 'points':
      return type
    case 'coins':
    default:
      return 'coins'
  }
}

const mapHistoryToCheckInDays = (history: HistoryResponse['history']): CheckInDay[] => {
  return history.map((day) => ({
    date: normalizeHistoryDate(day.date),
    checked: true,
    reward: {
      type: getCheckInRewardType(day.reward_type),
      value: day.reward_value,
    },
  }))
}

export const useDailyCheckIn = () => {
  const [state, setState] = useState<CheckInState>({
    streak: { current: 0, longest: 0, lastCheckIn: null },
    history: [],
    totalCoins: 0,
    canCheckInToday: true,
  })

  // Load from API on mount, fall back to localStorage
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const stored = localStorage.getItem(CHECKIN_STORAGE_KEY)
      const storedCoins = localStorage.getItem(COINS_STORAGE_KEY)

      if (stored) {
        try {
          const data: StoredCheckInData = JSON.parse(stored)
          const today = getTodayDate()
          const canCheckIn = data.streak.lastCheckIn !== today

          let currentStreak = data.streak.current
          if (
            data.streak.lastCheckIn &&
            !areConsecutiveDays(data.streak.lastCheckIn, today) &&
            !isToday(data.streak.lastCheckIn)
          ) {
            currentStreak = 0
          }

          setState({
            streak: { ...data.streak, current: currentStreak },
            history: data.history,
            totalCoins: storedCoins ? parseInt(storedCoins) : data.totalCoins,
            canCheckInToday: canCheckIn,
          })
        } catch (e) {
          console.error('Failed to parse check-in data:', e)
          localStorage.removeItem(CHECKIN_STORAGE_KEY)
        }
      }
    }

    const loadFromApi = async () => {
      try {
        const response = await checkinApi.getStreak()
        const streakData = response.data.data
        let history: CheckInDay[] = []

        try {
          const historyResponse = await checkinApi.getHistory({ limit: 365 })
          history = mapHistoryToCheckInDays(historyResponse.data.data.history)
        } catch {
          history = []
        }

        const newState: CheckInState = {
          streak: {
            current: streakData.current_streak,
            longest: streakData.longest_streak,
            lastCheckIn: streakData.last_checkin_date,
          },
          history,
          totalCoins: streakData.total_coins,
          canCheckInToday: streakData.can_checkin_today,
        }
        setState(newState)
        // Cache to localStorage
        saveToStorage({
          streak: newState.streak,
          history: newState.history,
          totalCoins: newState.totalCoins,
        })
      } catch {
        // API failed, fall back to localStorage
        loadFromLocalStorage()
      }
    }

    loadFromApi()
  }, [])

  // Perform check-in via API with localStorage fallback
  const checkIn = async (): Promise<CheckInReward | null> => {
    if (!state.canCheckInToday) return null

    try {
      const response = await checkinApi.checkIn()
      const apiData = response.data.data
      const reward: CheckInReward = apiData.reward

      const today = getTodayDate()
      const newCheckInDay: CheckInDay = {
        date: today,
        checked: true,
        reward,
      }

      const newState: CheckInState = {
        streak: {
          current: apiData.streak,
          longest: Math.max(state.streak.longest, apiData.streak),
          lastCheckIn: today,
        },
        history: [newCheckInDay, ...state.history].slice(0, 365),
        totalCoins: apiData.total_coins,
        canCheckInToday: false,
      }

      setState(newState)
      saveToStorage({
        streak: newState.streak,
        history: newState.history,
        totalCoins: newState.totalCoins,
      })

      return reward
    } catch {
      // API failed, fall back to localStorage-based check-in
      const today = getTodayDate()
      const newStreak = state.streak.current + 1
      const reward = getRewardForDay(newStreak)

      const newCheckInDay: CheckInDay = {
        date: today,
        checked: true,
        reward,
      }

      const newState: CheckInState = {
        streak: {
          current: newStreak,
          longest: Math.max(state.streak.longest, newStreak),
          lastCheckIn: today,
        },
        history: [newCheckInDay, ...state.history].slice(0, 365),
        totalCoins: state.totalCoins + reward.value,
        canCheckInToday: false,
      }

      setState(newState)
      saveToStorage({
        streak: newState.streak,
        history: newState.history,
        totalCoins: newState.totalCoins,
      })

      return reward
    }
  }

  // Get check-in status for a specific date
  const getCheckInStatus = (date: string): CheckInDay | undefined => {
    return state.history.find((day) => day.date === date)
  }

  // Get calendar data for current month
  const getMonthCalendar = (year: number, month: number): CheckInDay[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const calendar: CheckInDay[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const existingDay = state.history.find((d) => d.date === date)
      calendar.push(existingDay || { date, checked: false })
    }

    return calendar
  }

  // Calculate next reward
  const nextReward = getRewardForDay(state.streak.current + 1)

  // Get streak milestone progress
  const streakProgress = (() => {
    const milestones = Object.keys(DEFAULT_CHECKIN_CONFIG.streakBonuses)
      .map(Number)
      .sort((a, b) => a - b)
    const N = milestones.length
    const streak = state.streak.current

    const nextMilestone = milestones.find((m) => m > streak) || milestones[milestones.length - 1]
    const prevMilestone = milestones.filter((m) => m < streak).pop() || 0

    // Map the streak to the evenly-spaced label-center coordinate system.
    // With N milestones rendered as equal-width cells, the center of the
    // milestone at zero-based index i is at (i + 0.5) / N * 100 %.
    // Below the first milestone interpolate linearly from 0% (streak 0)
    // to the first center. Between milestones interpolate between adjacent
    // centers. At or beyond the last milestone cap at that center.
    let progress: number

    if (streak <= 0) {
      progress = 0
    } else if (streak >= milestones[N - 1]) {
      // Capped at the last milestone's label center
      progress = ((N - 1 + 0.5) / N) * 100
    } else {
      // Find which segment the streak belongs to
      const nextIdx = milestones.findIndex((m) => m > streak)
      // nextIdx === 0 means streak is below the first milestone
      if (nextIdx === 0) {
        // Segment: [0, milestones[0]]
        // Maps: 0 → 0%, milestones[0] → center[0]
        const firstCenter = (0.5 / N) * 100
        progress = (streak / milestones[0]) * firstCenter
      } else {
        // Segment: [milestones[nextIdx-1], milestones[nextIdx]]
        // Maps: prevCenter → nextCenter
        const prevCenter = ((nextIdx - 1 + 0.5) / N) * 100
        const nextCenter = ((nextIdx + 0.5) / N) * 100
        const segStart = milestones[nextIdx - 1]
        const segEnd = milestones[nextIdx]
        progress =
          prevCenter + ((streak - segStart) / (segEnd - segStart)) * (nextCenter - prevCenter)
      }
    }

    return {
      current: streak,
      nextMilestone,
      prevMilestone,
      progress,
    }
  })()

  return {
    ...state,
    checkIn,
    getCheckInStatus,
    getMonthCalendar,
    nextReward,
    streakProgress,
  }
}

export default useDailyCheckIn
