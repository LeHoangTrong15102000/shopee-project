import { create } from 'zustand';

type ModerationStatus = 'pending' | 'approved' | 'flagged';

interface ReviewModerationState {
  statuses: Record<string, ModerationStatus>;
  setStatus: (reviewId: string, status: ModerationStatus) => void;
  getStatus: (reviewId: string) => ModerationStatus;
}

const STORAGE_KEY = 'shopee-admin-review-moderation';

function loadStatuses(): Record<string, ModerationStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatuses(statuses: Record<string, ModerationStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
}

export const useReviewModerationStore = create<ReviewModerationState>((set, get) => ({
  statuses: loadStatuses(),

  setStatus: (reviewId, status) =>
    set((state) => {
      const updated = { ...state.statuses, [reviewId]: status };
      saveStatuses(updated);
      return { statuses: updated };
    }),

  getStatus: (reviewId) => get().statuses[reviewId] ?? 'pending',
}));
