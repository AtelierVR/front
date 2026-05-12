'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/lib/api/context';
import { login as apiLogin } from '@/lib/api/auth';
import { ApiError } from '@/types/envelope';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormCard } from '@/components/ui/form-card';
import { PasswordInput } from '@/components/ui/password-input';
import { PageTitle } from '@/components/shared/PageTitle';

function isTotpError(err: unknown): boolean {
    if (err instanceof ApiError) {
        const code = err.code.toUpperCase();
        const msg = err.message.toLowerCase();
        return code.includes('FACTOR') || code.includes('TOTP') || code.includes('2FA') ||
            msg.includes('factor') || msg.includes('totp') || msg.includes('2fa');
    }
    return false;
}

export function LoginForm() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useApi();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [factorCode, setFactorCode] = useState('');
    const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const redirect = searchParams.get('redirect') ?? '/';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const session = await apiLogin({
                identifier,
                password,
                ...(step === 'totp' ? { factor_code: factorCode } : {}),
            });
            login(session.token, session.expires, session.user);
            router.replace(redirect);
        } catch (err: unknown) {
            if (step === 'credentials' && isTotpError(err)) {
                setStep('totp');
            } else {
                setError((err as Error)?.message ?? t('errors.500'));
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <FormCard
            title={t('auth.login_title')}
            description={step === 'totp' ? t('auth.totp_description') : t('auth.login_description')}
        >
            <PageTitle title={t('auth.login_title')} />
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}

                {step === 'credentials' ? (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="identifier">{t('auth.username')}</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="username or email"
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('auth.password')}</Label>
                                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline underline-offset-2">
                                    {t('auth.forgot_password')}
                                </Link>
                            </div>
                            <PasswordInput
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium">{t('auth.totp_required')}</p>
                        <div className="space-y-2">
                            <Label htmlFor="factor-code">{t('auth.totp_code')}</Label>
                            <Input
                                id="factor-code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={8}
                                placeholder="123456"
                                value={factorCode}
                                onChange={(e) => setFactorCode(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <button
                            type="button"
                            className="text-xs text-muted-foreground hover:underline underline-offset-2"
                            onClick={() => { setStep('credentials'); setFactorCode(''); setError(null); }}
                        >
                            ← {t('auth.login')}
                        </button>
                    </>
                )}

                <div className="mt-8 flex flex-col gap-3">
                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? t('auth.signing_in') : t('auth.login')}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        {t('auth.no_account')}{' '}
                        <Link href="/register" className="text-foreground underline underline-offset-2 hover:text-primary">
                            {t('auth.register')}
                        </Link>
                    </p>
                </div>
            </form>
        </FormCard>
    );
}
