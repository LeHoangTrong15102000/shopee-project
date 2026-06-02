/**
 * ReferralEventListener — hooks into order.created to process referral rewards.
 *
 * When an order is created, checks if the ordering user (referee) has a pending
 * referral reward and processes it.
 */
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { Logger } from '@utils/logger'
import type { ReferralService } from '../../services/referral.service'

export class ReferralEventListener {
  constructor(private readonly referralService: ReferralService) {}

  @OnEvent('order.created')
  async onOrderCreated(event: Extract<DomainEvent, { type: 'order.created' }>): Promise<void> {
    const { orderId, userId } = event.payload

    Logger.apiInfo('[ReferralEventListener] order.created — checking referral reward', {
      orderId,
      userId,
    })

    try {
      await this.referralService.processReferralReward(userId, orderId)
    } catch (err: unknown) {
      const error = err as Error
      Logger.apiError('[ReferralEventListener] Failed to process referral reward', {
        orderId,
        userId,
        error: error?.message,
      })
    }
  }
}
