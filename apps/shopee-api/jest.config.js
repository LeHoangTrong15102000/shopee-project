/**
 * Jest Configuration cho api-ecom
 * Cấu hình Jest với projects để tách unit, integration, e2e, và socket tests
 */

// Shared config cho tất cả projects
const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
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
    '^nanoid$': '<rootDir>/src/__tests__/helpers/__mocks__/nanoid.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  clearMocks: true,
  verbose: true,
}

module.exports = {
  // Coverage configuration (applies when running with --coverage)
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/__tests__/**', '!src/index.ts'],

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
    },

    // E2E tests — full user flow tests
    {
      ...sharedConfig,
      displayName: 'e2e',
      testMatch: ['**/__tests__/e2e/**/*.test.ts'],
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
