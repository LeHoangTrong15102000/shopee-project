import { motion } from 'framer-motion'
import { GoldenSparkle } from '../profileCompletion.constants'

interface CircularProgressRingProps {
  percentage: number
  circumference: number
  strokeDashoffset: number
  statusColor: { from: string; to: string }
  reducedMotion: boolean
  radius: number
}

const CircularProgressRing = ({
  percentage,
  circumference,
  strokeDashoffset,
  statusColor,
  reducedMotion,
  radius
}: CircularProgressRingProps) => {
  return (
    <div
      className='relative shrink-0'
      role='progressbar'
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tiến độ hoàn thành hồ sơ: ${percentage}%`}
    >
      <svg width='120' height='120' className='-rotate-90 transform sm:scale-90 md:scale-100' aria-hidden='true'>
        {/* Background circle */}
        <circle
          cx='60'
          cy='60'
          r={radius}
          fill='none'
          stroke='currentColor'
          strokeWidth='10'
          className='text-gray-200 dark:text-slate-700'
        />
        {/* Progress circle */}
        <motion.circle
          cx='60'
          cy='60'
          r={radius}
          fill='none'
          stroke={`url(#progressGradient-${percentage})`}
          strokeWidth='10'
          strokeLinecap='round'
          strokeDasharray={circumference}
          initial={reducedMotion ? { strokeDashoffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id={`progressGradient-${percentage}`} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor={statusColor.from} />
            <stop offset='100%' stopColor={statusColor.to} />
          </linearGradient>
        </defs>
      </svg>

      {/* Golden shimmer sparkles for 100% completion */}
      {percentage === 100 && !reducedMotion && (
        <>
          <GoldenSparkle delay={0} x={10} y={20} size={8} />
          <GoldenSparkle delay={0.5} x={95} y={15} size={6} />
          <GoldenSparkle delay={1} x={100} y={85} size={7} />
          <GoldenSparkle delay={1.5} x={5} y={90} size={5} />
          <GoldenSparkle delay={0.8} x={55} y={-5} size={6} />
          <GoldenSparkle delay={1.2} x={50} y={115} size={5} />
        </>
      )}

      {/* Percentage in center */}
      <div className='absolute inset-0 flex flex-col items-center justify-center p-4' aria-hidden='true'>
        <motion.span
          className='text-2xl font-bold'
          style={{ color: statusColor.from }}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {percentage}%
        </motion.span>
        <span className='mt-0.5 text-[10px] font-medium' style={{ color: statusColor.from, opacity: 0.75 }}>
          hoàn thành
        </span>
      </div>
    </div>
  )
}

export default CircularProgressRing
