import { useTranslation } from 'react-i18next';

const VoucherRow = () => {
  const { t } = useTranslation('product');

  // TODO: Replace hardcoded vouchers with real voucher API data when available
  const vouchers = [
    { type: 'amount', value: '50k' },
    { type: 'percent', value: '8' },
    { type: 'amount', value: '100k' },
  ];

  return (
    <div className="flex items-center gap-3 py-4">
      <span className="w-28 shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {t('voucher.shopDiscount')}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {vouchers.map((v, i) => (
          <span
            key={i}
            className="rounded-sm bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange dark:bg-orange-900/30 dark:text-orange-400"
          >
            {v.type === 'amount'
              ? t('voucher.discountAmount', { amount: v.value })
              : t('voucher.discountPercent', { percent: v.value })}
          </span>
        ))}
      </div>
    </div>
  );
};

export default VoucherRow;
