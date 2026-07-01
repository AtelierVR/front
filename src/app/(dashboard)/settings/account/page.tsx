'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api/context';
import { updateCurrentUser } from '@/lib/api/users';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { UsernamePart } from './UsernamePart';
import { TagsPart } from './TagsPart';
import { EmailPart } from './EmailPart';
import { TwoFAPart } from './TwoFAPart';

export default function AccountPage() {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [username, setUsername] = useState<string | undefined>();
    const [tags, setTags] = useState<string[] | undefined>();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        setUsername(undefined);
        setTags(undefined);
        setDirty(false);
    }, [currentUser?.id]);

    const markDirty = () => setDirty(true);

    const getTags = () => tags ?? currentUser?.tags ?? [];

    const handleSave = async () => {
        if (!dirty || saving) return;
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await updateCurrentUser({
                username: username ?? undefined,
                tags: tags ?? undefined,
            });
            setUsername(undefined);
            setTags(undefined);
            setDirty(false);
            setSuccess(t('settings.profile.saved'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            console.error('Error', e);
            setError(e?.message ?? t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    if (!currentUser) return null;

    return (
        <>
            <PageTitle title={t('settings.account.title')} />
            <SiteHeader
                children={t('settings.account.title')}
                subtitle={t('settings.account.description')}
                after={
                    <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
                        {saving ? (
                            <>
                                <Icon icon="material-symbols:progress-activity" className="size-4 mr-1.5 animate-spin" />
                                {t('settings.profile.saving')}
                            </>
                        ) : (
                            <>
                                <Icon icon="material-symbols:save-rounded" className="size-4 mr-1.5" />
                                {t('settings.profile.save')}
                            </>
                        )}
                    </Button>
                }
            />

            <div className="p-4 md:p-6">
                {error && (
                    <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm mb-6">{error}</div>
                )}
                {success && (
                    <div className="rounded-lg bg-emerald-500/10 p-4 text-emerald-600 text-sm mb-6">{success}</div>
                )}

                <div className="space-y-8">
                    <UsernamePart
                        username={username}
                        onChange={setUsername}
                        onDirty={markDirty}
                    />

                    <TagsPart
                        tags={getTags()}
                        onChange={next => { setTags(next); markDirty(); }}
                        onDirty={markDirty}
                    />

                    <EmailPart
                        setError={setError}
                        setSuccess={setSuccess}
                    />

                    <TwoFAPart
                        setError={setError}
                        setSuccess={setSuccess}
                    />
                </div>
            </div>
        </>
    );
}
