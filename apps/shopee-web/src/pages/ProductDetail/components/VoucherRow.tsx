import { useTranslation } from 'react-i18next';
import { formatDiscount } from 'src/utils/utils';
import Popover from 'src/components/Popover';
import { ChevronRightIcon } from 'src/components/Icons';
import VoucherPopupContent from './VoucherPopupContent';
import useVoucherSave from 'src/hooks/useVoucherSave';

/**
 * Shopee-style voucher ticket badge with sawtooth left edge.
 * Uses CSS clip-path to create the coupon/ticket cutout effect.
 */
const VoucherTicketBadge = ({ label }: { label: string }) => (
  <span
    className="relative inline-block bg-orange px-2.5 py-1 text-xs font-medium text-white
      before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:bg-[radial-gradient(circle,_white_1.5px,_transparent_1.5px)] before:bg-[length:4px_6px]
      dark:bg-orange/90"
    style={{
      clipPath:
        'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 85%, 4px 70%, 0% 55%, 4px 40%, 0% 25%, 4px 10%)',
    }}
  >
    {label}
  </span>
);

const VoucherRow = () => {
  const { t } = useTranslation('product');
  const voucherData = useVoucherSave();
  const { vouchers, isLoading } = voucherData;
  const previewVouchers = vouchers.slice(0, 3);

  const formatVoucherBadge = (voucher: (typeof vouchers)[0]) => {
    return formatDiscount(voucher.discount_type, voucher.discount_value);
  };

  return (
    <Popover
      placement="bottom-start"
      enableArrow={true}
      renderPopover={<VoucherPopupContent voucherData={voucherData} />}
      role="button"
      tabIndex={0}
      popoverLabel={t('voucher.modalTitle')}
      ariaLabel={t('voucher.shopDiscount')}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
    >
      <div className="flex cursor-pointer items-center gap-3 border-t border-gray-100 py-4 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
        <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          {t('voucher.shopDiscount')}
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {isLoading &&
            [1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-6 w-16 animate-pulse motion-reduce:animate-none rounded-sm bg-gray-200 dark:bg-slate-700"
              />
            ))}
          {!isLoading &&
            previewVouchers.map((v) => (
              <VoucherTicketBadge key={v._id} label={formatVoucherBadge(v)} />
            ))}
          {!isLoading && vouchers.length > 3 && (
            <span className="text-xs text-orange dark:text-orange-400">{t('voucher.seeMore')}</span>
          )}
        </div>
        {/* Chevron right - Shopee style */}
        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
      </div>
    </Popover>
  );
};

export default VoucherRow;
