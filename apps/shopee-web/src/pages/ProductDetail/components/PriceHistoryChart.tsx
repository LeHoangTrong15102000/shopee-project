import { PriceHistoryEntry } from 'src/apis/product.api'
import { formatCurrency } from 'src/utils/utils'

interface PriceHistoryChartProps {
  data: PriceHistoryEntry[]
}

const PriceHistoryChart = ({ data }: PriceHistoryChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-500 dark:text-gray-400">
        No price history available
      </div>
    )
  }

  const prices = data.map((d) => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const WIDTH = 600
  const HEIGHT = 200
  const PADDING = { top: 20, right: 20, bottom: 40, left: 60 }
  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom

  const getX = (index: number) => PADDING.left + (index / (data.length - 1 || 1)) * chartWidth

  const getY = (price: number) => PADDING.top + ((maxPrice - price) / priceRange) * chartHeight

  const pathD = data
    .map((entry, i) => {
      const x = getX(i)
      const y = getY(entry.price)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  // Area fill path
  const areaD = [
    pathD,
    `L ${getX(data.length - 1).toFixed(1)} ${(PADDING.top + chartHeight).toFixed(1)}`,
    `L ${PADDING.left.toFixed(1)} ${(PADDING.top + chartHeight).toFixed(1)}`,
    'Z',
  ].join(' ')

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return `${d.getDate()}/${d.getMonth() + 1}`
    } catch {
      return ''
    }
  }

  // Show at most 5 x-axis labels
  const labelIndices =
    data.length <= 5
      ? data.map((_, i) => i)
      : [
          0,
          Math.floor(data.length / 4),
          Math.floor(data.length / 2),
          Math.floor((data.length * 3) / 4),
          data.length - 1,
        ]

  // Y axis ticks
  const yTicks = [minPrice, (minPrice + maxPrice) / 2, maxPrice]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ minWidth: 280, maxWidth: '100%' }}
        aria-label="Price history chart"
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={getY(tick)}
              x2={PADDING.left + chartWidth}
              y2={getY(tick)}
              stroke="#e5e7eb"
              strokeDasharray="4 2"
              strokeWidth={1}
            />
            {/* Y axis label */}
            <text
              x={PADDING.left - 6}
              y={getY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {formatCurrency(tick)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="#ee4d2d" fillOpacity={0.08} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#ee4d2d"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((entry, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(entry.price)}
              r={3}
              fill="#ee4d2d"
              stroke="white"
              strokeWidth={1.5}
            >
              <title>{`${formatDate(entry.date)}: ${formatCurrency(entry.price)}`}</title>
            </circle>
          </g>
        ))}

        {/* X axis labels */}
        {labelIndices.map((i) => (
          <text key={i} x={getX(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="#6b7280">
            {formatDate(data[i].date)}
          </text>
        ))}

        {/* Axes */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + chartHeight}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top + chartHeight}
          x2={PADDING.left + chartWidth}
          y2={PADDING.top + chartHeight}
          stroke="#d1d5db"
          strokeWidth={1}
        />
      </svg>
    </div>
  )
}

export default PriceHistoryChart
