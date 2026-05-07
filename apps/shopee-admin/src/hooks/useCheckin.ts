import { useQuery, keepPreviousData } from '@tanstack/react-query'
import checkinApi from 'src/apis/checkin.api'

export const CHECKIN_KEYS = {
  stats: ['admin-checkin-stats'] as const,
  users: (params: object) => ['admin-checkin-users', params] as const,
  leaderboard: ['admin-checkin-leaderboard'] as const,
  dailyStats: ['admin-checkin-daily-stats'] as const,
}

export function useCheckinStats() {
  return useQuery({
    queryKey: CHECKIN_KEYS.stats,
    queryFn: () => checkinApi.getCheckinStats().then((r) => r.data.data),
    retry: false,
  })
}

export function useCheckinUsers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: CHECKIN_KEYS.users(params ?? {}),
    queryFn: () => checkinApi.getCheckinUsers(params).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useCheckinLeaderboard() {
  return useQuery({
    queryKey: CHECKIN_KEYS.leaderboard,
    queryFn: () => checkinApi.getCheckinLeaderboard().then((r) => r.data.data),
    retry: false,
  })
}

export function useCheckinDailyStats() {
  return useQuery({
    queryKey: CHECKIN_KEYS.dailyStats,
    queryFn: () => checkinApi.getCheckinDailyStats().then((r) => r.data.data),
    retry: false,
  })
}
