import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { useReducedMotion } from 'src/hooks/useReducedMotion';

export interface FlashSaleUrgencyProps {
  productId: string;
  totalStock: number;
  soldCount: number;
  endTime: string | Date;
  className?: string;
}

type UrgencyLevel = 'normal' | 'low' | 'critical' | 'out_of_stock' | 'ending_soon' | 'ended';

export default function FlashSaleUrgency({
  productId,
  totalStock,
  soldCount,
  endTime,
  className,
}: FlashSaleUrgencyProps) {
  const prefersReducedMotion = useReducedMotion();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Calculate stock metrics
  const remainingStock = Math.max(0, totalStock - soldCount);
  const soldPercentage = (() => {
    if (totalStock <= 0) return 100;
    return Math.min(100, Math.round((soldCount / totalStock) * 100));
  })();

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
      const now = new Date();
      const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      setTimeRemaining(diff);
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  // Determine urgency level
  const urgencyLevel = ((): UrgencyLevel => {
    if (timeRemaining <= 0) return 'ended';
    if (remainingStock === 0) return 'out_of_stock';
    if (remainingStock < 5) return 'critical';
    if (remainingStock < 10) return 'low';
    if (timeRemaining < 30 * 60) return 'ending_soon'; // < 30 minutes
    return 'normal';
  })();

  // Get urgency message
  const urgencyMessage = (() => {
    switch (urgencyLevel) {
      case 'ended':
        return { text: 'Đã kết thúc!', emoji: '⏰' };
      case 'out_of_stock':
        return { text: 'Đã hết hàng!', emoji: '🚫' };
      case 'critical':
        return { text: `Chỉ còn ${remainingStock} sản phẩm!`, emoji: '🔥' };
      case 'low':
        return { text: 'Sắp hết!', emoji: '⚡' };
      case 'ending_soon':
        return { text: 'Sắp kết thúc!', emoji: '⏰' };
      default:
        return null;
    }
  })();

  const shouldPulse =
    ['critical', 'low', 'ending_soon'].includes(urgencyLevel) && !prefersReducedMotion;
  const isInactive = urgencyLevel === 'ended' || urgencyLevel === 'out_of_stock';

  const progressBarFill = isInactive
    ? 'bg-gray-400 dark:bg-gray-600'
    : 'bg-linear-to-r from-[#ee4d2d] to-[#ff6633]';

  const urgencyTextColor = (() => {
    switch (urgencyLevel) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'low':
        return 'text-red-500 dark:text-red-400';
      case 'ending_soon':
        return 'text-orange-500 dark:text-orange-400';
      case 'ended':
      case 'out_of_stock':
        return 'text-gray-400 dark:text-gray-500';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  })();

  return (
    <div className={classNames('w-full', className)} data-product-id={productId}>
      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
        <motion.div
          className={classNames('h-full rounded-full', progressBarFill)}
          initial={{ width: 0 }}
          animate={{ width: `${soldPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Sold percentage text */}
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-xs">
          Đã bán {soldPercentage}%
        </span>
      </div>

      {/* Urgency message */}
      {urgencyMessage && (
        <motion.div
          className={classNames('mt-2 flex items-center gap-1 text-sm font-bold', urgencyTextColor)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live={urgencyLevel === 'critical' ? 'assertive' : 'polite'}
        >
          {shouldPulse ? (
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-1"
            >
              <span>{urgencyMessage.emoji}</span>
              <span>{urgencyMessage.text}</span>
            </motion.span>
          ) : (
            <>
              <span>{urgencyMessage.emoji}</span>
              <span>{urgencyMessage.text}</span>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
