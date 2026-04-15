import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'

const periodKeys = [
  { value: '7d', labelKey: 'period.last7days' },
  { value: '30d', labelKey: 'period.last30days' },
  { value: '90d', labelKey: 'period.last90days' },
  { value: '1y', labelKey: 'period.lastYear' },
  { value: 'custom', labelKey: 'period.customRange' },
]

interface PeriodSelectProps {
  value?: string
  onChange: (value: string) => void
  onCustomRange?: (startDate: string, endDate: string) => void
  className?: string
}

export function PeriodSelect({
  value = '30d',
  onChange,
  onCustomRange,
  className,
}: PeriodSelectProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { t } = useTranslation('layout')

  const handleChange = (v: string) => {
    onChange(v)
    if (v !== 'custom') {
      setStartDate('')
      setEndDate('')
    }
  }

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    if (start && end && onCustomRange) {
      onCustomRange(start, end)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => v && handleChange(v)}>
        <SelectTrigger className={className} aria-label={t('period.selectPeriod')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodKeys.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {t(p.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">{t('period.startDate')}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, endDate)}
              className="w-36"
            />
          </div>
          <span className="text-muted-foreground">{t('period.to')}</span>
          <div>
            <Label className="sr-only">{t('period.endDate')}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange(startDate, e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      )}
    </div>
  )
}
