/// <reference types="jest" />

import { PrettyFormatter } from '@utils/logger/pretty-formatter'

// Strip ANSI color codes so we can assert on plain text
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '')
}

describe('PrettyFormatter', () => {
  let formatter: PrettyFormatter

  beforeEach(() => {
    formatter = new PrettyFormatter()
  })

  describe('output structure', () => {
    it('contains timestamp in brackets', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'test message'))
      // Matches [2024-01-01T00:00:00.000Z] style
      expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
    })

    it('contains level in uppercase brackets', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'test message'))
      expect(output).toContain('[INFO]')
    })

    it('contains category in brackets', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'test message'))
      expect(output).toContain('[API]')
    })

    it('contains the message', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'hello world'))
      expect(output).toContain('hello world')
    })

    it('formats error level as [ERROR]', () => {
      const output = stripAnsi(formatter.format('error', 'API', 'err'))
      expect(output).toContain('[ERROR]')
    })

    it('formats warn level as [WARN]', () => {
      const output = stripAnsi(formatter.format('warn', 'API', 'warn'))
      expect(output).toContain('[WARN]')
    })

    it('formats debug level as [DEBUG]', () => {
      const output = stripAnsi(formatter.format('debug', 'API', 'dbg'))
      expect(output).toContain('[DEBUG]')
    })
  })

  describe('requestId handling', () => {
    it('includes requestId in its own bracket slot when present in meta', () => {
      const output = stripAnsi(
        formatter.format('info', 'API', 'test', { requestId: 'req-abc-123' }),
      )
      expect(output).toContain('[req-abc-123]')
    })

    it('does not include requestId bracket when not in meta', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'test'))
      // Should not have a bracket that looks like a UUID or request id
      expect(output).not.toMatch(/\[req-/)
    })

    it('does not include requestId in the JSON meta section', () => {
      const output = stripAnsi(
        formatter.format('info', 'API', 'test', { requestId: 'req-abc', userId: 'u1' }),
      )
      // requestId should appear as its own bracket, not inside the JSON blob
      expect(output).toContain('[req-abc]')
      // The remaining meta JSON should contain userId but not requestId
      const jsonPart = output.substring(output.indexOf('{'))
      const parsed = JSON.parse(jsonPart)
      expect(parsed).toHaveProperty('userId', 'u1')
      expect(parsed).not.toHaveProperty('requestId')
    })
  })

  describe('meta serialization', () => {
    it('includes remaining meta as JSON', () => {
      const output = stripAnsi(
        formatter.format('info', 'API', 'test', { userId: 'u1', action: 'login' }),
      )
      expect(output).toContain('"userId"')
      expect(output).toContain('"u1"')
      expect(output).toContain('"action"')
      expect(output).toContain('"login"')
    })

    it('does not append meta section when meta is empty', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'test', {}))
      expect(output).not.toContain('{')
    })

    it('does not append meta section when meta is undefined', () => {
      const output = stripAnsi(formatter.format('info', 'API', 'test'))
      expect(output).not.toContain('{')
    })

    it('does not append meta section when only requestId is in meta', () => {
      const output = stripAnsi(
        formatter.format('info', 'API', 'test', { requestId: 'req-xyz' }),
      )
      // requestId gets its own bracket; no remaining meta JSON
      expect(output).not.toContain('{')
    })
  })

  describe('Error serialization in meta', () => {
    it('serializes Error objects with name, message, stack', () => {
      const err = new Error('something failed')
      const output = stripAnsi(formatter.format('error', 'API', 'error occurred', { err }))
      expect(output).toContain('"name"')
      expect(output).toContain('"Error"')
      expect(output).toContain('"message"')
      expect(output).toContain('"something failed"')
      expect(output).toContain('"stack"')
    })

    it('handles TypeError subclass', () => {
      const err = new TypeError('bad type')
      const output = stripAnsi(formatter.format('error', 'API', 'type error', { error: err }))
      expect(output).toContain('"TypeError"')
      expect(output).toContain('"bad type"')
    })
  })

  describe('non-serializable meta', () => {
    it('falls back gracefully when JSON.stringify throws (e.g. BigInt value)', () => {
      const meta: Record<string, unknown> = { count: BigInt(42) }
      let output: string
      expect(() => {
        output = stripAnsi(formatter.format('info', 'API', 'bigint test', meta))
      }).not.toThrow()
      // Should still contain the message
      expect(output!).toContain('bigint test')
    })
  })

  describe('category variants', () => {
    it('uses the provided category string', () => {
      const output = stripAnsi(formatter.format('info', 'DATABASE', 'query'))
      expect(output).toContain('[DATABASE]')
    })

    it('uses CHATBOT category', () => {
      const output = stripAnsi(formatter.format('debug', 'CHATBOT', 'thinking'))
      expect(output).toContain('[CHATBOT]')
    })
  })
})
