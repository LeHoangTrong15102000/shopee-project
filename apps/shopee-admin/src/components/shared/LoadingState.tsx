import { Loader2 } from 'lucide-react'
import { Skeleton } from 'src/components/ui/skeleton'
import { cn } from 'src/lib/utils'

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton'
  fullPage?: boolean
  rows?: number
  className?: string
}

export function LoadingState({
  variant = 'spinner',
  fullPage = false,
  rows = 5,
  className,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center py-12',
        fullPage && 'fixed inset-0 z-50 bg-background/80',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}
