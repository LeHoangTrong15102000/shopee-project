import { useQuery } from '@tanstack/react-query';
import analyticsApi from 'src/apis/analytics.api';

export const ANALYTICS_KEYS = {
  topSelling: (period: string) => ['analytics-top-selling', period] as const,
  topViewed: ['analytics-top-viewed'] as const,
  topRated: ['analytics-top-rated'] as const,
  byCategory: ['analytics-by-category'] as const,
  chatbot: ['analytics-chatbot'] as const,
  chatbotPerformance: (period: string) => ['analytics-chatbot-performance', period] as const,
};

export function useTopSelling(period: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topSelling(period),
    queryFn: () => analyticsApi.getTopSelling({ period, limit: 20 }).then((r) => r.data.data),
  });
}

export function useTopViewed() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topViewed,
    queryFn: () => analyticsApi.getTopViewed({ limit: 20 }).then((r) => r.data.data),
  });
}

export function useTopRated() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topRated,
    queryFn: () => analyticsApi.getTopRated({ limit: 20 }).then((r) => r.data.data),
  });
}

export function useStatsByCategory() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.byCategory,
    queryFn: () => analyticsApi.getStatsByCategory().then((r) => r.data.data),
  });
}

export function useChatbotOverview() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.chatbot,
    queryFn: () => analyticsApi.getChatbotOverview().then((r) => r.data.data),
  });
}

export function useChatbotPerformance(period: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.chatbotPerformance(period),
    queryFn: () => analyticsApi.getChatbotPerformance({ period }).then((r) => r.data.data),
  });
}
