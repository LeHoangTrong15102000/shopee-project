export const AppColors = {
  primary: '#EE4D2D',
  secondary: '#007BFF',
  primaryForeground: '#FFFFFF',
  secondaryForeground: '#FFFFFF',
  foreground: '#fafafa',
  background: '#0a0b0a',
  success: '#a4f4e7',
  warning: '#f4c790',
  error: '#e4626f',
  coin: '#F97316',
  border: '#4d4d4d',
  neutrals100: '#949494',
  neutrals200: '#858585',
  neutrals300: '#7a7a7a',
  neutrals400: '#6e6e6e',
  neutrals500: '#5e5e5e',
  neutrals600: '#4d4d4d',
  neutrals700: '#414240',
  neutrals800: '#1d1d1d',
  neutrals900: '#1c1c1c',
  neutrals1000: '#111111',
  gradientStart: '#1a1a2e',
  gradientMiddle: '#16213e',
  gradientEnd: '#0f3460',
}

export const AppColorsLight: typeof AppColors = {
  primary: '#EE4D2D',
  secondary: '#2D9CDB',
  primaryForeground: '#FFFFFF',
  secondaryForeground: '#FFFFFF',
  foreground: '#1a1a1a',
  background: '#ffffff',
  success: '#7fefe3',
  warning: '#ffe5c1',
  border: '#e8e8e8',
  coin: '#F97316',
  neutrals100: '#6c6c6c',
  neutrals200: '#808080',
  neutrals300: '#9e9e9e',
  neutrals400: '#b4b4b4',
  neutrals500: '#c1c1c1',
  neutrals600: '#d3d3d3',
  neutrals700: '#d9d9d9',
  neutrals800: '#dddddd',
  neutrals900: '#f2f2f2',
  neutrals1000: '#f5f5f5',
  error: '#e4626f',
  gradientStart: '#283593',
  gradientMiddle: '#1a237e',
  gradientEnd: '#0d1b5e',
}

// Spacing tokens (aligned with Tailwind scale)
export const AppSpacing = {
  screenPaddingHorizontal: 24, // p-6
  screenPaddingVertical: 20, // p-5
} as const
