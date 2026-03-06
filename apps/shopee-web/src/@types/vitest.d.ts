/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void>, TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void>, TestingLibraryMatchers<any, void> {}
}

// Thêm global test functions
declare global {
  const test: typeof import('vitest').test
  const expect: typeof import('vitest').expect
  const describe: typeof import('vitest').describe
  const it: typeof import('vitest').it
  const beforeEach: typeof import('vitest').beforeEach
  const afterEach: typeof import('vitest').afterEach
  const beforeAll: typeof import('vitest').beforeAll
  const afterAll: typeof import('vitest').afterAll
}
