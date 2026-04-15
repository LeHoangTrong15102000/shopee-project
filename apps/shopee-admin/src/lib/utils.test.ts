import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    // eslint-disable-next-line no-constant-binary-expression
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles empty arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})
