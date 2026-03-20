import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Button from 'src/components/Button';
import { formatCurrency } from './WalletCard';

function LoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-orange"
    />
  );
}

function SuccessAnimation() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
    >
      <motion.svg
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="h-10 w-10 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </motion.svg>
    </motion.div>
  );
}

function FailedAnimation() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
    >
      <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </motion.div>
  );
}

export function WaitingView({ walletName }: { walletName: string }) {
  const { t } = useTranslation('payment');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center space-y-6 py-8"
    >
      <LoadingSpinner />
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('eWallet.waitingPayment')}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('eWallet.completePaymentOn', { walletName })}
        </p>
      </div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
      >
        <span className="h-2 w-2 rounded-full bg-orange" />
        <span>{t('eWallet.processingTransaction')}</span>
      </motion.div>
    </motion.div>
  );
}

export function SuccessView({ amount }: { amount: number }) {
  const { t } = useTranslation('payment');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center space-y-6 py-8"
    >
      <SuccessAnimation />
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('eWallet.paymentSuccess')}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('eWallet.paidSuccessfully', { amount: formatCurrency(amount) })}
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400"
      >
        {t('eWallet.orderProcessing')}
      </motion.div>
    </motion.div>
  );
}

export function FailedView({
  message,
  onRetry,
  onCancel,
}: {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('payment');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center space-y-6 py-8"
    >
      <FailedAnimation />
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('eWallet.paymentFailed')}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-orange px-6 py-3 text-white hover:bg-orange/90"
        >
          {t('eWallet.retryPayment')}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          {t('eWallet.chooseOtherMethod')}
        </Button>
      </div>
    </motion.div>
  );
}

export function TimeoutView({
  onRegenerateQR,
  onCancel,
}: {
  onRegenerateQR: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('payment');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center space-y-6 py-8"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange/10">
        <svg
          className="h-10 w-10 text-orange"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('eWallet.qrExpired')}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('eWallet.qrExpiredMessage')}
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          onClick={onRegenerateQR}
          className="rounded-lg bg-orange px-6 py-3 text-white hover:bg-orange/90"
        >
          {t('eWallet.regenerateQR')}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          {t('eWallet.cancel')}
        </Button>
      </div>
    </motion.div>
  );
}
