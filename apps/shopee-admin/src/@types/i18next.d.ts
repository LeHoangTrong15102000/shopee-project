import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    // Disable strict typing to allow namespace syntax like 'common:key'
    returnNull: false
  }
}
