// Toast singleton for use outside React components
// This is initialized by ToastProvider and can be called from anywhere

interface ToastMethods {
  showError: (title: string, message?: string) => void
  showSuccess: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

let toastInstance: ToastMethods | null = null

export const setToastInstance = (instance: ToastMethods) => {
  toastInstance = instance
}

export const toast = {
  error: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.showError(title, message)
    } else {
      console.warn('[Toast] Toast instance not initialized')
    }
  },
  success: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.showSuccess(title, message)
    } else {
      console.warn('[Toast] Toast instance not initialized')
    }
  },
  warning: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.showWarning(title, message)
    } else {
      console.warn('[Toast] Toast instance not initialized')
    }
  },
  info: (title: string, message?: string) => {
    if (toastInstance) {
      toastInstance.showInfo(title, message)
    } else {
      console.warn('[Toast] Toast instance not initialized')
    }
  },
}
