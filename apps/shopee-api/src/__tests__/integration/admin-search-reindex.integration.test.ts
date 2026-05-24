/// <reference types="jest" />

/**
 * Integration tests for POST /admin/search/reindex.
 *
 * Verifies that:
 *   - Non-admin authenticated users receive 403 Forbidden
 *   - Unauthenticated requests receive 401 Unauthorized
 *   - Admin users receive 202 Accepted with a jobId
 *
 * The searchSyncQueue is mocked so no real Redis/BullMQ connection is needed.
 */

// ── Mock the queue singletons before any route/controller is imported ─────────
const mockSearchSyncQueueAdd = jest.fn().mockResolvedValue({ id: 'reindex-job-1' })

jest.mock('../../queues', () => ({
  searchSyncQueue: { add: mockSearchSyncQueueAdd },
  emailQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  cleanupQueue: { add: jest.fn() },
  flashSaleSchedulerQueue: { add: jest.fn() },
  paymentReconciliationQueue: { add: jest.fn() },
  refundStatusPollQueue: { add: jest.fn() },
}))

// ── Mock bull-board so BullMQAdapter never receives mock queue objects ─────────
jest.mock('../../queues/bull-board', () => {
  const { Router } = require('express')
  return { bullBoardRouter: Router() }
})

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken, getAdminToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('POST /admin/search/reindex', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).post('/admin/search/reindex')
    expect(res.status).toBe(401)
  })

  it('returns 403 when a non-admin user calls the endpoint', async () => {
    const auth = await getAuthToken(app)

    const res = await supertest(app)
      .post('/admin/search/reindex')
      .set('Authorization', `Bearer ${auth.access_token}`)

    expect(res.status).toBe(403)
    expect(mockSearchSyncQueueAdd).not.toHaveBeenCalled()
  })

  it('returns 202 and a jobId when an admin calls the endpoint', async () => {
    const adminAuth = await getAdminToken(app)

    const res = await supertest(app)
      .post('/admin/search/reindex')
      .set('Authorization', `Bearer ${adminAuth.access_token}`)

    expect(res.status).toBe(202)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('jobId', 'reindex-job-1')
    expect(mockSearchSyncQueueAdd).toHaveBeenCalledTimes(1)

    const [jobName, payload] = mockSearchSyncQueueAdd.mock.calls[0]
    expect(jobName).toBe('reindex-all')
    expect(payload).toMatchObject({
      entityType: 'product',
      entityId: 'all',
      operation: 'index',
    })
  })
})
