'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { PageTitle } from '@/components/shared/PageTitle';
import { verifyEmailCode } from '@/lib/api/auth';
import { useApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const { wellKnown } = useApi();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        if(!wellKnown?.gateway.api) return;

        verifyEmailCode(token)
            .then((result) => {
                setStatus(result.enabled ? 'success' : 'error');
            })
            .catch(() => {
                setStatus('error');
            });
    }, [token, wellKnown]);

    const title =
        status === 'loading' ? t('confirmation.verifying') :
        status === 'success' ? t('confirmation.verified') :
        t('confirmation.failed');

    return (
        <>
            <PageTitle title={title} />
            <Card className="shadow-lg w-full max-w-md">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                    {status === 'loading' && (
                        <>
                            <Icon icon="material-symbols:progress-activity-rounded" className="size-12 animate-spin text-muted-foreground" />
                            <h2 className="font-heading text-xl font-semibold">{t('confirmation.verifying_description')}</h2>
                            <p className="text-sm text-muted-foreground">{t('confirmation.please_wait')}</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <Icon icon="material-symbols:check-circle-rounded" className="size-12 text-green-500" />
                            <h2 className="font-heading text-xl font-semibold text-green-600 dark:text-green-400">{t('confirmation.verified')}</h2>
                            <p className="text-sm text-muted-foreground">{t('confirmation.success_message')}</p>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <Icon icon="material-symbols:error-rounded" className="size-12 text-destructive" />
                            <h2 className="font-heading text-xl font-semibold text-destructive">{t('confirmation.failed')}</h2>
                            <p className="text-sm text-muted-foreground">
                                {!token ? t('confirmation.missing_token') : t('confirmation.invalid_token')}
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={
            <Card className="shadow-lg w-full max-w-md">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                    <Icon icon="material-symbols:progress-activity-rounded" className="size-12 animate-spin text-muted-foreground" />
                    <h2 className="font-heading text-xl font-semibold">Verifying...</h2>
                </CardContent>
            </Card>
        }>
            <ConfirmationContent />
        </Suspense>
    );
}
