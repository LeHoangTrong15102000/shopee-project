import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from 'src/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div role="main" className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <FileQuestion className="mb-4 size-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button onClick={() => navigate('/')} className="mt-6">
        Go to Dashboard
      </Button>
    </div>
  );
}
