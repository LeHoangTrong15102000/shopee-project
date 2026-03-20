import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import BankLogo, { BankInfo } from './BankLogo';
import CopyButton from '../shared/CopyButton';
import { formatCurrency } from './WalletCard';

function AccountInfoCard({
  bank,
  amount,
  transferContent,
}: {
  bank: BankInfo;
  amount: number;
  transferContent: string;
}) {
  const { t } = useTranslation('payment');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl ${bank.bgColor} p-4 shadow-xs`}
    >
      <h4 className={`mb-4 font-semibold ${bank.color}`}>{t('accountInfo.transferInfo')}</h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">{t('accountInfo.bank')}</p>
            <p className="font-medium text-gray-800">{bank.name}</p>
          </div>
          <BankLogo bank={bank} size="sm" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">{t('accountInfo.accountNumber')}</p>
            <p className="font-mono font-medium text-gray-800">{bank.accountNumber}</p>
          </div>
          <CopyButton text={bank.accountNumber} label={t('accountInfo.accountNumber')} />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">{t('accountInfo.accountHolder')}</p>
            <p className="font-medium text-gray-800">{bank.accountHolder}</p>
          </div>
          <CopyButton text={bank.accountHolder} label={t('accountInfo.accountHolder')} />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">{t('accountInfo.amount')}</p>
            <p className="font-semibold text-orange">{formatCurrency(amount)}</p>
          </div>
          <CopyButton text={amount.toString()} label={t('accountInfo.amount')} />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">{t('accountInfo.transferContent')}</p>
            <p className="font-mono font-semibold text-blue-600">{transferContent}</p>
          </div>
          <CopyButton text={transferContent} label={t('accountInfo.transferContent')} />
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        <span className="text-red-500">*</span> {t('accountInfo.transferNote')}
      </p>
    </motion.div>
  );
}

export default AccountInfoCard;
