import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from 'src/components/Button'
import BankLogo, { BankInfo } from './BankLogo'

const BANKS: BankInfo[] = [
  {
    id: 'vcb',
    name: 'Vietcombank',
    shortName: 'VCB',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    accountNumber: '1234567890123',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Hà Nội'
  },
  {
    id: 'tcb',
    name: 'Techcombank',
    shortName: 'TCB',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    accountNumber: '19035678901234',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh HCM'
  },
  {
    id: 'bidv',
    name: 'BIDV',
    shortName: 'BIDV',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    accountNumber: '31410001234567',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Đống Đa'
  },
  {
    id: 'vtb',
    name: 'VietinBank',
    shortName: 'CTG',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    accountNumber: '108001234567',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Cầu Giấy'
  },
  {
    id: 'mb',
    name: 'MB Bank',
    shortName: 'MB',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    accountNumber: '0801234567890',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Thanh Xuân'
  },
  {
    id: 'acb',
    name: 'ACB',
    shortName: 'ACB',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    accountNumber: '12345678901',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Tân Bình'
  },
  {
    id: 'stb',
    name: 'Sacombank',
    shortName: 'STB',
    color: 'text-blue-500',
    bgColor: 'bg-cyan-50',
    accountNumber: '060123456789',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Quận 1'
  },
  {
    id: 'tpb',
    name: 'TPBank',
    shortName: 'TPB',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    accountNumber: '01234567890',
    accountHolder: 'CONG TY SHOPEE CLONE',
    branch: 'Chi nhánh Hoàn Kiếm'
  }
]

export { BANKS }

const BankDropdown = memo(function BankDropdown({
  selectedBank,
  onSelectBank,
  isOpen,
  onToggle
}: {
  selectedBank: BankInfo | null
  onSelectBank: (bank: BankInfo) => void
  isOpen: boolean
  onToggle: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) return BANKS
    const query = searchQuery.toLowerCase()
    return BANKS.filter(
      (bank) => bank.name.toLowerCase().includes(query) || bank.shortName.toLowerCase().includes(query)
    )
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  const handleSelectBank = useCallback(
    (bank: BankInfo) => {
      onSelectBank(bank)
      setSearchQuery('')
      onToggle()
    },
    [onSelectBank, onToggle]
  )

  return (
    <div ref={dropdownRef} className='relative'>
      <Button
        type='button'
        onClick={onToggle}
        animated={false}
        className='flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-hidden dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-400'
      >
        {selectedBank ? (
          <div className='flex items-center gap-3'>
            <BankLogo bank={selectedBank} size='sm' />
            <div>
              <p className={`font-medium ${selectedBank.color}`}>{selectedBank.name}</p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>{selectedBank.shortName}</p>
            </div>
          </div>
        ) : (
          <span className='text-gray-500 dark:text-gray-400'>Chọn ngân hàng...</span>
        )}
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className='h-5 w-5 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </motion.svg>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className='absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800'
          >
            <div className='border-b border-gray-100 p-3 dark:border-slate-700'>
              <div className='relative'>
                <svg
                  className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Tìm ngân hàng...'
                  className='w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:outline-hidden dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200'
                  autoFocus
                />
              </div>
            </div>
            <div className='max-h-64 overflow-y-auto p-2'>
              {filteredBanks.length > 0 ? (
                filteredBanks.map((bank) => (
                  <motion.div key={bank.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type='button'
                      onClick={() => handleSelectBank(bank)}
                      animated={false}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-blue-500/5 dark:hover:bg-blue-400/10 ${
                        selectedBank?.id === bank.id ? bank.bgColor : ''
                      }`}
                    >
                      <BankLogo bank={bank} size='sm' />
                      <div className='flex-1'>
                        <p className={`font-medium ${bank.color}`}>{bank.name}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>{bank.shortName}</p>
                      </div>
                      {selectedBank?.id === bank.id && (
                        <svg className='h-5 w-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </Button>
                  </motion.div>
                ))
              ) : (
                <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>Không tìm thấy ngân hàng</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default BankDropdown
