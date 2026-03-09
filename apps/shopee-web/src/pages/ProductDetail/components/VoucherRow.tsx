import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import voucherApi from 'src/apis/voucher.api';
import { formatCurrency } from 'src/utils/utils';
import VoucherListModal from 'src/components/VoucherListModal';

const VoucherRow = () => {
  const { t } = useTranslation('product');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['available-vouchers'],
    queryFn: async () => {
      const res = await voucherApi.getAvailableVouchers();
      return res.data.data;
    },
  });

  const vouchers = vouchersData?.vouchers || [];
  const previewVouchers = vouchers.slice(0, 3);

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setIsModalOpen(true);
    }, 200);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const formatVoucherBadge = (voucher: (typeof vouchers)[0]) => {
    if (voucher.discount_type === 'percentage') {
      return t('voucher.discountPercent', { percent: voucher.discount_value });
    }
    return t('voucher.discountAmount', { amount: formatCurrency(voucher.discount_value) });
  };

  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-3 border-t border-gray-100 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange dark:border-slate-700 dark:hover:bg-slate-700/50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={t('voucher.shopDiscount')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          {t('voucher.shopDiscount')}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isLoading &&
            [1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-6 w-16 animate-pulse motion-reduce:animate-none rounded-sm bg-gray-200 dark:bg-slate-700"
              />
            ))}
          {!isLoading &&
            previewVouchers.map((v) => (
              <span
                key={v._id}
                className="rounded-sm bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange dark:bg-orange-900/30 dark:text-orange-400"
              >
                {formatVoucherBadge(v)}
              </span>
            ))}
          {!isLoading && vouchers.length > 3 && (
            <span className="text-xs text-orange dark:text-orange-400">{t('voucher.seeMore')}</span>
          )}
        </div>
      </div>
      <VoucherListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default VoucherRow;
