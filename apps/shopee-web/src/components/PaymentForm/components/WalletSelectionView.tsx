import { memo } from 'react'
import { motion } from 'framer-motion'
import Button from 'src/components/Button'
import WalletCard, { WALLETS, WalletType } from './WalletCard'

const LinkNewWalletButton = memo(function LinkNewWalletButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        type='button'
        onClick={onClick}
        animated={false}
        className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700 dark:border-slate-600 dark:text-gray-400 dark:hover:border-slate-500 dark:hover:text-gray-300'
      >
        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
        </svg>
        <span className='font-medium'>Liên kết ví mới</span>
      </Button>
    </motion.div>
  )
})

const WalletSelectionView = memo(function WalletSelectionView({
  selectedWallet,
  onSelectWallet,
  onLinkNewWallet,
  onProceed
}: {
  selectedWallet: WalletType | null
  onSelectWallet: (wallet: WalletType) => void
  onLinkNewWallet: () => void
  onProceed: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='space-y-4'
    >
      <h4 className='font-medium text-gray-900 dark:text-gray-100'>Chọn ví điện tử</h4>
      <div className='grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {WALLETS.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isSelected={selectedWallet === wallet.id}
            onSelect={() => onSelectWallet(wallet.id)}
          />
        ))}
      </div>
      <LinkNewWalletButton onClick={onLinkNewWallet} />

      {selectedWallet && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className='pt-4'>
          <Button
            type='button'
            onClick={onProceed}
            className='w-full rounded-lg bg-orange px-6 py-3 text-white hover:bg-orange/90'
          >
            Tiếp tục thanh toán
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
})

export default WalletSelectionView
