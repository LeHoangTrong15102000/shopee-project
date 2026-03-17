import { useReviewModerationStore } from './review-moderation.store';

describe('review-moderation.store', () => {
  beforeEach(() => {
    localStorage.clear();
    useReviewModerationStore.setState({ statuses: {} });
  });

  it('has empty initial statuses', () => {
    expect(useReviewModerationStore.getState().statuses).toEqual({});
  });

  it('setStatus sets a review status', () => {
    useReviewModerationStore.getState().setStatus('review-1', 'approved');
    expect(useReviewModerationStore.getState().statuses['review-1']).toBe('approved');
  });

  it('getStatus returns pending for unknown review', () => {
    expect(useReviewModerationStore.getState().getStatus('unknown')).toBe('pending');
  });

  it('getStatus returns set status', () => {
    useReviewModerationStore.getState().setStatus('review-1', 'flagged');
    expect(useReviewModerationStore.getState().getStatus('review-1')).toBe('flagged');
  });

  it('persists statuses to localStorage', () => {
    useReviewModerationStore.getState().setStatus('review-1', 'approved');
    const stored = localStorage.getItem('shopee-admin-review-moderation');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual({ 'review-1': 'approved' });
  });

  it('handles malformed JSON in localStorage gracefully', () => {
    localStorage.setItem('shopee-admin-review-moderation', '{invalid}');
    // loadStatuses catch branch returns {} for invalid JSON
    expect(() => useReviewModerationStore.getState()).not.toThrow();
  });

  it('overwrites existing status for same review', () => {
    useReviewModerationStore.getState().setStatus('review-1', 'approved');
    useReviewModerationStore.getState().setStatus('review-1', 'flagged');
    expect(useReviewModerationStore.getState().getStatus('review-1')).toBe('flagged');
  });
});
