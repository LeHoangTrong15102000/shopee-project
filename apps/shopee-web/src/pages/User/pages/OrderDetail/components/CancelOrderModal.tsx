import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Button from 'src/components/Button';
import { ANIMATION_DURATION } from 'src/styles/animations/motion.config';
import {
  modalBackdropVariants,
  modalContentVariants,
  reducedMotionVariants,
} from '../orderDetail.constants';

interface CancelOrderModalProps {
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  shouldReduceMotion: boolean | null;
}

export default function CancelOrderModal({
  cancelReason,
  setCancelReason,
  onClose,
  onConfirm,
  isPending,
  shouldReduceMotion,
}: CancelOrderModalProps) {
  const { t } = useTranslation('order');
  return (
    <motion.div
      variants={shouldReduceMotion ? reducedMotionVariants : modalBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div
        variants={shouldReduceMotion ? reducedMotionVariants : modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-700 dark:bg-slate-800"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
          aria-label={t('cancel.closeModal')}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('cancel.title')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('cancel.irreversible')}
          </p>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{t('cancel.confirm')}</p>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t('cancel.reasonPlaceholder')}
          className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm transition-all duration-200 focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-hidden dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-400"
          rows={3}
        />
        <div className="mt-5 flex justify-end gap-3">
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
          >
            <Button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            >
              {t('cancel.back')}
            </Button>
          </motion.div>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
          >
            <Button
              onClick={onConfirm}
              disabled={isPending}
              className="cursor-pointer rounded-xl bg-linear-to-r from-red-500 to-rose-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-rose-700 hover:shadow-lg hover:shadow-red-200/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:shadow-red-900/30"
            >
              {isPending ? t('cancel.processing') : t('cancel.confirmButton')}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
