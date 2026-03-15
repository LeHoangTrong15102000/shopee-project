import { useThemeStore } from './theme.store';

describe('theme.store', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to light theme
    useThemeStore.setState({ theme: 'light' });
    document.documentElement.classList.remove('dark');
  });

  it('has initial theme', () => {
    const state = useThemeStore.getState();
    expect(['light', 'dark']).toContain(state.theme);
  });

  it('toggleTheme switches from light to dark', () => {
    useThemeStore.setState({ theme: 'light' });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('toggleTheme switches from dark to light', () => {
    useThemeStore.setState({ theme: 'dark' });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('setTheme sets specific theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('persists theme to localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
