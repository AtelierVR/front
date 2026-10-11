'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { notify } from '@/components/ui/notify';
import { useApi } from '@/lib/api/context';
import {
    deletePasskey,
    isPasskeyCancelled,
    listPasskeys,
    passkeysSupported,
    registerPasskey,
    type Passkey,
} from '@/lib/api/passkeys';

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Passkey management: list the account's credentials, register a new one and
 * remove existing ones. Registration opens the browser's WebAuthn ceremony.
 */
export function PasskeysPart() {
    const { t } = useTranslation();
    const { config } = useApi();

    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [name, setName] = useState('');
    const [browserSupported, setBrowserSupported] = useState(true);

    const serverSupported = config?.support_passkey === true;
    const supported = browserSupported && serverSupported;

    const load = useCallback(async () => {
        try {
            setPasskeys(await listPasskeys());
        } catch {
            // Not signed in or endpoint unavailable — keep the list empty.
            setPasskeys([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setBrowserSupported(passkeysSupported());
    }, []);

    useEffect(() => {
        if (!serverSupported) {
            setLoading(false);
            return;
        }
        load();
    }, [load, serverSupported]);

    const handleAdd = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await registerPasskey(name.trim() || undefined);
            setName('');
            setAddOpen(false);
            await load();
            notify(t('settings.security.passkeys.added'), { type: 'success' });
        } catch (err: unknown) {
            if (!isPasskeyCancelled(err))
                notify((err as Error)?.message ?? t('settings.security.passkeys.failed_add'), { type: 'danger' });
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async (passkey: Passkey) => {
        if (busy) return;
        setBusy(true);
        try {
            await deletePasskey(passkey.id);
            await load();
            notify(t('settings.security.passkeys.removed'), { type: 'success' });
        } catch (err: unknown) {
            notify((err as Error)?.message ?? t('settings.security.passkeys.failed_remove'), { type: 'danger' });
        } finally {
            setBusy(false);
        }
    };

    const empty = passkeys.length === 0;

    return (
        <section id="passkeys" className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{t('settings.security.passkeys.title')}</h2>
                <Badge variant={empty ? 'secondary' : 'default'}>
                    <Icon icon="material-symbols:passkey-rounded" className="size-3 mr-1" />
                    {passkeys.length}
                </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
                {t('settings.security.passkeys.description')}
            </p>

            {!supported ? (
                <p className="text-sm text-muted-foreground pt-1">
                    {t('settings.security.passkeys.unsupported')}
                </p>
            ) : loading ? (
                <div className="space-y-2 pt-1">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            ) : empty ? (
                <p className="text-sm text-muted-foreground pt-1">
                    {t('settings.security.passkeys.empty')}
                </p>
            ) : (
                <ul className="space-y-2 pt-1">
                    {passkeys.map((passkey) => (
                        <li
                            key={passkey.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                            <Icon icon="material-symbols:passkey-rounded" className="size-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {passkey.name || t('settings.security.passkeys.unnamed')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {t('settings.security.passkeys.added_on', { date: formatDate(passkey.created_at) })}
                                    {passkey.last_used_at
                                        ? ` · ${t('settings.security.passkeys.last_used', { date: formatDate(passkey.last_used_at) })}`
                                        : ''}
                                    {passkey.backed_up ? ` · ${t('settings.security.passkeys.synced')}` : ''}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="ml-auto shrink-0 text-destructive hover:text-destructive"
                                disabled={busy}
                                aria-label={t('settings.security.passkeys.remove')}
                                onClick={() => handleRemove(passkey)}
                            >
                                <Icon icon="material-symbols:delete-rounded" className="size-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="pt-1">
                <Button
                    onClick={() => setAddOpen(true)}
                    disabled={busy || !supported}
                    variant="outline"
                    size="sm"
                >
                    <Icon icon="material-symbols:add-rounded" className="size-4 mr-1.5" />
                    {t('settings.security.passkeys.add')}
                </Button>
            </div>

            <ModalDrawer
                open={addOpen}
                onOpenChange={(open) => !busy && setAddOpen(open)}
                header={t('settings.security.passkeys.add')}
                footer={
                    <div className="flex w-full justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)} disabled={busy}>
                            {t('common.cancel')}
                        </Button>
                        <Button size="sm" onClick={handleAdd} disabled={busy}>
                            {busy ? t('settings.security.passkeys.waiting') : t('settings.security.passkeys.create')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('settings.security.passkeys.add_hint')}
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="passkey-name">{t('settings.security.passkeys.name_label')}</Label>
                        <Input
                            id="passkey-name"
                            value={name}
                            maxLength={64}
                            placeholder={t('settings.security.passkeys.name_placeholder')}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
            </ModalDrawer>
        </section>
    );
}
