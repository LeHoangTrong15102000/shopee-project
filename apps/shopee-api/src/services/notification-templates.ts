/**
 * NotificationTemplates — renders notification title and content for each notification type.
 *
 * Usage:
 *   const { title, content } = NotificationTemplates.render('order', { orderId: '123', status: 'confirmed' })
 */
import { NotificationType, NOTIFICATION_TYPE } from '@database/models/notification.model'

export interface TemplateResult {
  title: string
  content: string
}

type OrderData = {
  orderId?: string
  status?: string
  totalAmount?: number | string
}

type PromotionData = {
  promotionName?: string
  description?: string
}

type FlashSaleData = {
  saleName?: string
  discountPercent?: number | string
}

type SystemData = {
  message?: string
}

type PriceDropData = {
  productName?: string
  oldPrice?: number | string
  newPrice?: number | string
}

type OtherData = Record<string, unknown>

type TemplateData =
  | OrderData
  | PromotionData
  | FlashSaleData
  | SystemData
  | PriceDropData
  | OtherData

export const NotificationTemplates = {
  render(type: NotificationType | string, data: TemplateData = {}): TemplateResult {
    switch (type) {
      case NOTIFICATION_TYPE.ORDER: {
        const d = data as OrderData
        const orderId = d.orderId ? `#${d.orderId}` : ''
        const status = d.status ?? 'đã được cập nhật'
        return {
          title: 'Cập nhật đơn hàng',
          content: `Đơn hàng ${orderId} của bạn ${status}.`,
        }
      }

      case NOTIFICATION_TYPE.PROMOTION: {
        const d = data as PromotionData
        const name = d.promotionName ?? 'Khuyến mãi mới'
        const desc = d.description ? ` ${d.description}` : ''
        return {
          title: 'Khuyến mãi dành cho bạn',
          content: `${name}.${desc}`,
        }
      }

      case NOTIFICATION_TYPE.FLASH_SALE: {
        const d = data as FlashSaleData
        const name = d.saleName ?? 'Flash Sale'
        const discount = d.discountPercent ? ` Giảm đến ${d.discountPercent}%.` : ''
        return {
          title: 'Flash Sale đang diễn ra!',
          content: `${name} đã bắt đầu.${discount} Mua ngay để không bỏ lỡ!`,
        }
      }

      case NOTIFICATION_TYPE.PRICE_DROP: {
        const d = data as PriceDropData
        const product = d.productName ?? 'Sản phẩm'
        const oldPrice = d.oldPrice !== undefined ? ` Giá cũ: ${d.oldPrice}.` : ''
        const newPrice = d.newPrice !== undefined ? ` Giá mới: ${d.newPrice}.` : ''
        return {
          title: 'Giá sản phẩm giảm!',
          content: `${product} vừa giảm giá.${oldPrice}${newPrice}`,
        }
      }

      case NOTIFICATION_TYPE.SYSTEM: {
        const d = data as SystemData
        return {
          title: 'Thông báo hệ thống',
          content: d.message ?? 'Có thông báo mới từ hệ thống.',
        }
      }

      default: {
        const d = data as OtherData
        return {
          title: 'Thông báo',
          content: typeof d['message'] === 'string' ? d['message'] : 'Bạn có thông báo mới.',
        }
      }
    }
  },
}
