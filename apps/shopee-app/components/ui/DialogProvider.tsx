import React, { createContext, useContext, useRef, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogOptions, DialogRef } from './Dialog'

interface DialogContextType {
  showDialog: (options: DialogOptions) => void
  hideDialog: () => void
  hideAllDialogs: () => void
  showMessage: (title: string, message?: string, onOk?: () => void | Promise<void>) => void
  showConfirm: (
    title: string,
    message?: string,
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void,
    buttonLayout?: 'horizontal' | 'vertical' | 'auto'
  ) => void
  showLoading: (title?: string, message?: string) => void
  hideLoading: () => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

interface DialogProviderProps {
  children: ReactNode
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const { t } = useTranslation()
  const dialogRef = useRef<DialogRef>(null)

  const showDialog = (options: DialogOptions) => {
    dialogRef.current?.show(options)
  }

  const hideDialog = () => {
    dialogRef.current?.hide()
  }

  const hideAllDialogs = () => {
    dialogRef.current?.hideAll()
  }

  const showMessage = (title: string, message?: string, onOk?: () => void | Promise<void>) => {
    dialogRef.current?.show({
      type: 'message',
      title,
      message,
      dismissable: true,
      buttons: [
        {
          text: t('common.ok'),
          variant: 'primary',
          onPress: onOk,
        },
      ],
    })
  }

  const showConfirm = (
    title: string,
    message?: string,
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void,
    buttonLayout: 'horizontal' | 'vertical' | 'auto' = 'auto'
  ) => {
    dialogRef.current?.show({
      type: 'confirm',
      title,
      message,
      dismissable: true,
      buttonLayout,
      buttons: [
        {
          text: t('common.cancel'),
          variant: 'outline',
          onPress: onCancel,
        },
        {
          text: t('common.confirm'),
          variant: 'primary',
          onPress: onConfirm,
        },
      ],
    })
  }

  const showLoading = (title?: string, message?: string) => {
    dialogRef.current?.show({
      type: 'loading',
      title: title || t('common.loading'),
      message,
      dismissable: false,
    })
  }

  const hideLoading = () => {
    dialogRef.current?.hide()
  }

  return (
    <DialogContext.Provider
      value={{
        showDialog,
        hideDialog,
        hideAllDialogs,
        showMessage,
        showConfirm,
        showLoading,
        hideLoading,
      }}>
      {children}
      <Dialog ref={dialogRef} />
    </DialogContext.Provider>
  )
}

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
