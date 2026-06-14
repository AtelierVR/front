'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/lib/api/context';
import { register as apiRegister } from '@/lib/api/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormCard } from '@/components/ui/form-card';
import { PasswordInput } from '@/components/ui/password-input';
import { PageTitle } from '@/components/shared/PageTitle';

export function RegisterForm() {
    const { t } = useTranslation();
    const router = useRouter();
    const { login, config } = useApi();

    const [username, setUsername] = useState('');
    const [display, setDisplay] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Guard: registration must be open
    if (config !== null && !config.allow_user_registration)
        return <FormCard title={t('auth.register_title')} description={t('auth.register_description')}>
            <p className="text-center text-sm text-muted-foreground">{t('auth.registration_closed')}</p>
        </FormCard>;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (password !== confirm) {
            setError(t('auth.password_mismatch'));
            return;
        }
        setSubmitting(true);
        try {
            const session = await apiRegister({
                username,
                password,
                display: display.trim() || undefined,
                email: email.trim() || undefined,
            });
            login(session.token, session.expires, session.user);
            router.replace('/');
        } catch (err: unknown) {
            setError((err as Error)?.message ?? t('errors.500'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <FormCard
            title={t('auth.register_title')}
            description={t('auth.register_description')}
        >
            <PageTitle title={t('auth.register_title')} />
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}

                <div className="space-y-2">
                    <Label htmlFor="username">
                        {t('auth.username')}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder=""
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="display">
                        {t('auth.display_name')}
                    </Label>
                    <Input
                        id="display"
                        type="text"
                        placeholder=""
                        autoComplete="name"
                        value={display}
                        onChange={(e) => setDisplay(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">
                        {t('auth.email')}
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder=""
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        {t('auth.password')}
                        <span className="text-destructive">*</span>
                    </Label>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm">
                        {t('auth.confirm_password')}
                        <span className="text-destructive">*</span>
                    </Label>
                    <PasswordInput
                        id="confirm"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? t('auth.creating_account') : t('auth.register')}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        {t('auth.have_account')}{' '}
                        <Link href="/login" className="text-foreground underline underline-offset-2 hover:text-primary">
                            {t('auth.login')}
                        </Link>
                    </p>
                </div>
            </form>
        </FormCard>
    );
}
