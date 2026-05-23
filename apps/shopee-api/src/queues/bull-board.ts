/**
 * Bull Board admin dashboard.
 *
 * Mounts the Bull Board UI at /admin/queues.
 * Protected by verifyAccessToken + verifyAdmin middleware.
 */
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import {
  emailQueue,
  notificationQueue,
  searchSyncQueue,
  cleanupQueue,
  flashSaleSchedulerQueue,
  paymentReconciliationQueue,
  refundStatusPollQueue,
} from './index'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(searchSyncQueue),
    new BullMQAdapter(cleanupQueue),
    new BullMQAdapter(flashSaleSchedulerQueue),
    new BullMQAdapter(paymentReconciliationQueue),
    new BullMQAdapter(refundStatusPollQueue),
  ],
  serverAdapter,
})

/**
 * Wrapper router that applies admin auth guards before delegating to Bull Board.
 * Mount this at /admin/queues in the admin route config.
 */
const bullBoardRouter = Router()

bullBoardRouter.use(
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  serverAdapter.getRouter(),
)

export { bullBoardRouter }
