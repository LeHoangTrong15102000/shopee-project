/// <reference types="jest" />

/**
 * Unit tests for Fix #1: Fail-fast on initial MongoDB connection.
 *
 * These tests verify the boot sequence contract:
 *   - connectMongoDB() rejection  → log with "boot dependency failure: MongoDB" marker + process.exit(1)
 *   - connectMongoDB() resolution → no exit, boot continues normally
 *   - HTTP server MUST NOT start when MongoDB connection fails
 *
 * Strategy: exercise the boot sequence logic directly without importing the real index.ts
 * (which has side effects: signal handlers, server start, container jobs).
 * We replicate the async IIFE pattern from index.ts and verify its contract.
 */

// ----- helpers to replicate the boot sequence logic from index.ts -----

interface BootDeps {
  connectMongoDB: () => Promise<void>
  logError: (msg: string, ctx: object) => void
  consoleError: (...args: unknown[]) => void
  exit: (code: number) => void
  startListening: () => void
}

/**
 * Extracted, testable version of the async boot IIFE from index.ts.
 * Mirrors exactly the logic in:
 *
 *   void (async () => {
 *     try { await connectMongoDB() }
 *     catch (err) { Logger.apiError('boot dependency failure: MongoDB ...', ...); process.exit(1) }
 *     httpServer.listen(PORT, ...)
 *   })()
 */
async function bootSequence(deps: BootDeps): Promise<void> {
  try {
    await deps.connectMongoDB()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    deps.logError('boot dependency failure: MongoDB — initial connection rejected', {
      message: error.message,
      stack: error.stack,
    })
    deps.consoleError(
      '[BOOT FAILURE] boot dependency failure: MongoDB — initial connection rejected',
      error,
    )
    deps.exit(1)
    return
  }
  deps.startListening()
}

// ----- tests -----

describe('startup resilience — Fix #1: fail-fast on initial MongoDB connection', () => {
  let logError: jest.Mock
  let consoleError: jest.Mock
  let exit: jest.Mock
  let startListening: jest.Mock

  beforeEach(() => {
    logError = jest.fn()
    consoleError = jest.fn()
    exit = jest.fn().mockImplementation(() => {
      // In real code process.exit never returns; in tests we just capture the call
    }) as jest.Mock
    startListening = jest.fn()
  })

  it('connectMongoDB() rejection: logs boot-failure marker and calls process.exit(1)', async () => {
    const connectError = new Error('ECONNREFUSED: MongoDB unreachable')
    const connectMongoDB = jest.fn().mockRejectedValue(connectError)

    await bootSequence({ connectMongoDB, logError, consoleError, exit, startListening })

    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('boot dependency failure: MongoDB'),
      expect.objectContaining({
        message: 'ECONNREFUSED: MongoDB unreachable',
        stack: expect.any(String),
      }),
    )
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('connectMongoDB() rejection: server does NOT start listening', async () => {
    const connectMongoDB = jest.fn().mockRejectedValue(new Error('Mongo down'))

    await bootSequence({ connectMongoDB, logError, consoleError, exit, startListening })

    expect(startListening).not.toHaveBeenCalled()
  })

  it('connectMongoDB() rejection: exit log is distinguishable from graceful shutdown', async () => {
    const connectMongoDB = jest.fn().mockRejectedValue(new Error('Mongo down'))

    await bootSequence({ connectMongoDB, logError, consoleError, exit, startListening })

    // The log message must mention "boot" or "startup" — NOT "shutdown" / "SIGTERM" / "SIGINT"
    const logMsg = (logError.mock.calls[0] as [string, object])[0]
    expect(logMsg).toMatch(/boot|startup/i)
    expect(logMsg).not.toMatch(/shutdown|SIGTERM|SIGINT/i)
  })

  it('connectMongoDB() resolution: no exit triggered', async () => {
    const connectMongoDB = jest.fn().mockResolvedValue(undefined)

    await bootSequence({ connectMongoDB, logError, consoleError, exit, startListening })

    expect(exit).not.toHaveBeenCalled()
    expect(logError).not.toHaveBeenCalled()
  })

  it('connectMongoDB() resolution: server begins listening', async () => {
    const connectMongoDB = jest.fn().mockResolvedValue(undefined)

    await bootSequence({ connectMongoDB, logError, consoleError, exit, startListening })

    expect(startListening).toHaveBeenCalledTimes(1)
  })

  it('non-Error rejection (string) is handled gracefully', async () => {
    const connectMongoDB = jest.fn().mockRejectedValue('string rejection reason')

    await bootSequence({ connectMongoDB, logError, consoleError, exit, startListening })

    expect(exit).toHaveBeenCalledWith(1)
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('boot dependency failure: MongoDB'),
      expect.objectContaining({ message: 'string rejection reason' }),
    )
  })
})
