#!/usr/bin/env node
/**
 * i18n Hardcoded Vietnamese String Detector
 *
 * Scans .tsx files for Vietnamese Unicode characters (diacritical marks)
 * in string literals and JSX attributes that should use t() instead.
 *
 * Usage: npx tsx scripts/check-i18n-hardcoded.ts
 * Exit code 0 = clean, 1 = violations found
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, '..', 'src')

// Vietnamese diacritical character ranges
// U+1E00-U+1EFF covers Vietnamese-specific diacritical combinations (ắ, ằ, ẳ, ẵ, ặ, etc.)
// U+00C0-U+00FF covers common accented Latin chars shared with Vietnamese (à, á, â, ã, è, é, ê, etc.)
// U+0100-U+01B0 covers ơ (U+01A0), ư (U+01AF) and other Vietnamese-used extended Latin
// U+0300-U+036F covers combining diacritical marks used in Vietnamese
const VIETNAMESE_REGEX = /[\u00C0-\u00FF\u0100-\u01B0\u0300-\u036F\u1E00-\u1EFF]/

// Files/directories to exclude from scanning
const EXCLUDED_PATHS = [
  'src/locales/', // locale JSON files
  'src/data/vietnamLocations.ts', // geographic proper nouns
  'src/NotePage/', // documentation/notes
  'src/msw/', // mock service workers (test infrastructure)
  'src/utils/testUtils.tsx', // test utility mock data
]

// Baseline: files with known hardcoded Vietnamese not yet extracted (out of scope for initial i18n change).
// These will be addressed in future i18n extraction passes.
// The script still catches NEW files introducing hardcoded Vietnamese.
const BASELINE_EXCLUDED_PATHS = [
  'src/components/Chat/',
  'src/components/ComparisonTable/',
  'src/components/ErrorBoundary/',
  'src/components/FlashSale/',
  'src/components/Footer/',
  'src/components/Header/',
  'src/components/HeroBanner/',
  'src/components/InputFile/',
  'src/components/InventoryAlertBadge/',
  'src/components/KeyboardShortcutsProvider/',
  'src/components/LiveOrderTracker/',
  'src/components/LiveReviewFeed/',
  'src/components/MobileAccountNav/',
  'src/components/MobileNavigationDrawer/',
  'src/components/NavHeader/',
  'src/components/OnlineIndicator/',
  'src/components/OrderCard/',
  'src/components/OrderPreview/',
  'src/components/OrderSearchFilter/',
  'src/components/OrderStatusTracker/',
  'src/components/OrderSummary/',
  'src/components/OrderTimeline/',
  'src/components/OrderTrackingTimeline/',
  'src/components/PasswordStrengthMeter/',
  'src/components/PaymentForm/',
  'src/components/PriceDropBadge/',
  'src/components/ProductReviewModal/',
  'src/components/ProductReviews/',
  'src/components/ProductVariantSelector/',
  'src/components/ProfileCompletion/',
  'src/components/RealTimeStockAlert/',
  'src/components/RecentlyViewed/',
  'src/components/SaveForLaterSection/',
  'src/components/SearchHistory/',
  'src/components/SearchNoResults/',
  'src/components/SEO/',
  'src/components/ShareButton/',
  'src/components/ShippingMethodModal/',
  'src/components/Skeleton/',
  'src/components/StockBadge/',
  'src/components/ThemeToggle/',
  'src/components/UserChatButton/',
  'src/components/ViewToggle/',
  'src/components/WishlistPriceAlert/',
  'src/pages/Cart/',
  'src/pages/Checkout/',
  'src/pages/NotFound/',
  'src/pages/ProductList/components/AsideFilter/AsideFilter.tsx', // partially extracted, remaining Vietnamese in non-aria contexts
  'src/pages/ProductList/components/Product/',
  'src/pages/ProductList/components/RatingStars/',
  'src/pages/ProductList/ProductList.tsx',
  'src/pages/ProductList/ProductListInfinite.tsx',
  'src/pages/User/',
  'src/useRouteElements.tsx',
]

// File patterns to exclude
const EXCLUDED_PATTERNS = [
  /\.test\.(tsx?|jsx?)$/, // test files
  /\.spec\.(tsx?|jsx?)$/, // spec files
  /\.stories\.(tsx?|jsx?)$/, // storybook files
]

interface Violation {
  file: string
  line: number
  text: string
}

function isExcludedPath(filePath: string): boolean {
  const relative = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/')
  return (
    EXCLUDED_PATHS.some((exc) => relative.startsWith(exc) || relative === exc) ||
    BASELINE_EXCLUDED_PATHS.some((exc) => relative.startsWith(exc) || relative === exc)
  )
}

function isExcludedPattern(filePath: string): boolean {
  const basename = path.basename(filePath)
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(basename))
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('{/*')
  )
}

/**
 * Strip inline comments from a line of code.
 * Handles // comments and removes them so Vietnamese in comments isn't flagged.
 * Simple heuristic: find // that's not inside a string literal.
 */
function stripInlineComment(line: string): string {
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    const prev = i > 0 ? line[i - 1] : ''

    if (prev === '\\') continue

    if (ch === "'" && !inDouble && !inTemplate) inSingle = !inSingle
    else if (ch === '"' && !inSingle && !inTemplate) inDouble = !inDouble
    else if (ch === '`' && !inSingle && !inDouble) inTemplate = !inTemplate
    else if (ch === '/' && line[i + 1] === '/' && !inSingle && !inDouble && !inTemplate) {
      return line.substring(0, i)
    }
  }
  return line
}

function isImportLine(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('import ') || trimmed.startsWith('from ')
}

function hasIgnoreDirective(line: string): boolean {
  return line.includes('// i18n-ignore')
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Skip exclusions
    if (hasIgnoreDirective(line)) continue
    if (isCommentLine(line)) continue
    if (isImportLine(line)) continue

    // Strip inline comments before checking for Vietnamese
    const codeOnly = stripInlineComment(line)

    // Check for Vietnamese characters in code (not comments)
    if (VIETNAMESE_REGEX.test(codeOnly)) {
      // Extract the Vietnamese text snippet for reporting
      const match = line.match(/[\u00C0-\u024F\u1E00-\u1EFF][^\n'"`,;)}\]]*/)
      const text = match ? match[0].trim().substring(0, 60) : '(Vietnamese text detected)'

      violations.push({
        file: path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/'),
        line: lineNum,
        text,
      })
    }
  }

  return violations
}

function findSourceFiles(dir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue
        walk(fullPath)
      } else if (entry.name.endsWith('.tsx')) {
        if (!isExcludedPath(fullPath) && !isExcludedPattern(fullPath)) {
          files.push(fullPath)
        }
      }
    }
  }

  walk(dir)
  return files
}

// Main
const files = findSourceFiles(SRC_DIR)
const allViolations: Violation[] = []

for (const file of files) {
  allViolations.push(...scanFile(file))
}

if (allViolations.length === 0) {
  console.log('✅ No hardcoded Vietnamese strings found in source files.')
  process.exit(0)
} else {
  console.log(`❌ Found ${allViolations.length} hardcoded Vietnamese string(s):\n`)
  for (const v of allViolations) {
    console.log(
      `${v.file}:${v.line} — Found Vietnamese text: "${v.text}" → Consider using t('<namespace>.<key>')`,
    )
  }
  console.log(`\n💡 Extract these strings to locale JSON files and use t() instead.`)
  process.exit(1)
}
