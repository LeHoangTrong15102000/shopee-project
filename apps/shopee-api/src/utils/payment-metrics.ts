/**
 * In-memory payment event counters and sliding-window failure-rate alert.
 * Resets on server restart (intentional — lightweight monitoring only).
 *
 * Counters:
 *   initiated     — incremented at the start of initiatePayment()
 *   ipn_received  — incremented at the start of handleIpn()
 *   success       — incremented when IPN resolves to SUCCESS
 *   failed        — incremented when IPN resolves to FAILED
 *
 * Sliding-window alert:
 *   Maintains a circular buffer of timestamped outcome events (success/failed).
 *   On each increment, prunes events older than 5 minutes, then computes
 *   failure rate = failed / (success + failed).
 *   Logs a CRITICAL alert when rate > 10% AND total events >= 5.
 *   A 60-second debounce prevents log flooding.
 */

import { Logger } from '@utils/logger'

// ─── Counters ────────────────────────────────────────────────────────────────

interface PaymentCounters {
  initiated: number
  ipn_received: number
  success: number
  failed: number
}

const counters: PaymentCounters = {
  initiated: 0,
  ipn_received: 0,
  success: 0,
  failed: 0,
}

// ─── Sliding-window outcome buffer ───────────────────────────────────────────

type OutcomeEvent = { ts: number; outcome: 'success' | 'failed' }

const outcomeBuffer: OutcomeEvent[] = []

const WINDOW_MS = 5 * 60_000 // 5 minutes
const FAILURE_RATE_THRESHOLD = 0.1 // 10%
const MIN_EVENTS_FOR_ALERT = 5
const ALERT_DEBOUNCE_MS = 60_000 // 60 seconds

let lastAlertAt = 0

function pruneBuffer(): void {
  const cutoff = Date.now() - WINDOW_MS
  while (outcomeBuffer.length > 0 && outcomeBuffer[0].ts < cutoff) {
    outcomeBuffer.shift()
  }
}

function checkFailureRate(): void {
  pruneBuffer()

  const total = outcomeBuffer.length
  if (total < MIN_EVENTS_FOR_ALERT) return

  const failedCount = outcomeBuffer.filter((e) => e.outcome === 'failed').length
  const rate = failedCount / total

  if (rate > FAILURE_RATE_THRESHOLD) {
    const now = Date.now()
    if (now - lastAlertAt >= ALERT_DEBOUNCE_MS) {
      lastAlertAt = now
      const successCount = outcomeBuffer.filter((e) => e.outcome === 'success').length
      Logger.apiError('[Payment] CRITICAL: High payment failure rate detected', {
        level: 'CRITICAL',
        type: 'PAYMENT_FAILURE_RATE_ALERT',
        failure_rate: rate,
        failed_count: failedCount,
        success_count: successCount,
        window_minutes: WINDOW_MS / 60_000,
      })
    }
  }
}

function recordOutcome(outcome: 'success' | 'failed'): void {
  outcomeBuffer.push({ ts: Date.now(), outcome })
  checkFailureRate()
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function incrementInitiated(): void {
  counters.initiated++
}

export function incrementIpnReceived(): void {
  counters.ipn_received++
}

export function incrementSuccess(): void {
  counters.success++
  recordOutcome('success')
}

export function incrementFailed(): void {
  counters.failed++
  recordOutcome('failed')
}

export function getSnapshot(): PaymentCounters {
  return { ...counters }
}
