/* DEMO COMPONENT — simulates e-wallet QR flow for UI development only.
 * This component is NOT connected to the real MoMo/VNPay payment flow.
 * Real payments go through POST /checkout/initiate-payment → gateway redirect.
 * Only rendered in development mode (import.meta.env.DEV guard below).
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { WALLETS, WalletType } from './components/WalletCard'
import WalletSelectionView from './components/WalletSelectionView'
import QRDisplayView from './components/QRDisplayView'
import { WaitingView, SuccessView, FailedView, TimeoutView } from './components/EWalletFlowViews'
import { useIsMobile } from 'src/hooks/useIsMobile'

export type PaymentFlowState =
  | 'select'
  | 'qr_display'
  | 'waiting'
  | 'success'
  | 'failed'
  | 'timeout'

export interface EWalletPaymentProps {
  amount?: number
  onPaymentComplete?: () => void
  onPaymentFailed?: (error: string) => void
}

const QR_EXPIRATION_SECONDS = 300

function EWalletPayment({
  amount = 150000,
  onPaymentComplete,
  onPaymentFailed,
}: EWalletPaymentProps) {
  const { t } = useTranslation('payment')
  const [flowState, setFlowState] = useState<PaymentFlowState>('select')
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(QR_EXPIRATION_SECONDS)
  const [errorMessage, setErrorMessage] = useState('')
  const isMobile = useIsMobile()

  const selectedWalletInfo = WALLETS.find((w) => w.id === selectedWallet) || null

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (flowState === 'qr_display' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setFlowState('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [flowState, timeRemaining])

  // Guard: this demo component must not render in production builds
  if (!import.meta.env.DEV) return null

  const handleSelectWallet = (wallet: WalletType) => {
    setSelectedWallet(wallet)
  }

  const handleLinkNewWallet = () => {
    alert(t('eWallet.linkNewWalletMessage'))
  }

  const handleProceedToQR = () => {
    if (!selectedWallet) return
    setTimeRemaining(QR_EXPIRATION_SECONDS)
    setFlowState('qr_display')
  }

  const handleOpenApp = () => {
    if (!selectedWalletInfo) return
    window.location.href = selectedWalletInfo.deepLink
    setTimeout(() => {
      setFlowState('waiting')
      setTimeout(() => {
        const isSuccess = Math.random() > 0.3
        if (isSuccess) {
          setFlowState('success')
          onPaymentComplete?.()
        } else {
          setErrorMessage(t('eWallet.transactionRejected'))
          setFlowState('failed')
          onPaymentFailed?.(t('eWallet.transactionRejected'))
        }
      }, 3000)
    }, 1000)
  }

  const handleCancel = () => {
    setFlowState('select')
    setSelectedWallet(null)
    setTimeRemaining(QR_EXPIRATION_SECONDS)
    setErrorMessage('')
  }

  const handleRetry = () => {
    setErrorMessage('')
    setTimeRemaining(QR_EXPIRATION_SECONDS)
    setFlowState('qr_display')
  }

  const handleRegenerateQR = () => {
    setTimeRemaining(QR_EXPIRATION_SECONDS)
    setFlowState('qr_display')
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg bg-purple-50/50 p-4 dark:bg-purple-900/20"
    >
      <AnimatePresence mode="wait">
        {flowState === 'select' && (
          <WalletSelectionView
            key="select"
            selectedWallet={selectedWallet}
            onSelectWallet={handleSelectWallet}
            onLinkNewWallet={handleLinkNewWallet}
            onProceed={handleProceedToQR}
          />
        )}
        {flowState === 'qr_display' && selectedWalletInfo && (
          <QRDisplayView
            key="qr_display"
            wallet={selectedWalletInfo}
            amount={amount}
            timeRemaining={timeRemaining}
            isMobile={isMobile}
            onOpenApp={handleOpenApp}
            onCancel={handleCancel}
          />
        )}
        {flowState === 'waiting' && selectedWalletInfo && (
          <WaitingView key="waiting" walletName={selectedWalletInfo.name} />
        )}
        {flowState === 'success' && <SuccessView key="success" amount={amount} />}
        {flowState === 'failed' && (
          <FailedView
            key="failed"
            message={errorMessage}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        )}
        {flowState === 'timeout' && (
          <TimeoutView key="timeout" onRegenerateQR={handleRegenerateQR} onCancel={handleCancel} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default EWalletPayment
export type { WalletType }
