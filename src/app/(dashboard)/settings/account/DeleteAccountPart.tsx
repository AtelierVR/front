'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { useApi } from '@/lib/api/context';
import { deleteCurrentUser } from '@/lib/api/users';
import { useTranslation } from 'react-i18next';
import { notify } from '@/components/ui/notify';

/**
 * Danger zone: permanently delete the account. The user must type their username
 * to arm the button; the actual request is then gated by the global verification
 * flow (the API answers `VERIFICATION_REQUIRED`).
 */
export function DeleteAccountPart() {
    const { t } = useTranslation();
    const { currentUser, logout } = useApi();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState('');
    const [loading, setLoading] = useState(false);

    const username = currentUser?.username ?? '';
    const canDelete = !!username && confirmation.trim().toLowerCase() === username.toLowerCase();

    const close = () => {
        if (loading) return;
        setOpen(false);
        setConfirmation('');
    };

    const handleDelete = async () => {
        if (!canDelete || loading) return;
        setLoading(true);
        try {
            await deleteCurrentUser();
            setOpen(false);
            notify(t('settings.account.delete.success'), { type: 'success' });
            // The session is gone server-side — clear local state and leave.
            await logout().catch(() => { });
            router.push('/');
        } catch (err) {
            // Cancelling the verification modal is not an error worth surfacing.
            const apiError = err as { code?: string; message?: string };
            if (apiError.code !== 'VERIFICATION_REQUIRED')
                notify(apiError.message ?? t('settings.account.delete.failed'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="delete-account" className="space-y-2 border-t border-border pt-6">
            <h2 className="text-base font-semibold text-destructive">
                {t('settings.account.delete.title')}
            </h2>

            <p className="text-sm text-muted-foreground">
                {t('settings.account.delete.description')}
            </p>

            <Button
                variant="destructive"
                size="sm"
                onClick={() => { setConfirmation(''); setOpen(true); }}
            >
                <Icon icon="material-symbols:delete-forever-rounded" className="size-4 mr-1.5" />
                {t('settings.account.delete.button')}
            </Button>

            <ModalDrawer
                open={open}
                onOpenChange={(next) => { if (!next) close(); }}
                header={t('settings.account.delete.confirm_title')}
                footer={
                    <div className="flex w-full justify-end gap-2">
                        <Button variant="ghost" onClick={close} disabled={loading}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleDelete} disabled={!canDelete || loading} variant="destructive">
                            {loading ? t('settings.account.delete.deleting') : t('settings.account.delete.confirm_button')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {t('settings.account.delete.confirm_description', { username })}
                    </p>
                    <InputGroup>
                        <InputGroupInput
                            value={confirmation}
                            onChange={e => setConfirmation(e.target.value)}
                            placeholder={t('settings.account.delete.confirm_placeholder')}
                            autoComplete="off"
                        />
                    </InputGroup>
                </div>
            </ModalDrawer>
        </section>
    );
}
