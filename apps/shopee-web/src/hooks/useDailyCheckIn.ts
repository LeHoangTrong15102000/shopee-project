import { useCallback, useEffect, useMemo, useState } from 'react'
import checkinApi from 'src/apis/checkin.api'
import {
  CheckInDay,
  CheckInReward,
  CheckInState,
  CheckInStreak,
  DEFAULT_CHECKIN_CONFIG,
  getRewardForDay
} from 'src/types/checkin.type'

const CHECKIN_STORAGE_KEY = 'shopee_daily_checkin'
const COINS_STORAGE_KEY = 'shopee_user_coins'

interface StoredCheckInData {
  streak: CheckInStreak
  history: CheckInDay[]
  totalCoins: number
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

export const useDailyCheckIn = () => {
  const [state, setState] = useState<CheckInState>({
    streak: { current: 0, longest: 0, lastCheckIn: null },
    history: [],
    totalCoins: 0,
    canCheckInToday: true
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
            canCheckInToday: canCheckIn
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
        const newState: CheckInState = {
          streak: {
            current: streakData.current_streak,
            longest: streakData.longest_streak,
            lastCheckIn: streakData.last_checkin_date
          },
          history: [], // History loaded separately if needed
          totalCoins: streakData.total_coins,
          canCheckInToday: streakData.can_checkin_today
        }
        setState(newState)
        // Cache to localStorage
        saveToStorage({
          streak: newState.streak,
          history: newState.history,
          totalCoins: newState.totalCoins
        })
      } catch {
        // API failed, fall back to localStorage
        loadFromLocalStorage()
      }
    }

    loadFromApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to localStorage
  const saveToStorage = useCallback((data: StoredCheckInData) => {
    localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(data))
    localStorage.setItem(COINS_STORAGE_KEY, data.totalCoins.toString())
  }, [])

  // Perform check-in via API with localStorage fallback
  const checkIn = useCallback(async (): Promise<CheckInReward | null> => {
    if (!state.canCheckInToday) return null

    try {
      const response = await checkinApi.checkIn()
      const apiData = response.data.data
      const reward: CheckInReward = apiData.reward

      const today = getTodayDate()
      const newCheckInDay: CheckInDay = {
        date: today,
        checked: true,
        reward
      }

      const newState: CheckInState = {
        streak: {
          current: apiData.streak,
          longest: Math.max(state.streak.longest, apiData.streak),
          lastCheckIn: today
        },
        history: [newCheckInDay, ...state.history].slice(0, 365),
        totalCoins: apiData.total_coins,
        canCheckInToday: false
      }

      setState(newState)
      saveToStorage({
        streak: newState.streak,
        history: newState.history,
        totalCoins: newState.totalCoins
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
        reward
      }

      const newState: CheckInState = {
        streak: {
          current: newStreak,
          longest: Math.max(state.streak.longest, newStreak),
          lastCheckIn: today
        },
        history: [newCheckInDay, ...state.history].slice(0, 365),
        totalCoins: state.totalCoins + reward.value,
        canCheckInToday: false
      }

      setState(newState)
      saveToStorage({
        streak: newState.streak,
        history: newState.history,
        totalCoins: newState.totalCoins
      })

      return reward
    }
  }, [state, saveToStorage])

  // Get check-in status for a specific date
  const getCheckInStatus = useCallback(
    (date: string): CheckInDay | undefined => {
      return state.history.find((day) => day.date === date)
    },
    [state.history]
  )

  // Get calendar data for current month
  const getMonthCalendar = useCallback(
    (year: number, month: number): CheckInDay[] => {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const calendar: CheckInDay[] = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const existingDay = state.history.find((d) => d.date === date)
        calendar.push(existingDay || { date, checked: false })
      }

      return calendar
    },
    [state.history]
  )

  // Calculate next reward
  const nextReward = useMemo(() => {
    return getRewardForDay(state.streak.current + 1)
  }, [state.streak.current])

  // Get streak milestone progress
  const streakProgress = useMemo(() => {
    const milestones = Object.keys(DEFAULT_CHECKIN_CONFIG.streakBonuses)
      .map(Number)
      .sort((a, b) => a - b)
    const nextMilestone = milestones.find((m) => m > state.streak.current) || milestones[milestones.length - 1]
    const prevMilestone = milestones.filter((m) => m < state.streak.current).pop() || 0

    return {
      current: state.streak.current,
      nextMilestone,
      prevMilestone,
      progress: ((state.streak.current - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    }
  }, [state.streak.current])

  return {
    ...state,
    checkIn,
    getCheckInStatus,
    getMonthCalendar,
    nextReward,
    streakProgress
  }
}

export default useDailyCheckIn
