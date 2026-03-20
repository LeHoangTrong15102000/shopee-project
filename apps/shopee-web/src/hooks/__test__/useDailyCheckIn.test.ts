import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDailyCheckIn } from '../useDailyCheckIn';
import checkinApi from 'src/apis/checkin.api';

vi.mock('src/apis/checkin.api', () => ({
  default: {
    getStreak: vi.fn(),
    checkIn: vi.fn(),
  },
}));

describe('useDailyCheckIn', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns initial state with canCheckInToday true', () => {
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useDailyCheckIn());

    expect(result.current.canCheckInToday).toBe(true);
    expect(result.current.streak.current).toBe(0);
    expect(result.current.totalCoins).toBe(0);
  });

  it('loads streak from API on mount', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue({
      data: {
        data: {
          current_streak: 5,
          longest_streak: 10,
          last_checkin_date: '2026-03-15',
          total_coins: 100,
          can_checkin_today: true,
        },
      },
    } as any);

    const { result } = renderHook(() => useDailyCheckIn());

    await waitFor(() => {
      expect(result.current.streak.current).toBe(5);
    });

    expect(result.current.streak.longest).toBe(10);
    expect(result.current.totalCoins).toBe(100);
    expect(result.current.canCheckInToday).toBe(true);
  });

  it('falls back to localStorage when API fails', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const storedData = {
      streak: { current: 3, longest: 5, lastCheckIn: yesterdayStr },
      history: [],
      totalCoins: 50,
    };
    localStorage.setItem('shopee_daily_checkin', JSON.stringify(storedData));
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useDailyCheckIn());

    await waitFor(() => {
      expect(result.current.streak.current).toBe(3);
    });

    expect(result.current.totalCoins).toBe(50);
  });

  it('exposes checkIn and getMonthCalendar functions', () => {
    vi.mocked(checkinApi.getStreak).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useDailyCheckIn());

    expect(typeof result.current.checkIn).toBe('function');
    expect(typeof result.current.getMonthCalendar).toBe('function');
  });

  it('getMonthCalendar returns array of days', async () => {
    vi.mocked(checkinApi.getStreak).mockResolvedValue({
      data: {
        data: {
          current_streak: 0,
          longest_streak: 0,
          last_checkin_date: null,
          total_coins: 0,
          can_checkin_today: true,
        },
      },
    } as any);

    const { result } = renderHook(() => useDailyCheckIn());

    await waitFor(() => {
      expect(result.current.canCheckInToday).toBe(true);
    });

    const calendar = result.current.getMonthCalendar(2026, 2);

    expect(calendar.length).toBe(31);
    expect(calendar[0].date).toBe('2026-03-01');
    expect(calendar[0].checked).toBe(false);
  });
});
