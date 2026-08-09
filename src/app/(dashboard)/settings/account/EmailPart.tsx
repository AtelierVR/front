'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { useApi } from '@/lib/api/context';
import { setupEmail, removeEmail, sendVerificationCode } from '@/lib/api/auth';
import { useTranslation } from 'react-i18next';
import { notify } from '@/components/ui/notify';

interface EmailPartProps {}

export function EmailPart(_props: EmailPartProps) {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const hasEmail = !!currentUser?.email;
    const isVerified = currentUser?.email_verified ?? false;

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleAddEmail = async () => {
        if (!email || email !== confirmEmail || loading) return;
        setLoading(true);
        try {
            await setupEmail(email);
            notify(t('settings.security.email.updated_success'), { type: 'success' });
            setDialogOpen(false);
            setEmail('');
            setConfirmEmail('');
        } catch (err: any) {
            notify(err?.message ?? t('settings.security.email.failed_update'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await removeEmail();
            notify(t('settings.security.email.removed_success'), { type: 'success' });
            setRemoveDialogOpen(false);
        } catch (err: any) {
            notify(err?.message ?? t('settings.security.email.failed_remove'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await sendVerificationCode('email', { target: currentUser?.id });
            notify(t('settings.security.email.verification_sent'), { type: 'success' });
        } catch (err: any) {
            notify(err?.message ?? t('settings.security.email.failed_send_verification'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <section id="email" className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{t('settings.security.email.title')}</h2>
                {hasEmail && (
                    <Badge variant={isVerified ? 'default' : 'secondary'}>
                        {isVerified ? (
                            <>
                                <Icon icon="material-symbols:check-circle-rounded" className="size-3 mr-1" />
                                {t('settings.security.email.verified')}
                            </>
                        ) : (
                            <>
                                <Icon icon="material-symbols:cancel-rounded" className="size-3 mr-1" />
                                {t('settings.security.email.unverified')}
                            </>
                        )}
                    </Badge>
                )}
            </div>

            <p className="text-sm text-muted-foreground">
                {hasEmail ? (
                    <>
                        {t('settings.security.email.current_email')}{' '}
                        <span className="font-medium">{currentUser?.email}</span>
                        <br />
                        {isVerified
                            ? t('settings.security.email.verified_description')
                            : t('settings.security.email.unverified_description')}
                    </>
                ) : (
                    t('settings.security.email.no_email_description')
                )}
            </p>

            <div className="flex flex-wrap gap-2">
                {!hasEmail && (
                    <Button variant="outline" size="sm" onClick={() => { setEmail(''); setConfirmEmail(''); setDialogOpen(true); }}>
                        <Icon icon="material-symbols:add-rounded" className="size-4 mr-1.5" />
                        {t('settings.security.email.add_email')}
                    </Button>
                )}

                {hasEmail && !isVerified && (
                    <Button variant="outline" size="sm" onClick={handleResend} disabled={loading}>
                        <Icon icon="material-symbols:mail-rounded" className="size-4 mr-1.5" />
                        {loading ? t('settings.security.email.sending') : t('settings.security.email.send_verification')}
                    </Button>
                )}

                {hasEmail && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRemoveDialogOpen(true)}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                    >
                        <Icon icon="material-symbols:delete-rounded" className="size-4 mr-1.5" />
                        {loading ? t('settings.security.email.removing') : t('settings.security.email.remove_email')}
                    </Button>
                )}
            </div>

            {/* Add email dialog */}
            <ModalDrawer
                open={dialogOpen}
                onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEmail(''); setConfirmEmail(''); } }}
                header={t('settings.security.email.add_email_title')}
                footer={
                    <div className="flex w-full justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setDialogOpen(false); setEmail(''); setConfirmEmail(''); }}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleAddEmail} disabled={loading || !email || email !== confirmEmail}>
                            {loading ? t('settings.security.email.saving_email') : t('settings.security.email.add_email')}
                        </Button>
                    </div>
                }
            >
                <p className="text-sm text-muted-foreground">
                    {t('settings.security.email.add_email_desc')}
                </p>
                <div className="space-y-3">
                    <InputGroup>
                        <InputGroupInput
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('settings.security.email.new_email_placeholder')}
                        />
                    </InputGroup>
                    <InputGroup>
                        <InputGroupInput
                            type="email"
                            value={confirmEmail}
                            onChange={e => setConfirmEmail(e.target.value)}
                            placeholder={t('settings.security.email.confirm_email_placeholder')}
                        />
                    </InputGroup>
                    {email !== confirmEmail && confirmEmail.length > 0 && (
                        <p className="text-sm text-destructive">{t('settings.security.email.emails_mismatch')}</p>
                    )}
                </div>
            </ModalDrawer>

            {/* Remove email confirmation dialog */}
            <ModalDrawer
                open={removeDialogOpen}
                onOpenChange={setRemoveDialogOpen}
                header={t('settings.security.email.remove_title')}
                footer={
                    <div className="flex w-full justify-end gap-2">
                        <Button variant="ghost" onClick={() => setRemoveDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleDelete} disabled={loading} variant="destructive">
                            {loading ? t('settings.security.email.removing') : t('settings.security.email.remove_email')}
                        </Button>
                    </div>
                }
            >
                <p className="text-sm text-muted-foreground">
                    {t('settings.security.email.remove_description')}
                </p>
            </ModalDrawer>
        </section>
    );
}
