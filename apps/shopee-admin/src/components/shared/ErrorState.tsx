import { AlertCircle } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { cn } from 'src/lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="mb-4 size-12 text-destructive" />
      <p className="text-lg font-medium">Error</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4" size="sm">
          Retry
        </Button>
      )}
    </div>
  );
}
