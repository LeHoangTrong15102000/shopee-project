import 'i18next'
import { defaultNS, resources } from 'src/i18n/i18n'

declare module 'i18next' {
  // Kế thừa (thêm vào type cho thằng) i18next
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['vi'] // Lấy cái key ngôn ngữ mà ta set mặc định ra
  }
}
