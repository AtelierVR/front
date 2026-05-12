import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icon } from '@iconify/react';

interface PageErrorProps {
  message: string;
}

export function PageError({ message }: PageErrorProps) {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Alert variant="destructive">
        <Icon icon="material-symbols:error-rounded" className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
