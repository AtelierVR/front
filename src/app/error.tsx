'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  async function handleCopyError() {
    const text = [
      `${error.name}: ${error.message}`,
      error.stack ?? '',
      error.digest ? `Digest: ${error.digest}` : '',
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-xl w-full">
        <div className="rounded-full bg-destructive/10 p-6">
          <Icon icon="material-symbols:error-rounded" className="size-12 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('error.title')}</h1>
          <p className="text-muted-foreground">{t('error.description')}</p>
        </div>

        {error.digest && (
          <Alert className="w-full max-w-md text-center text-xs">
            <AlertDescription>
              {t('error.reference')} <span className="font-mono text-foreground">{error.digest}</span>
            </AlertDescription>
          </Alert>
        )}

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="w-full space-y-2 text-left">
            <Button
              variant="outline"
              className="w-full h-auto justify-between px-4 py-2.5"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span className="truncate">{error.name}: {error.message}</span>
              {showDetails ? <Icon icon="material-symbols:expand-less-rounded" className="size-4 shrink-0" /> : <Icon icon="material-symbols:expand-more-rounded" className="size-4 shrink-0" />}
            </Button>

            {showDetails && (
              <Alert variant="destructive" className="relative overflow-x-auto max-h-64 text-left">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyError}
                  title={t('error.copy_error')}
                >
                  {copied
                    ? <Icon icon="material-symbols:check-rounded" className="size-4 text-green-500" />
                    : <Icon icon="material-symbols:content-copy-rounded" className="size-4" />}
                </Button>
                <AlertDescription className="font-mono text-xs whitespace-pre-wrap pr-8">
                  {error.name}: {error.message}
                  {error.stack && <span className="mt-4 block">{error.stack}</span>}
                  {error.digest && <span className="mt-4 block">Digest: {error.digest}</span>}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset} className="gap-2">
            <Icon icon="material-symbols:refresh-rounded" className="size-4" />
            {t('error.try_again')}
          </Button>
          <Button variant="outline" className="gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Icon icon="material-symbols:home-rounded" className="size-4" />
              {t('error.go_home')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
