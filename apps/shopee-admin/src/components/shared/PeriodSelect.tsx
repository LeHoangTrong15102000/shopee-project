import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';

const periods = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'custom', label: 'Custom Range' },
];

interface PeriodSelectProps {
  value?: string;
  onChange: (value: string) => void;
  onCustomRange?: (startDate: string, endDate: string) => void;
  className?: string;
}

export function PeriodSelect({
  value = '30d',
  onChange,
  onCustomRange,
  className,
}: PeriodSelectProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleChange = (v: string) => {
    onChange(v);
    if (v !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end && onCustomRange) {
      onCustomRange(start, end);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => v && handleChange(v)}>
        <SelectTrigger className={className} aria-label="Select time period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, endDate)}
              className="w-36"
            />
          </div>
          <span className="text-muted-foreground">to</span>
          <div>
            <Label className="sr-only">End date</Label>
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
  );
}
