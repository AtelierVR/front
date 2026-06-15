'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api/context';
import { updateCurrentUser, uploadUserThumbnail, uploadUserBanner } from '@/lib/api/users';
import { useTranslation } from 'react-i18next';
import { SiteHeader } from '@/components/site-header';
import { TextInput } from '@/components/ui/text-input';
import { MarkdownAreaInput } from '@/components/ui/markdown-area-input';
import { ImageInput } from '@/components/ui/image-input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { DOT_COLORS } from '@/components/features/users/PresenceBadge';
import type { ApiUserPresence } from '@/types/api';

type PresenceStatus = ApiUserPresence['status'];

const PRESENCE_OPTIONS: PresenceStatus[] = ['oja', 'ojf', 'online', 'busy', 'dnd', 'stream', 'offline'];

export default function ProfilePage() {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [display, setDisplay] = useState<string | undefined>();
    const [bio, setBio] = useState<string | undefined>();
    const [pronoun, setPronoun] = useState<string | undefined>();
    const [presence, setPresence] = useState<PresenceStatus | undefined>();
    const [presenceStatus, setPresenceStatus] = useState<string | undefined>();
    const [thumbnail, setThumbnail] = useState<string | null | undefined>();
    const [banner, setBanner] = useState<string | null | undefined>();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Reset on user change
    useEffect(() => {
        setDisplay(undefined);
        setBio(undefined);
        setPronoun(undefined);
        setPresence(undefined);
        setPresenceStatus(undefined);
        setThumbnail(undefined);
        setBanner(undefined);
        setDirty(false);
    }, [currentUser?.id]);

    const markDirty = () => setDirty(true);

    const getDisplay = () => display ?? currentUser?.display ?? '';
    const getBio = () => bio ?? currentUser?.bio ?? '';
    const getPronoun = () => pronoun ?? currentUser?.pronoun ?? '';
    const getPresence = () => presence ?? currentUser?.presence?.status ?? 'offline';
    const getPresenceStatus = () => presenceStatus ?? currentUser?.presence?.text ?? '';
    const getThumbnail = () => thumbnail !== undefined ? thumbnail : currentUser?.thumbnail ?? null;
    const getBanner = () => banner !== undefined ? banner : currentUser?.banner ?? null;

    const handleSave = async () => {
        if (!dirty || saving) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await updateCurrentUser({
                display: display ?? undefined,
                bio: bio !== undefined ? (bio || null) : undefined,
                pronoun: pronoun !== undefined ? (pronoun || null) : undefined,
                presence: presence ?? undefined,
                presence_status: presenceStatus !== undefined ? (presenceStatus || null) : undefined,
            });
            // Upload images if changed
            if (thumbnail === null) {
                // TODO: delete thumbnail API not available yet
            } else if (thumbnail?.startsWith('data:')) {
                const blob = await (await fetch(thumbnail)).blob();
                await uploadUserThumbnail(blob);
            }
            if (banner === null) {
                // TODO: delete banner API not available yet
            } else if (banner?.startsWith('data:')) {
                const blob = await (await fetch(banner)).blob();
                await uploadUserBanner(blob);
            }
            setDisplay(undefined);
            setBio(undefined);
            setPronoun(undefined);
            setPresence(undefined);
            setPresenceStatus(undefined);
            setThumbnail(undefined);
            setBanner(undefined);
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
                children={t('settings.nav.profile')}
                subtitle={t('settings.profile.description')}
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

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left: Form fields */}
                    <div className="space-y-6 flex-1">
                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('settings.profile.display.title')}</h2>
                            <TextInput
                                value={getDisplay()}
                                onChange={v => { setDisplay(v); markDirty(); }}
                                placeholder={currentUser.display || currentUser.username}
                                maxLength={50}
                            />
                            <p className="text-sm text-muted-foreground">{t('settings.profile.display.description')}</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('settings.profile.bio.title')}</h2>
                            <MarkdownAreaInput
                                value={getBio()}
                                onChange={v => { setBio(v); markDirty(); }}
                                placeholder={t('settings.profile.bio.placeholder')}
                                rows={8}
                            />
                            <p className="text-sm text-muted-foreground">{t('settings.profile.bio.description')}</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('settings.profile.pronoun.title')}</h2>
                            <TextInput
                                value={getPronoun()}
                                onChange={v => { setPronoun(v); markDirty(); }}
                                placeholder="they/them"
                                maxLength={20}
                            />
                            <p className="text-sm text-muted-foreground">{t('settings.profile.pronoun.description')}</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('settings.profile.presence.title')}</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESENCE_OPTIONS.map(opt => (
                                    <Button
                                        key={opt}
                                        variant={getPresence() === opt ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => { setPresence(opt); markDirty(); }}
                                    >
                                        <span className={cn('h-2 w-2 rounded-full mr-1.5', DOT_COLORS[opt])} />
                                        {t(`presence.${opt}`)}
                                    </Button>
                                ))}
                            </div>
                            <TextInput
                                value={getPresenceStatus()}
                                onChange={v => { setPresenceStatus(v); markDirty(); }}
                                placeholder={t('settings.profile.presence.placeholder')}
                            />
                            <p className="text-sm text-muted-foreground">{t('settings.profile.presence.description')}</p>
                        </section>

                    </div>

                    {/* Right: Images */}
                    <div className="space-y-6 w-full md:w-72 shrink-0">
                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('settings.profile.images.thumbnail')}</h2>
                            <p className="text-sm text-muted-foreground">{t('settings.profile.images.thumbnail_desc')}</p>
                            <ImageInput
                                value={getThumbnail()}
                                onChange={dataUrl => { setThumbnail(dataUrl); markDirty(); }}
                                alt={currentUser.display ?? currentUser.username}
                                aspectRatio="1/1"
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">{t('settings.profile.images.thumbnail_hint')}</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('settings.profile.images.banner')}</h2>
                            <p className="text-sm text-muted-foreground">{t('settings.profile.images.banner_desc')}</p>
                            <ImageInput
                                value={getBanner()}
                                onChange={dataUrl => { setBanner(dataUrl); markDirty(); }}
                                alt={currentUser.display ?? currentUser.username}
                                aspectRatio="4/3"
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">{t('settings.profile.images.banner_hint')}</p>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
