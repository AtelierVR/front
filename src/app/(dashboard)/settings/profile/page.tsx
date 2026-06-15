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
import { useCountries } from '@/lib/hooks/useCountries';
import { useLanguages } from '@/lib/hooks/useLanguages';
import { localeFlagUrl } from '@/lib/languages';
import { addUrlQuery, removeUrlQuery } from '@/lib/url';
import type { ApiUserPresence } from '@/types/api';

type PresenceStatus = ApiUserPresence['status'];

const PRESENCE_OPTIONS: PresenceStatus[] = ['oja', 'ojf', 'online', 'busy', 'dnd', 'stream', 'offline'];

const CTY_TAG = 'usr:country_';
const LNG_TAG = 'usr:lang_';

function countryTag(code: string) { return `${CTY_TAG}${code.toLowerCase()}`; }
function langTag(code: string) { return `${LNG_TAG}${code.toLowerCase()}`; }
function isNotCtyOrLng(t: string) { return !t.startsWith(CTY_TAG) && !t.startsWith(LNG_TAG); }

/** Strips the `size` query param from a remote image URL. Returns null for falsy values. */
function cleanImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return addUrlQuery(removeUrlQuery(url, 'size'), 'unoptimized');
}

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
    const [selectedCty, setSelectedCty] = useState<string[] | undefined>();
    const [selectedLng, setSelectedLng] = useState<string[] | undefined>();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dirty, setDirty] = useState(false);

    const { countries, loading: ctyLoading } = useCountries();
    const { languages, loading: lngLoading } = useLanguages();

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
    const getThumbnail = () => thumbnail !== undefined ? thumbnail : cleanImageUrl(currentUser?.thumbnail);
    const getBanner = () => banner !== undefined ? banner : cleanImageUrl(currentUser?.banner);

    const handleSave = async () => {
        if (!dirty || saving) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            // Build tags: preserve original for untouched categories, use new selection for touched ones
            const allCurrentTags = currentUser?.tags ?? [];
            const ctyTags = selectedCty !== undefined
                ? selectedCty.map(c => countryTag(c))
                : allCurrentTags.filter(t => t.startsWith(CTY_TAG));
            const lngTags = selectedLng !== undefined
                ? selectedLng.map(c => langTag(c))
                : allCurrentTags.filter(t => t.startsWith(LNG_TAG));
            const otherTags = allCurrentTags.filter(isNotCtyOrLng);
            const allTags = [...otherTags, ...ctyTags, ...lngTags];

            // Upload images first so updateCurrentUser returns fresh URLs
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

            // updateCurrentUser calls dispatchCurrentUserReplace which refreshes
            // currentUser in context (including new thumbnail/banner URLs).
            await updateCurrentUser({
                display: display ?? undefined,
                bio: bio !== undefined ? (bio || null) : undefined,
                pronoun: pronoun !== undefined ? (pronoun || null) : undefined,
                presence: presence ?? undefined,
                presence_status: presenceStatus !== undefined ? (presenceStatus || null) : undefined,
                tags: (selectedCty !== undefined || selectedLng !== undefined) ? allTags : undefined,
            });

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

                        {/* Country / Language */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <section className="space-y-2">
                                <h2 className="text-base font-semibold">{t('settings.profile.country.title')}</h2>
                                <p className="text-sm text-muted-foreground">{t('settings.profile.country.description')}</p>
                                <CountriesPicker
                                    countries={countries}
                                    loading={ctyLoading}
                                    selected={selectedCty ?? currentUser.tags.filter(t => t.startsWith(CTY_TAG)).map(t => t.slice(CTY_TAG.length))}
                                    onChange={codes => { setSelectedCty(codes); markDirty(); }}
                                />
                            </section>
                            <section className="space-y-2">
                                <h2 className="text-base font-semibold">{t('settings.profile.language.title')}</h2>
                                <p className="text-sm text-muted-foreground">{t('settings.profile.language.description')}</p>
                                <LanguagesPicker
                                    languages={languages}
                                    loading={lngLoading}
                                    selected={selectedLng ?? currentUser.tags.filter(t => t.startsWith(LNG_TAG)).map(t => t.slice(LNG_TAG.length))}
                                    onChange={codes => { setSelectedLng(codes); markDirty(); }}
                                />
                            </section>
                        </div>

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

// ── Inline pickers ──────────────────────────────────────────────────────────

function CountriesPicker({ countries, loading, selected, onChange }: { countries: { id: string; name: string; flag: string }[]; loading: boolean; selected: string[]; onChange: (codes: string[]) => void }) {
    const { t } = useTranslation();
    const [q, setQ] = useState('');
    const add = (id: string) => { if (!selected.includes(id)) onChange([...selected, id]); };
    const remove = (id: string) => onChange(selected.filter(c => c !== id));
    const available = countries.filter(c => !selected.includes(c.id) && c.name.toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <h3 className="text-sm font-medium">{t('settings.profile.country.selected', { count: selected.length })}</h3>
                <div className="flex flex-wrap gap-2">
                    {selected.length === 0 && <p className="text-sm text-muted-foreground">{t('settings.profile.country.none')}</p>}
                    {selected.map(id => {
                        const c = countries.find(x => x.id === id);
                        if (!c) return null;
                        return (
                            <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-fd-secondary px-2.5 py-1 text-xs cursor-pointer hover:bg-fd-muted transition-colors" onClick={() => remove(id)}>
                                <img src={c.flag} alt={c.name} className="h-3.5 w-auto rounded-sm" />
                                <span>{c.name}</span>
                                <Icon icon="material-symbols:close-rounded" className="size-3" />
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{t('settings.profile.country.add')}</h3>
                    <div className="relative w-full sm:w-48">
                        <Icon icon="material-symbols:search-rounded" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            className="flex h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-sm"
                            placeholder={t('settings.profile.country.search')}
                            value={q}
                            onChange={e => setQ(e.target.value)}
                        />
                        {q && (
                            <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <Icon icon="material-symbols:close-rounded" className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="h-36 overflow-y-auto pr-1">
                    {loading ? (
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-7 w-24 bg-fd-muted animate-pulse rounded-full" />
                            ))}
                        </div>
                    ) : available.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {available.map(c => (
                                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-fd-secondary px-2.5 py-1 text-xs cursor-pointer hover:bg-fd-muted transition-colors" onClick={() => add(c.id)}>
                                    <img src={c.flag} alt={c.name} className="h-3.5 w-auto rounded-sm" />
                                    <span>{c.name}</span>
                                    <Icon icon="material-symbols:add-rounded" className="size-3" />
                                </span>
                            ))}
                        </div>
                    ) : q ? (
                        <p className="text-sm text-muted-foreground py-2">{t('settings.profile.country.no_match')}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground py-2">{t('settings.profile.country.all_added')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function LanguagesPicker({ languages, loading, selected, onChange }: { languages: { code: string; name: string; flag: string }[]; loading: boolean; selected: string[]; onChange: (codes: string[]) => void }) {
    const { t } = useTranslation();
    const [q, setQ] = useState('');
    const add = (code: string) => { if (!selected.includes(code)) onChange([...selected, code]); };
    const remove = (code: string) => onChange(selected.filter(c => c !== code));
    const available = languages.filter(l => !selected.includes(l.code) && l.name.toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <h3 className="text-sm font-medium">{t('settings.profile.language.selected', { count: selected.length })}</h3>
                <div className="flex flex-wrap gap-2">
                    {selected.length === 0 && <p className="text-sm text-muted-foreground">{t('settings.profile.language.none')}</p>}
                    {selected.map(code => {
                        const l = languages.find(x => x.code === code);
                        return (
                            <span key={code} className="inline-flex items-center gap-1.5 rounded-full bg-fd-secondary px-2.5 py-1 text-xs cursor-pointer hover:bg-fd-muted transition-colors" onClick={() => remove(code)}>
                                {l?.flag && <img src={l.flag} alt="" className="h-3.5 w-auto rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                <span>{l?.name ?? code}</span>
                                <Icon icon="material-symbols:close-rounded" className="size-3" />
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{t('settings.profile.language.add')}</h3>
                    <div className="relative w-full sm:w-48">
                        <Icon icon="material-symbols:search-rounded" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            className="flex h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-sm"
                            placeholder={t('settings.profile.language.search')}
                            value={q}
                            onChange={e => setQ(e.target.value)}
                        />
                        {q && (
                            <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <Icon icon="material-symbols:close-rounded" className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="h-36 overflow-y-auto pr-1">
                    {loading ? (
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-7 w-20 bg-fd-muted animate-pulse rounded-full" />
                            ))}
                        </div>
                    ) : available.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {available.map(l => (
                                <span key={l.code} className="inline-flex items-center gap-1.5 rounded-full bg-fd-secondary px-2.5 py-1 text-xs cursor-pointer hover:bg-fd-muted transition-colors" onClick={() => add(l.code)}>
                                    {l.flag && <img src={l.flag} alt="" className="h-3.5 w-auto rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                    <span>{l.name}</span>
                                    <Icon icon="material-symbols:add-rounded" className="size-3" />
                                </span>
                            ))}
                        </div>
                    ) : q ? (
                        <p className="text-sm text-muted-foreground py-2">{t('settings.profile.language.no_match')}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground py-2">{t('settings.profile.language.all_added')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
