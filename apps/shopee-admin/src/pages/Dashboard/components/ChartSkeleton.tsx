import { Skeleton } from 'src/components/ui/skeleton'
import { Card, CardContent, CardHeader } from 'src/components/ui/card'

const gridColsClass: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
}

export function ChartSkeleton({ columns = 2 }: { columns?: number }) {
  return (
    <div
      className={`grid gap-4 ${gridColsClass[columns] ?? ''}`}
      aria-busy="true"
      aria-label="Loading charts"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full md:h-[300px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
