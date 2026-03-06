import { memo } from 'react'
import { motion } from 'framer-motion'
import BankLogo, { BankInfo } from './BankLogo'
import CopyButton from '../shared/CopyButton'
import { formatCurrency } from './WalletCard'

const AccountInfoCard = memo(function AccountInfoCard({
  bank,
  amount,
  transferContent
}: {
  bank: BankInfo
  amount: number
  transferContent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl ${bank.bgColor} p-4 shadow-xs`}
    >
      <h4 className={`mb-4 font-semibold ${bank.color}`}>Thông tin chuyển khoản</h4>
      <div className='space-y-3'>
        <div className='flex items-center justify-between rounded-lg bg-white/80 px-3 py-2'>
          <div>
            <p className='text-xs text-gray-500'>Ngân hàng</p>
            <p className='font-medium text-gray-800'>{bank.name}</p>
          </div>
          <BankLogo bank={bank} size='sm' />
        </div>
        <div className='flex items-center justify-between rounded-lg bg-white/80 px-3 py-2'>
          <div>
            <p className='text-xs text-gray-500'>Số tài khoản</p>
            <p className='font-mono font-medium text-gray-800'>{bank.accountNumber}</p>
          </div>
          <CopyButton text={bank.accountNumber} label='số tài khoản' />
        </div>
        <div className='flex items-center justify-between rounded-lg bg-white/80 px-3 py-2'>
          <div>
            <p className='text-xs text-gray-500'>Chủ tài khoản</p>
            <p className='font-medium text-gray-800'>{bank.accountHolder}</p>
          </div>
          <CopyButton text={bank.accountHolder} label='tên chủ tài khoản' />
        </div>
        <div className='flex items-center justify-between rounded-lg bg-white/80 px-3 py-2'>
          <div>
            <p className='text-xs text-gray-500'>Số tiền</p>
            <p className='font-semibold text-orange'>{formatCurrency(amount)}</p>
          </div>
          <CopyButton text={amount.toString()} label='số tiền' />
        </div>
        <div className='flex items-center justify-between rounded-lg bg-white/80 px-3 py-2'>
          <div>
            <p className='text-xs text-gray-500'>Nội dung chuyển khoản</p>
            <p className='font-mono font-semibold text-blue-600'>{transferContent}</p>
          </div>
          <CopyButton text={transferContent} label='nội dung chuyển khoản' />
        </div>
      </div>
      <p className='mt-4 text-xs text-gray-500'>
        <span className='text-red-500'>*</span> Vui lòng nhập chính xác nội dung chuyển khoản để đơn hàng được xử lý tự
        động
      </p>
    </motion.div>
  )
})

export default AccountInfoCard
