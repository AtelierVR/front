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
import { PasskeysPart } from './PasskeysPart';
import { DeleteAccountPart } from './DeleteAccountPart';
import { notify } from '@/components/ui/notify';
import { sameValues } from '@/lib/utils';

export default function AccountPage() {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [username, setUsername] = useState<string | undefined>();
    const [tags, setTags] = useState<string[] | undefined>();

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setUsername(undefined);
        setTags(undefined);
    }, [currentUser?.id]);

    const getTags = () => tags ?? currentUser?.tags ?? [];

    // Save is enabled only while a field actually differs from the stored value.
    const originalUsrTags = (currentUser?.tags ?? []).filter(tag => tag.startsWith('usr:'));
    const dirty =
        (username !== undefined && username !== (currentUser?.username ?? '')) ||
        (tags !== undefined && !sameValues(tags, originalUsrTags));

    const handleSave = async () => {
        if (!dirty || saving) return;
        setSaving(true);
        try {
            await updateCurrentUser({
                username: username ?? undefined,
                tags: tags ?? undefined,
            });
            setUsername(undefined);
            setTags(undefined);
            notify(t('settings.profile.saved'), { type: 'success' });
        } catch (e: any) {
            console.error('Error', e);
            notify(e?.message ?? t('common.error'), { type: 'danger' });
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
                <div className="space-y-8">
                    <UsernamePart
                        username={username}
                        onChange={setUsername}
                    />

                    <TagsPart
                        tags={getTags()}
                        onChange={setTags}
                    />

                    <EmailPart />

                    <TwoFAPart />

                    <PasskeysPart />

                    <DeleteAccountPart />
                </div>
            </div>
        </>
    );
}
