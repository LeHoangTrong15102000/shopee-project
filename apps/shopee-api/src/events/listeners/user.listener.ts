/**
 * UserEventListener — handles user domain events and enqueues email jobs.
 */
import { Queue } from 'bullmq'
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { EmailJobPayload } from '../../queues/job-payloads'
import { Logger } from '@utils/logger'

export class UserEventListener {
  constructor(private readonly emailQueue: Queue<EmailJobPayload>) {}

  @OnEvent('user.registered')
  async onUserRegistered(event: Extract<DomainEvent, { type: 'user.registered' }>): Promise<void> {
    const { userId, email } = event.payload

    Logger.apiInfo('[UserEventListener] user.registered — enqueuing welcome email', {
      userId,
      email,
    })

    await this.emailQueue.add('welcome-email', {
      to: email,
      subject: 'Welcome to Shopee!',
      body: `Welcome! Your account has been created successfully.`,
      template: 'welcome',
      data: { userId, email },
    })
  }
}
