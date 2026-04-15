import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from 'src/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: number
  formatter?: (value: string | number) => string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, trend, formatter, icon, className }: StatCardProps) {
  const displayValue = formatter ? formatter(value) : value

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {trend !== undefined && trend !== 0 && (
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs',
              trend > 0 ? 'text-green-600' : 'text-red-600',
            )}
          >
            {trend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            <span>
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
