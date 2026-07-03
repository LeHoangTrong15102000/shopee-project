const path = require('path')

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/\\.pnpm/(?!((jest-)?react-native|@react-native|expo|@expo|react-navigation|@react-navigation|@sentry|native-base|react-native-svg|lucide-react-native|nativewind|class-variance-authority|clsx|tailwind-merge|@tanstack|i18next|react-i18next|msw|@bundled-es-modules|until-async|@gorhom))',
    'node_modules/(?!\\.pnpm)(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|lucide-react-native|nativewind|class-variance-authority|clsx|tailwind-merge|@tanstack|i18next|react-i18next|msw|until-async|@gorhom)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native-css-interop/jsx-runtime$': 'react/jsx-runtime',
    '^react-native-css-interop/jsx-dev-runtime$': 'react/jsx-dev-runtime',
    '^react-native-css-interop(.*)$': '<rootDir>/__mocks__/react-native-css-interop.js',
    '^msw/node$': '<rootDir>/../../node_modules/msw/lib/node/index.js',
  },
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  moduleDirectories: ['node_modules', path.join(__dirname, '../../node_modules')],
}
