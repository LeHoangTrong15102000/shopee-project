import classNames from 'classnames';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'src/hooks/useReducedMotion';

interface StockBadgeProps {
  availableStock: number;
  requestedQuantity: number;
  className?: string;
}

type StockStatus = 'out_of_stock' | 'exceeded' | 'critical_low' | 'running_low' | 'normal';

interface StockConfig {
  bg: string;
  text: string;
  border: string;
  icon: string;
  shouldPulse: boolean;
}

const STOCK_CONFIG: Record<Exclude<StockStatus, 'normal'>, StockConfig> = {
  out_of_stock: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    icon: '🚫',
    shouldPulse: true,
  },
  exceeded: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    icon: '⚠️',
    shouldPulse: true,
  },
  critical_low: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    icon: '⚠️',
    shouldPulse: true,
  },
  running_low: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: '',
    shouldPulse: false,
  },
};

function getStockStatus(availableStock: number, requestedQuantity: number): StockStatus {
  if (availableStock === 0) return 'out_of_stock';
  if (requestedQuantity > availableStock) return 'exceeded';
  if (availableStock <= 5) return 'critical_low';
  if (availableStock <= 20) return 'running_low';
  return 'normal';
}

export default function StockBadge({
  availableStock,
  requestedQuantity,
  className,
}: StockBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useTranslation('common');
  const status = getStockStatus(availableStock, requestedQuantity);

  // Don't render anything if stock is normal
  if (status === 'normal') return null;

  const config = STOCK_CONFIG[status];

  const label = (() => {
    switch (status) {
      case 'out_of_stock':
        return t('stock.outOfStock');
      case 'exceeded':
        return t('stock.exceeded');
      case 'critical_low':
        return t('stock.onlyNLeft', { count: availableStock });
      case 'running_low':
        return t('stock.runningLow');
    }
  })();
  const shouldAnimate = config.shouldPulse && !prefersReducedMotion;

  const badgeContent = (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {config.icon && <span className="text-[10px]">{config.icon}</span>}
      <span>{label}</span>
    </span>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        className="inline-block"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [1, 0.9, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
}
