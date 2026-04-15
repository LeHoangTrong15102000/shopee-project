import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const LOCALES_DIR = path.resolve(__dirname, '..')
const EN_DIR = path.join(LOCALES_DIR, 'en')
const VI_DIR = path.join(LOCALES_DIR, 'vi')

// Dynamically discover all namespace files
const namespaceFiles = fs
  .readdirSync(EN_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))

// Extract {{...}} interpolation placeholders from a string
function extractPlaceholders(value: string): string[] {
  const matches = value.match(/\{\{[^}]+\}\}/g)
  return matches ? matches.sort() : []
}

// Flatten nested JSON keys (supports flat dot-notation keys too)
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key] as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

// Get leaf values as a flat map
function getLeafValues(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, getLeafValues(obj[key] as Record<string, unknown>, fullKey))
    } else {
      result[fullKey] = String(obj[key])
    }
  }
  return result
}

describe('i18n Translation Parity Tests', () => {
  it(`should have matching namespace files in en/ and vi/ directories`, () => {
    const enFiles = fs
      .readdirSync(EN_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort()
    const viFiles = fs
      .readdirSync(VI_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort()
    expect(enFiles).toEqual(viFiles)
  })

  describe.each(namespaceFiles)('namespace: %s', (namespace) => {
    const enPath = path.join(EN_DIR, `${namespace}.json`)
    const viPath = path.join(VI_DIR, `${namespace}.json`)

    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, unknown>
    const viJson = JSON.parse(fs.readFileSync(viPath, 'utf-8')) as Record<string, unknown>

    const enKeys = getAllKeys(enJson).sort()
    const viKeys = getAllKeys(viJson).sort()

    it('every EN key exists in VI', () => {
      const missingInVi = enKeys.filter((k) => !viKeys.includes(k))
      expect(missingInVi, `Keys in en/${namespace}.json missing from vi/${namespace}.json`).toEqual(
        [],
      )
    })

    it('every VI key exists in EN', () => {
      const missingInEn = viKeys.filter((k) => !enKeys.includes(k))
      expect(missingInEn, `Keys in vi/${namespace}.json missing from en/${namespace}.json`).toEqual(
        [],
      )
    })

    it('no key has an empty string value in EN', () => {
      const enValues = getLeafValues(enJson)
      const emptyKeys = Object.entries(enValues)
        .filter(([, v]) => v === '')
        .map(([k]) => k)
      expect(emptyKeys, `Empty values in en/${namespace}.json`).toEqual([])
    })

    it('no key has an empty string value in VI', () => {
      const viValues = getLeafValues(viJson)
      const emptyKeys = Object.entries(viValues)
        .filter(([, v]) => v === '')
        .map(([k]) => k)
      expect(emptyKeys, `Empty values in vi/${namespace}.json`).toEqual([])
    })

    it('interpolation placeholders match between EN and VI', () => {
      const enValues = getLeafValues(enJson)
      const viValues = getLeafValues(viJson)
      const mismatches: string[] = []

      for (const key of enKeys) {
        if (viValues[key] === undefined) continue // key parity tested separately
        const enPlaceholders = extractPlaceholders(enValues[key])
        const viPlaceholders = extractPlaceholders(viValues[key])
        if (JSON.stringify(enPlaceholders) !== JSON.stringify(viPlaceholders)) {
          mismatches.push(
            `${key}: EN has ${JSON.stringify(enPlaceholders)}, VI has ${JSON.stringify(viPlaceholders)}`,
          )
        }
      }

      expect(mismatches, `Placeholder mismatches in ${namespace}`).toEqual([])
    })
  })
})
