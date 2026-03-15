import { useAuthStore } from './auth.store';
import { createMockUser } from 'src/test-utils/factories';

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: '',
      refreshToken: '',
      user: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('');
    expect(state.refreshToken).toBe('');
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('login sets tokens, user, and isAuthenticated', () => {
    const user = createMockUser({ roles: ['Admin'] });
    useAuthStore.getState().login('access-123', 'refresh-456', user);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('login persists tokens to localStorage', () => {
    const user = createMockUser();
    useAuthStore.getState().login('access-123', 'refresh-456', user);

    expect(localStorage.getItem('accessToken')).toBe('access-123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
    expect(localStorage.getItem('profile')).toBeTruthy();
  });

  it('logout clears state and localStorage', () => {
    const user = createMockUser();
    useAuthStore.getState().login('access-123', 'refresh-456', user);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('');
    expect(state.refreshToken).toBe('');
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setTokens updates access token', () => {
    useAuthStore.getState().setTokens('new-access');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.isAuthenticated).toBe(true);
  });

  it('setTokens updates both tokens when refresh provided', () => {
    useAuthStore.getState().setTokens('new-access', 'new-refresh');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
  });
});
