'use client';

import { useTranslation } from 'react-i18next';
import { UserLayoutError } from '@/components/features/users/UserLayoutError';
import { Button } from '@/components/ui/button';

export default function UserError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <UserLayoutError message={error.message || t('error.generic', 'An unexpected error occurred.')} />
      <div className="container max-w-6xl mx-auto px-4">
        <Button variant="outline" onClick={reset}>{t('error.retry', 'Try again')}</Button>
      </div>
    </div>
  );
}
