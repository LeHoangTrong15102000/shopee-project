import classNames from 'classnames';
import { differenceInDays, parseISO } from 'date-fns';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Voucher } from 'src/types/voucher.type';
import { formatCurrency, formatDate, formatDiscount } from 'src/utils/utils';
import Button from 'src/components/Button';

interface VoucherCardProps {
  voucher: Pick<
    Voucher,
    | '_id'
    | 'code'
    | 'name'
    | 'description'
    | 'discount_type'
    | 'discount_value'
    | 'min_order_value'
    | 'max_discount'
    | 'end_date'
    | 'is_active'
  >;
  isSaved?: boolean;
  onSave?: (voucherId: string) => void;
  onApply?: (code: string) => void;
  isLoading?: boolean;
}

type VoucherStatus = 'active' | 'expired' | 'saved';

const getVoucherStatus = (
  voucher: VoucherCardProps['voucher'],
  isSaved?: boolean,
): VoucherStatus => {
  if (!voucher.is_active || new Date(voucher.end_date) < new Date()) {
    return 'expired';
  }
  if (isSaved) {
    return 'saved';
  }
  return 'active';
};

const getDaysRemaining = (dateString: string): number => {
  const endDate = parseISO(dateString);
  return differenceInDays(endDate, new Date());
};

function VoucherCard({
  voucher,
  isSaved = false,
  onSave,
  onApply,
  isLoading = false,
}: VoucherCardProps) {
  const { t } = useTranslation('product');
  const status = useMemo(() => getVoucherStatus(voucher, isSaved), [voucher, isSaved]);

  const daysRemaining = useMemo(() => getDaysRemaining(voucher.end_date), [voucher.end_date]);

  const isExpired = status === 'expired';

  const discountDisplay = useMemo(
    () => formatDiscount(voucher.discount_type, voucher.discount_value),
    [voucher.discount_type, voucher.discount_value],
  );

  const handleButtonClick = useCallback(() => {
    if (isLoading || isExpired) return;

    if (isSaved && onApply) {
      onApply(voucher.code);
    } else if (!isSaved && onSave) {
      onSave(voucher._id);
    }
  }, [isLoading, isExpired, isSaved, onApply, onSave, voucher.code, voucher._id]);

  const isSavedWithoutApply = isSaved && !onApply;
  const buttonText = isLoading
    ? t('voucher.processing')
    : isSavedWithoutApply
      ? t('voucher.saved')
      : isSaved
        ? t('voucher.apply')
        : t('voucher.save');

  const buttonAriaLabel = useMemo(() => {
    if (isExpired) return t('voucher.ariaExpired', { name: voucher.name });
    if (isLoading) return t('voucher.ariaProcessing');
    if (isSavedWithoutApply) return t('voucher.ariaSaved', { name: voucher.name });
    return isSaved
      ? t('voucher.ariaApply', { name: voucher.name, discount: discountDisplay })
      : t('voucher.ariaSave', { name: voucher.name, discount: discountDisplay });
  }, [isExpired, isLoading, isSaved, isSavedWithoutApply, voucher.name, discountDisplay, t]);

  return (
    <div
      role="article"
      aria-label={t('voucher.ariaCard', { name: voucher.name, discount: discountDisplay })}
      className={classNames(
        'relative flex overflow-hidden rounded-lg bg-white shadow-xs transition-shadow duration-200 motion-reduce:transition-none dark:bg-slate-800',
        {
          'opacity-60': isExpired,
          'hover:shadow-md': !isExpired,
        },
      )}
    >
      <div
        className="absolute top-0 bottom-0 left-0 w-1 border-l-4 border-dashed border-orange"
        aria-hidden="true"
      />

      <div
        className="flex w-20 shrink-0 flex-col items-center justify-center bg-linear-to-br from-orange to-orange-400 p-2 text-white sm:w-24 sm:p-3"
        aria-hidden="true"
      >
        <span className="text-xs font-medium uppercase">{t('voucher.discount')}</span>
        <span className="text-lg font-bold sm:text-xl">{discountDisplay}</span>
        {voucher.discount_type === 'percentage' && voucher.max_discount && (
          <span className="mt-1 text-[10px] opacity-90">
            {t('voucher.maxDiscount', { amount: formatCurrency(voucher.max_discount) })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-2 sm:p-3">
        <div>
          <h3 className="line-clamp-1 text-xs font-medium text-gray-800 sm:text-sm dark:text-gray-100">
            {voucher.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
            {voucher.description}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t('voucher.minOrder', { amount: formatCurrency(voucher.min_order_value) })}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {t('voucher.code', { code: voucher.code })}
            </span>
            <span
              className={classNames('text-[10px]', {
                'text-red-500 dark:text-red-400': daysRemaining <= 3 && !isExpired,
                'text-gray-400 dark:text-gray-500': daysRemaining > 3 || isExpired,
              })}
            >
              {isExpired
                ? t('voucher.expired')
                : daysRemaining <= 0
                  ? t('voucher.expiringToday')
                  : t('voucher.expiryDate', { date: formatDate(voucher.end_date) })}
            </span>
          </div>

          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={isLoading || isExpired || isSavedWithoutApply}
            aria-label={buttonAriaLabel}
            aria-disabled={isLoading || isExpired || isSavedWithoutApply}
            animated={false}
            className={classNames(
              'rounded-sm px-3 py-2.5 text-xs font-medium transition-all duration-200 motion-reduce:transition-none sm:px-4 sm:py-3 min-h-11',
              {
                'bg-orange text-white hover:bg-orange-700': !isExpired && !isSaved,
                'border border-orange text-orange hover:bg-orange/10 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400/10':
                  !isExpired && isSaved && !isSavedWithoutApply,
                'cursor-not-allowed border border-gray-300 text-gray-400 dark:border-slate-600 dark:text-gray-500':
                  isSavedWithoutApply,
                'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-gray-500':
                  isExpired,
                'cursor-not-allowed opacity-50': isLoading,
              },
            )}
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {isExpired && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50"
          aria-hidden="true"
        >
          <span className="rotate-[-15deg] rounded-sm border-2 border-gray-400 px-3 py-1 text-sm font-bold text-gray-400 uppercase dark:border-gray-500 dark:text-gray-500">
            {t('voucher.expiredOverlay')}
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(VoucherCard);
