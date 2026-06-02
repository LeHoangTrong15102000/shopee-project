import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, X } from 'lucide-react'
import { Button } from 'src/components/ui/button'

interface FilterPanelProps {
  onClear: () => void
  children: React.ReactNode
}

export function FilterPanel({ onClear, children }: FilterPanelProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { t: tc } = useTranslation('common')

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen((o) => !o)}>
          <Filter className="mr-2 size-4" />
          {tc('buttons.filters')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 size-4" />
          {tc('buttons.clearFilters')}
        </Button>
      </div>
      {filtersOpen && <div className="rounded-lg border p-4">{children}</div>}
    </>
  )
}
