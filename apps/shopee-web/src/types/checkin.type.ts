// Daily Check-in types
export interface CheckInDay {
  date: string // ISO date string (YYYY-MM-DD)
  checked: boolean
  reward?: CheckInReward
}

export interface CheckInReward {
  type: 'coins' | 'voucher' | 'points'
  value: number
  description?: string
}

export interface CheckInStreak {
  current: number
  longest: number
  lastCheckIn: string | null // ISO date string
}

export interface CheckInState {
  streak: CheckInStreak
  history: CheckInDay[]
  totalCoins: number
  canCheckInToday: boolean
}

export interface DailyCheckInConfig {
  baseReward: number // Base coins per check-in
  streakBonuses: Record<number, number> // Day -> bonus multiplier
  maxStreak: number
}

// Default rewards configuration
export const DEFAULT_CHECKIN_CONFIG: DailyCheckInConfig = {
  baseReward: 10,
  streakBonuses: {
    3: 1.5, // 3 days streak = 1.5x
    7: 2, // 7 days streak = 2x
    14: 2.5, // 14 days streak = 2.5x
    30: 3 // 30 days streak = 3x
  },
  maxStreak: 30
}

// Helper to get reward for a specific day in streak
export const getRewardForDay = (day: number, config: DailyCheckInConfig = DEFAULT_CHECKIN_CONFIG): CheckInReward => {
  let multiplier = 1
  const sortedBonuses = Object.entries(config.streakBonuses)
    .map(([d, m]) => [parseInt(d), m] as [number, number])
    .sort((a, b) => b[0] - a[0])

  for (const [threshold, bonus] of sortedBonuses) {
    if (day >= threshold) {
      multiplier = bonus
      break
    }
  }

  return {
    type: 'coins',
    value: Math.floor(config.baseReward * multiplier),
    description: multiplier > 1 ? `Streak bonus x${multiplier}` : undefined
  }
}
