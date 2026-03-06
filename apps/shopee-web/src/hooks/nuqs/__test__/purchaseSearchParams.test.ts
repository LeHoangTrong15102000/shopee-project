import { describe, it, expect } from 'vitest'
import { purchaseStatusParser } from '../purchaseSearchParams'

describe('purchaseStatusParser', () => {
  it('has default value of 0', () => {
    expect(purchaseStatusParser.defaultValue).toBe(0)
  })

  it('parses integer strings correctly', () => {
    expect(purchaseStatusParser.parse('1')).toBe(1)
    expect(purchaseStatusParser.parse('5')).toBe(5)
    expect(purchaseStatusParser.parse('100')).toBe(100)
    expect(purchaseStatusParser.parse('-1')).toBe(-1)
    expect(purchaseStatusParser.parse('0')).toBe(0)
  })

  it('returns default for invalid input', () => {
    expect(purchaseStatusParser.parseServerSide(undefined)).toBe(0)
    expect(purchaseStatusParser.parseServerSide('')).toBe(0)
  })

  it('serializes integers to strings', () => {
    expect(purchaseStatusParser.serialize(1)).toBe('1')
    expect(purchaseStatusParser.serialize(0)).toBe('0')
    expect(purchaseStatusParser.serialize(99)).toBe('99')
  })
})
