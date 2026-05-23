/**
 * FcmService — Firebase Cloud Messaging push notification service.
 *
 * Initializes Firebase Admin SDK using FIREBASE_SERVICE_ACCOUNT_JSON (JSON string)
 * or FIREBASE_SERVICE_ACCOUNT_PATH (file path). If neither is set, FCM is disabled
 * and all send methods are no-ops.
 */
import * as admin from 'firebase-admin'
import * as fs from 'fs'
import { Logger } from '@utils/logger'
import { DeviceTokenRepository } from '@repositories/device-token.repository'

export class FcmService {
  private readonly enabled: boolean
  private readonly messaging: admin.messaging.Messaging | null = null

  constructor(private readonly deviceTokenRepository: DeviceTokenRepository) {
    const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

    if (!jsonEnv && !pathEnv) {
      Logger.apiWarn(
        '[FcmService] Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is set — FCM push notifications are disabled',
      )
      this.enabled = false
      return
    }

    try {
      let serviceAccount: admin.ServiceAccount

      if (jsonEnv) {
        serviceAccount = JSON.parse(jsonEnv) as admin.ServiceAccount
      } else {
        const raw = fs.readFileSync(pathEnv!, 'utf-8')
        serviceAccount = JSON.parse(raw) as admin.ServiceAccount
      }

      // Initialize only if not already initialized (avoid duplicate app error)
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
      }

      this.messaging = admin.messaging()
      this.enabled = true

      Logger.apiInfo('[FcmService] Firebase Admin SDK initialized successfully')
    } catch (err: any) {
      Logger.apiError('[FcmService] Failed to initialize Firebase Admin SDK', {
        error: err?.message,
      })
      this.enabled = false
    }
  }

  /**
   * Send a push notification to all devices registered for a user.
   * Automatically removes tokens that FCM reports as invalid.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.enabled || !this.messaging) return

    const tokens = await this.deviceTokenRepository.findByUserId(userId)
    if (tokens.length === 0) return

    const tokenStrings = tokens.map((t) => t.token)

    try {
      const response = await this.messaging.sendEachForMulticast({
        tokens: tokenStrings,
        notification: { title, body },
        data: data ?? {},
      })

      // Remove invalid tokens
      const invalidTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          resp.error?.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokenStrings[idx])
        }
      })

      if (invalidTokens.length > 0) {
        Logger.apiInfo('[FcmService] Removing invalid FCM tokens', {
          userId,
          count: invalidTokens.length,
        })
        await Promise.all(
          invalidTokens.map((token) => this.deviceTokenRepository.deleteByToken(token)),
        )
      }

      Logger.apiInfo('[FcmService] sendToUser complete', {
        userId,
        successCount: response.successCount,
        failureCount: response.failureCount,
      })
    } catch (err: any) {
      Logger.apiError('[FcmService] sendToUser error', {
        userId,
        error: err?.message,
      })
    }
  }

  /**
   * Send a topic-based FCM message (for flash sale / promotion broadcasts).
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.enabled || !this.messaging) return

    try {
      await this.messaging.send({
        topic,
        notification: { title, body },
        data: data ?? {},
      })

      Logger.apiInfo('[FcmService] sendToTopic complete', { topic, title })
    } catch (err: any) {
      Logger.apiError('[FcmService] sendToTopic error', {
        topic,
        error: err?.message,
      })
    }
  }
}
