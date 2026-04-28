import { Alert } from 'react-native'
import type { Router } from 'expo-router'

export interface RoutableNotification {
  _id: string
  title: string
  content: string
  type?: string
  referenceId?: string
}

/**
 * Routes a notification press to the appropriate screen based on notification type.
 * - order: navigates to /order/[referenceId]
 * - product: navigates to /product/[referenceId]
 * - promotion: navigates to /vouchers
 * - system: shows an Alert with title and body
 * - unknown: no-op
 */
export function routeNotification(notification: RoutableNotification, router: Router): void {
  switch (notification.type) {
    case 'order':
      if (notification.referenceId) {
        router.push(`/order/${notification.referenceId}`)
      }
      break
    case 'product':
      if (notification.referenceId) {
        router.push(`/product/${notification.referenceId}`)
      }
      break
    case 'promotion':
      router.push('/vouchers')
      break
    case 'system':
      Alert.alert(notification.title, notification.content)
      break
    default:
      // unknown type — no-op
      break
  }
}
