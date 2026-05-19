/**
 * Jest Configuration cho api-ecom
 * Cấu hình Jest với projects để tách unit, integration, e2e, và socket tests
 */

// Shared config cho tất cả projects
const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/__tests__/helpers/set-test-env.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      diagnostics: { warnOnly: true },
    }],
  },
  moduleNameMapper: {
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@types/(.*)$': '<rootDir>/src/@types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@schemas/(.*)$': '<rootDir>/src/schemas/$1',
    '^@jobs/(.*)$': '<rootDir>/src/jobs/$1',
    '^nanoid$': '<rootDir>/src/__tests__/helpers/__mocks__/nanoid.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  clearMocks: true,
}

module.exports = {
  verbose: true,
  testTimeout: 30000,

  // Coverage thresholds for payment module (applies when running with --coverage)
  coverageThreshold: {
    './src/services/payment.service.ts': {
      lines: 85,
      functions: 85,
    },
    './src/services/payment/momo.provider.ts': {
      lines: 90,
      functions: 90,
    },
    './src/services/payment/vnpay.provider.ts': {
      lines: 85,
      functions: 85,
    },
    './src/controllers/ipn.controller.ts': {
      lines: 80,
      functions: 80,
    },
    './src/controllers/payment.controller.ts': {
      lines: 80,
      functions: 80,
    },
  },

  // Coverage configuration (applies when running with --coverage)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts',
    '!src/utils/conversation.service.ts',
    '!src/docs/**',
    '!src/repositories/index.ts',
    '!src/services/index.ts',
    '!src/repositories/interfaces/**',
    // Infrastructure / config files — not unit-testable
    '!src/container.ts',
    '!src/routes/**',
    '!src/database/models/**',
    '!src/socket/handlers/**',
    '!src/socket/managers/**',
    '!src/socket/utils/**',
    '!src/socket/socket.init.ts',
    '!src/schemas/index.ts',
  ],

  projects: [
    // Unit tests — existing tests + new schema/repository/middleware tests
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: [
        '**/__tests__/controllers/**/*.test.ts',
        '**/__tests__/services/**/*.test.ts',
        '**/__tests__/middleware/**/*.test.ts',
        '**/__tests__/utils/**/*.test.ts',
        '**/__tests__/schemas/**/*.test.ts',
        '**/__tests__/repositories/**/*.test.ts',
        '**/__tests__/constants/**/*.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 10000,
    },

    // Integration tests — real Express app + in-memory MongoDB
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/setup.ts'],
      testTimeout: 30000,
      // Override transform to suppress pre-existing TS errors (e.g. admin-shops.schema.ts
      // overload mismatches) that are unrelated to integration test logic
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json',
          diagnostics: { warnOnly: true },
        }],
      },
    },

    // E2E tests — full user flow tests
    {
      ...sharedConfig,
      displayName: 'e2e',
      testMatch: ['**/__tests__/e2e/**/*.test.ts'],
      // E2E tests manage their own DB lifecycle via 'import ./setup' in each test file.
      // Do NOT add setupFilesAfterEnv here — it would call connectTestDB() a second time
      // with a different URI, causing "Can't call openUri() on an active connection" errors.
      testTimeout: 60000,
    },

    // Socket tests — WebSocket handler and emit tests
    {
      ...sharedConfig,
      displayName: 'socket',
      testMatch: ['**/__tests__/socket/**/*.test.ts'],
      testTimeout: 15000,
    },
  ],
}
