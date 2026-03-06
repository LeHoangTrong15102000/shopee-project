/**
 * Centralized order status configuration
 * Single source of truth for all order status labels, colors, icons, and animation flags
 */

export type { OrderStatus } from 'src/types/orderTracking.type'
import type { OrderStatus } from 'src/types/orderTracking.type'
import i18n from 'src/i18n/i18n'

export interface OrderStatusConfig {
  label: string
  color: {
    light: string
    dark: string
  }
  bgColor: {
    light: string
    dark: string
  }
  borderColor: {
    light: string
    dark: string
  }
  icon: string
  animate?: boolean
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    label: 'Chờ xác nhận',
    color: { light: 'text-amber-600', dark: 'text-amber-400' },
    bgColor: { light: 'bg-amber-50/80', dark: 'bg-amber-900/20' },
    borderColor: { light: 'border-amber-200/60', dark: 'border-amber-700/30' },
    icon: '⏳',
    animate: false
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: { light: 'text-blue-600', dark: 'text-blue-400' },
    bgColor: { light: 'bg-blue-50/80', dark: 'bg-blue-900/20' },
    borderColor: { light: 'border-blue-200/60', dark: 'border-blue-700/30' },
    icon: '✓'
  },
  processing: {
    label: 'Đang xử lý',
    color: { light: 'text-indigo-600', dark: 'text-indigo-400' },
    bgColor: { light: 'bg-indigo-50/80', dark: 'bg-indigo-900/20' },
    borderColor: { light: 'border-indigo-200/60', dark: 'border-indigo-700/30' },
    icon: '⟳',
    animate: false
  },
  shipping: {
    label: 'Đang giao',
    color: { light: 'text-teal-600', dark: 'text-teal-400' },
    bgColor: { light: 'bg-teal-50/80', dark: 'bg-teal-900/20' },
    borderColor: { light: 'border-teal-200/60', dark: 'border-teal-700/30' },
    icon: '➤',
    animate: false
  },
  delivered: {
    label: 'Đã giao',
    color: { light: 'text-emerald-600', dark: 'text-emerald-400' },
    bgColor: { light: 'bg-emerald-50/80', dark: 'bg-emerald-900/20' },
    borderColor: { light: 'border-emerald-200/60', dark: 'border-emerald-700/30' },
    icon: '✓'
  },
  cancelled: {
    label: 'Đã hủy',
    color: { light: 'text-rose-600', dark: 'text-rose-400' },
    bgColor: { light: 'bg-rose-50/80', dark: 'bg-rose-900/20' },
    borderColor: { light: 'border-rose-200/60', dark: 'border-rose-700/30' },
    icon: '✕'
  },
  returned: {
    label: 'Đã trả hàng',
    color: { light: 'text-slate-600', dark: 'text-slate-400' },
    bgColor: { light: 'bg-slate-50/80', dark: 'bg-slate-800/20' },
    borderColor: { light: 'border-slate-200/60', dark: 'border-slate-600/30' },
    icon: '↩'
  }
}

export const getStatusLabel = (status: OrderStatus): string =>
  i18n.t(`config.${status}`, { ns: 'order', defaultValue: ORDER_STATUS_CONFIG[status]?.label ?? status })

export const getStatusClasses = (status: OrderStatus): string => {
  const config = ORDER_STATUS_CONFIG[status]
  if (!config) return ''
  return `${config.color.light} dark:${config.color.dark} ${config.bgColor.light} dark:${config.bgColor.dark} ${config.borderColor.light} dark:${config.borderColor.dark}`
}

// Carrier code to display name mapping (fallback values)
export const CARRIER_DISPLAY_NAMES: Record<string, string> = {
  ghn: 'Giao Hàng Nhanh',
  ghtk: 'Giao Hàng Tiết Kiệm',
  viettel_post: 'Viettel Post',
  'j&t': 'J&T Express',
  other: 'Khác'
}

// Carrier code to i18n key mapping (backend uses codes, UI shows translated names)
const CARRIER_I18N_KEYS: Record<string, string> = {
  ghn: 'carrier.ghn',
  ghtk: 'carrier.ghtk',
  viettel_post: 'carrier.viettelPost',
  'j&t': 'carrier.jt',
  other: 'carrier.other'
}

export const getCarrierDisplayName = (carrierCode: string): string =>
  CARRIER_I18N_KEYS[carrierCode]
    ? i18n.t(CARRIER_I18N_KEYS[carrierCode], { ns: 'order', defaultValue: CARRIER_DISPLAY_NAMES[carrierCode] })
    : carrierCode
