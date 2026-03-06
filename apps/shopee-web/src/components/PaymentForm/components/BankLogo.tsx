import { memo } from 'react'

export type BankId = 'vcb' | 'tcb' | 'bidv' | 'vtb' | 'mb' | 'acb' | 'stb' | 'tpb'

export interface BankInfo {
  id: BankId
  name: string
  shortName: string
  color: string
  bgColor: string
  accountNumber: string
  accountHolder: string
  branch: string
}

const gradientMap: Record<BankId, string> = {
  vcb: 'from-green-500 to-green-700',
  tcb: 'from-red-500 to-red-700',
  bidv: 'from-blue-600 to-blue-800',
  vtb: 'from-blue-700 to-blue-900',
  mb: 'from-purple-500 to-purple-700',
  acb: 'from-blue-400 to-blue-600',
  stb: 'from-cyan-500 to-blue-600',
  tpb: 'from-purple-400 to-purple-600'
}

const BankLogo = memo(function BankLogo({ bank, size = 'md' }: { bank: BankInfo; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base'
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-linear-to-br ${gradientMap[bank.id]} ${sizeClasses[size]} font-bold text-white shadow-md`}
    >
      {bank.shortName}
    </div>
  )
})

export default BankLogo
