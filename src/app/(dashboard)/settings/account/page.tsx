'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api/context';
import { updateCurrentUser } from '@/lib/api/users';
import { useTranslation } from 'react-i18next';
import { SiteHeader } from '@/components/site-header';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText } from '@/components/ui/input-group';
import { TagListInput } from '@/components/ui/tag-list-input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

export default function AccountPage() {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [username, setUsername] = useState<string | undefined>();
    const [tags, setTags] = useState<string[] | undefined>();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        setUsername(undefined);
        setTags(undefined);
        setDirty(false);
    }, [currentUser?.id]);

    const markDirty = () => setDirty(true);

    const getUsername = () => username ?? currentUser?.username ?? '';
    const getTags = () => tags ?? currentUser?.tags ?? [];

    const handleSave = async () => {
        if (!dirty || saving) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await updateCurrentUser({
                username: username ?? undefined,
                tags: tags ?? undefined,
            });
            setUsername(undefined);
            setTags(undefined);
            setDirty(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e: any) {
            setError(e?.message ?? t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    if (!currentUser) return null;

    return (
        <>
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
                    <div className="rounded-lg bg-emerald-500/10 p-4 text-emerald-600 text-sm mb-6">{t('settings.profile.saved')}</div>
                )}

                <div className="space-y-8">
                    {/* Username */}
                    <section id="username" className="space-y-2">
                        <h2 className="text-base font-semibold">{t('settings.account.username.title')}</h2>
                        <p className="text-sm text-muted-foreground">{t('settings.account.username.description')}</p>
                        <InputGroup>
                            <InputGroupInput
                                value={getUsername()}
                                onChange={e => { setUsername(e.target.value); markDirty(); }}
                                placeholder={currentUser.username}
                                maxLength={32}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>@{currentUser.server}</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    </section>

                    {/* Tags */}
                    <section id="tags" className="space-y-2">
                        <h2 className="text-base font-semibold">{t('settings.account.tags.title')}</h2>
                        <p className="text-sm text-muted-foreground">{t('settings.account.tags.description')}</p>
                        <TagListInput
                            tags={getTags()}
                            onChange={next => { setTags(next); markDirty(); }}
                        />
                        <p className="text-xs text-muted-foreground">{t('settings.profile.tags.hint')}</p>
                    </section>
                </div>
            </div>
        </>
    );
}
