import { create } from 'zustand';
import {
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  clearLS,
  setAccessTokenToLS,
  setRefreshTokenToLS,
} from 'src/utils/http';

export interface User {
  _id: string;
  roles: string[];
  email: string;
  name?: string;
  date_of_birth?: string;
  avatar?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: User | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
}

function getProfileFromLS(): User | null {
  try {
    const profile = localStorage.getItem('profile');
    return profile ? JSON.parse(profile) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getAccessTokenFromLS(),
  refreshToken: getRefreshTokenFromLS(),
  user: getProfileFromLS(),
  isAuthenticated: Boolean(getAccessTokenFromLS()),

  login: (accessToken, refreshToken, user) => {
    setAccessTokenToLS(accessToken);
    setRefreshTokenToLS(refreshToken);
    localStorage.setItem('profile', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    clearLS();
    set({ accessToken: '', refreshToken: '', user: null, isAuthenticated: false });
  },

  setTokens: (accessToken, refreshToken) => {
    setAccessTokenToLS(accessToken);
    if (refreshToken) setRefreshTokenToLS(refreshToken);
    set((state) => ({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
      isAuthenticated: true,
    }));
  },

  setUser: (user) => {
    localStorage.setItem('profile', JSON.stringify(user));
    set({ user });
  },
}));
