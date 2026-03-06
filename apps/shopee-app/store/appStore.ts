import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { colorScheme } from 'nativewind';
import { LanguageCode } from '@/config/i18n';
import * as Localization from 'expo-localization';

// MMKV instance (shared, can be imported elsewhere if needed)
export const storage = new MMKV();

// Zustand-compatible MMKV storage adapter
const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

// Types
export type Theme = 'light' | 'dark';

export interface Insets {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface AppState {
  // State
  theme: Theme;
  language: LanguageCode;
  insets: Insets;
  isFirstLaunch: boolean;
  isLoading: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: LanguageCode) => void;
  setInsets: (insets: Insets) => void;
  setIsFirstLaunch: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'dark',
      language: (Localization.getLocales()[0]?.languageCode as LanguageCode) ?? 'en',
      insets: { left: 0, top: 0, right: 0, bottom: 0 },
      isFirstLaunch: true,
      isLoading: false,

      // Actions
      setTheme: (theme) => {
        colorScheme.set(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          colorScheme.set(newTheme);
          return { theme: newTheme };
        }),
      setLanguage: (language) => set({ language }),
      setInsets: (insets) => set({ insets }),
      setIsFirstLaunch: (value) => set({ isFirstLaunch: value }),
      setIsLoading: (value) => set({ isLoading: value }),
    }),
    {
      name: 'app-storage',
      version: 1, // Bump when state shape changes — enables future migrations
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist essential state; insets and isLoading are transient
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        isFirstLaunch: state.isFirstLaunch,
      }),
      // Sync theme with nativewind after rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          colorScheme.set(state.theme);
        }
      },
    }
  )
);

