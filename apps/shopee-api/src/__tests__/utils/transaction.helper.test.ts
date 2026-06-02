/// <reference types="jest" />

/**
 * Task 2.4 — Unit tests for `withTransaction` helper
 *
 * Tests:
 * - Happy path: fn resolves → session.commitTransaction called, result returned, session ended
 * - Error path: fn throws → session.abortTransaction called, error re-thrown, session ended
 * - Transient error retry: WriteConflict (code 112) retried up to maxRetries, then throws
 * - TransientTransactionError label: retried up to maxRetries
 * - Non-transient error: no retry, aborts immediately
 * - Session lifecycle: endSession always called (in finally block)
 */

// Mock mongoose before importing the helper so the module picks up the mock
jest.mock('mongoose', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  }

  return {
    startSession: jest.fn().mockResolvedValue(mockSession),
    // expose the mock session so tests can configure it
    __mockSession: mockSession,
  }
})

// Mock Logger to suppress output in tests
jest.mock('../../utils/logger', () => ({
  Logger: {
    dbInfo: jest.fn(),
    dbWarn: jest.fn(),
    dbError: jest.fn(),
  },
}))

import mongoose from 'mongoose'
import { withTransaction } from '../../utils/transaction.helper'

// Helper to access the shared mock session configured above
function getMockSession() {
  return (mongoose as any).__mockSession as {
    startTransaction: jest.Mock
    commitTransaction: jest.Mock
    abortTransaction: jest.Mock
    endSession: jest.Mock
  }
}

describe('withTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-configure startSession to return the mock session after clearAllMocks
    const session = getMockSession()
    ;(mongoose.startSession as jest.Mock).mockResolvedValue(session)
    // Default: commit and abort succeed
    session.commitTransaction.mockResolvedValue(undefined)
    session.abortTransaction.mockResolvedValue(undefined)
    session.endSession.mockResolvedValue(undefined)
  })

  describe('happy path', () => {
    it('calls fn with the session, commits, and returns the result', async () => {
      const session = getMockSession()
      const fn = jest.fn().mockResolvedValue('result')

      const result = await withTransaction(fn)

      expect(fn).toHaveBeenCalledWith(session)
      expect(session.startTransaction).toHaveBeenCalledTimes(1)
      expect(session.commitTransaction).toHaveBeenCalledTimes(1)
      expect(session.abortTransaction).not.toHaveBeenCalled()
      expect(result).toBe('result')
    })

    it('ends session after successful commit', async () => {
      const session = getMockSession()
      const fn = jest.fn().mockResolvedValue(42)

      await withTransaction(fn)

      expect(session.endSession).toHaveBeenCalledTimes(1)
    })

    it('passes the session object to fn so it can thread it to Mongoose calls', async () => {
      const session = getMockSession()
      let capturedSession: unknown

      await withTransaction(async (s) => {
        capturedSession = s
        return 'ok'
      })

      expect(capturedSession).toBe(session)
    })
  })

  describe('error handling — non-transient error', () => {
    it('aborts, re-throws, and still ends session', async () => {
      const session = getMockSession()
      const error = new Error('Hard failure')
      const fn = jest.fn().mockRejectedValue(error)

      await expect(withTransaction(fn)).rejects.toThrow('Hard failure')

      expect(session.abortTransaction).toHaveBeenCalledTimes(1)
      expect(session.commitTransaction).not.toHaveBeenCalled()
      expect(session.endSession).toHaveBeenCalledTimes(1)
    })

    it('does not retry on non-transient errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('permanent error'))

      await expect(withTransaction(fn, { maxRetries: 3 })).rejects.toThrow()

      // fn should only be called once — no retry
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('retry logic — transient errors', () => {
    it('retries on WriteConflict (code 112) up to maxRetries then commits on success', async () => {
      const session = getMockSession()
      const writeConflictError = Object.assign(new Error('WriteConflict'), { code: 112 })

      const fn = jest
        .fn()
        .mockRejectedValueOnce(writeConflictError)
        .mockRejectedValueOnce(writeConflictError)
        .mockResolvedValueOnce('ok')

      const result = await withTransaction(fn, { maxRetries: 3 })

      expect(fn).toHaveBeenCalledTimes(3)
      expect(result).toBe('ok')
      expect(session.commitTransaction).toHaveBeenCalledTimes(1)
      // Aborted twice before the final success
      expect(session.abortTransaction).toHaveBeenCalledTimes(2)
    })

    it('retries on TransientTransactionError label up to maxRetries then commits', async () => {
      const session = getMockSession()
      const transientError = Object.assign(new Error('TransientTransactionError'), {
        errorLabels: ['TransientTransactionError'],
      })

      const fn = jest.fn().mockRejectedValueOnce(transientError).mockResolvedValueOnce('committed')

      const result = await withTransaction(fn, { maxRetries: 3 })

      expect(fn).toHaveBeenCalledTimes(2)
      expect(result).toBe('committed')
      expect(session.commitTransaction).toHaveBeenCalledTimes(1)
      expect(session.abortTransaction).toHaveBeenCalledTimes(1)
    })

    it('retries on UnknownTransactionCommitResult label', async () => {
      const commitError = Object.assign(new Error('UnknownTransactionCommitResult'), {
        errorLabels: ['UnknownTransactionCommitResult'],
      })

      const fn = jest.fn().mockRejectedValueOnce(commitError).mockResolvedValueOnce('done')

      const result = await withTransaction(fn, { maxRetries: 3 })

      expect(fn).toHaveBeenCalledTimes(2)
      expect(result).toBe('done')
    })

    it('exhausts retries and throws the transient error after maxRetries attempts', async () => {
      const session = getMockSession()
      const writeConflict = Object.assign(new Error('WriteConflict'), { code: 112 })
      const fn = jest.fn().mockRejectedValue(writeConflict)

      await expect(withTransaction(fn, { maxRetries: 2 })).rejects.toThrow('WriteConflict')

      // Called exactly maxRetries times
      expect(fn).toHaveBeenCalledTimes(2)
      expect(session.abortTransaction).toHaveBeenCalledTimes(2)
    })

    it('always ends session even when all retries are exhausted', async () => {
      const session = getMockSession()
      const writeConflict = Object.assign(new Error('WriteConflict'), { code: 112 })
      jest.fn().mockRejectedValue(writeConflict)

      await expect(
        withTransaction(() => Promise.reject(writeConflict), { maxRetries: 2 }),
      ).rejects.toThrow()

      expect(session.endSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('session lifecycle', () => {
    it('starts a mongoose session for every invocation', async () => {
      const fn = jest.fn().mockResolvedValue(undefined)

      await withTransaction(fn)
      await withTransaction(fn)

      expect(mongoose.startSession).toHaveBeenCalledTimes(2)
    })

    it('is usable from any service — only requires a fn parameter', async () => {
      // Demonstrates that withTransaction is standalone and service-agnostic
      let sessionsReceived = 0
      await withTransaction(async (session) => {
        if (session) sessionsReceived++
        return true
      })

      expect(sessionsReceived).toBe(1)
    })
  })
})
