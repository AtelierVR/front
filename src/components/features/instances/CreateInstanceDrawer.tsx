'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

import { useApi } from '@/lib/api/context';
import { createInstance } from '@/lib/api/instances';
import { searchWorlds } from '@/lib/api/worlds';
import { listServers } from '@/lib/api/servers';
import type { ApiServer, ApiWorld } from '@/types/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TextInput } from '@/components/ui/text-input';
import { MarkdownAreaInput } from '@/components/ui/markdown-area-input';
import { TagListInput } from '@/components/ui/tag-list-input';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { uploadInstanceThumbnail } from '@/lib/api/instances';
import { ImageInput } from '@/components/ui/image-input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ModalDrawer } from '@/components/shared/ModalDrawer';

interface CreateInstanceDrawerProps {
    defaultWorld?: ApiWorld;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

export function CreateInstanceDrawer({
    defaultWorld,
    open,
    onOpenChange,
    onCreated,
}: CreateInstanceDrawerProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { wellKnown, config } = useApi();

    const homeAddress = wellKnown?.address ?? null;

    // Server selection
    const [servers, setServers] = useState<ApiServer[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null | undefined>(undefined);
    const [serverQuery, setServerQuery] = useState('');
    const [serverSearchOpen, setServerSearchOpen] = useState(false);

    // World search / selection
    const [worldQuery, setWorldQuery] = useState('');
    const [worldResults, setWorldResults] = useState<ApiWorld[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<ApiWorld | null>(defaultWorld ?? null);
    const [worldSearchOpen, setWorldSearchOpen] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form fields — pre-filled from selected world
    const [name, setName] = useState('');
    const [title, setTitle] = useState(defaultWorld?.title ?? '');
    const [description, setDescription] = useState(defaultWorld?.description ?? '');
    const [capacity, setCapacity] = useState(defaultWorld?.capacity ?? 0);
    const [tags, setTags] = useState<string[]>([]);
    const [thumbnail, setThumbnail] = useState<string | null>(defaultWorld?.thumbnail ?? null);
    const [region, setRegion] = useState<string>(config?.default_region ?? '');

    // Sync region when config loads
    useEffect(() => {
        if (config?.default_region !== undefined && config.default_region !== null && !region) 
            setRegion(config.default_region);
    }, [config, region]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

    // Init home server — only when not yet initialized (undefined), not when user cleared it (null)
    useEffect(() => {
        if (homeAddress && selectedAddress === undefined) setSelectedAddress(homeAddress);
    }, [homeAddress, selectedAddress]);

    // Fetch known servers
    useEffect(() => {
        listServers().then(setServers).catch(() => {});
    }, []);

    // Debounced world search
    useEffect(() => {
        if (!worldQuery.trim()) { setWorldResults([]); return; }
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            try {
                const result = await searchWorlds(worldQuery, 10, 0);
                setWorldResults(result.items);
            } catch { setWorldResults([]); }
        }, 300);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [worldQuery]);

    // Pre-fill form when world changes
    useEffect(() => {
        if (!selectedWorld) return;
        setTitle(selectedWorld.title ?? '');
        setDescription(selectedWorld.description ?? '');
        setCapacity(selectedWorld.capacity);
        setTags([]);
        setThumbnail(selectedWorld.thumbnail ?? null);
    }, [selectedWorld]);

    const isLocal = !!selectedAddress && selectedAddress === homeAddress;

    function selectWorld(w: ApiWorld) {
        setSelectedWorld(w);
        setWorldQuery('');
        setWorldSearchOpen(false);
    }

    function reset() {
        setSelectedWorld(defaultWorld ?? null);
        setWorldQuery('');
        setWorldResults([]);
        setSelectedAddress(undefined);
        setServerQuery('');
        setName('');
        setTitle(defaultWorld?.title ?? '');
        setDescription(defaultWorld?.description ?? '');
        setCapacity(defaultWorld?.capacity ?? 0);
        setTags([]);
        setThumbnail(defaultWorld?.thumbnail ?? null);
        setError(null);
        setMode('simple');
        setRegion(config?.default_region ?? '');
    }

    function handleOpenChange(o: boolean) {
        if (!submitting) {
            onOpenChange(o);
            if (!o) reset();
        }
    }

    const NAME_REGEX = /^[a-z0-9\-_.]{3,8}$/;
    const nameInvalid = name.trim().length > 0 && !NAME_REGEX.test(name.trim());

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedWorld || !isLocal) return;
        if (nameInvalid) return;
        setSubmitting(true);
        setError(null);
        try {
            const created = await createInstance({
                world: `w:${selectedWorld.id}@${selectedWorld.server}`,
                capacity,
                name: name.trim() || undefined,
                title: title.trim() || undefined,
                description: description.trim() || undefined,
                tags,
                region: region || undefined,
            });
            if (thumbnail?.startsWith('data:')) {
                const blob = await fetch(thumbnail).then(r => r.blob());
                await uploadInstanceThumbnail(created.id, blob);
            }
            reset();
            onOpenChange(false);
            if (onCreated) onCreated();
            router.push(`/i/${created.id}`);
        } catch (err: unknown) {
            setError((err as Error)?.message ?? t('error.title', 'An error occurred'));
            setSubmitting(false);
        }
    }

    const allServers: { address: string; isHome: boolean }[] = homeAddress
        ? [
            { address: homeAddress, isHome: true },
            ...servers.filter((s) => s.address !== homeAddress).map((s) => ({ address: s.address, isHome: false })),
          ]
        : servers.map((s) => ({ address: s.address, isHome: false }));

    const filteredServers = serverQuery.trim()
        ? allServers.filter(({ address }) => address.toLowerCase().includes(serverQuery.toLowerCase()))
        : allServers;

    const selectedServerMeta = allServers.find((s) => s.address === selectedAddress);

    const formContent = (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-2">
            {mode === 'simple' ? (
                /* ── Simple mode: World, Title, Description ──── */
                <div className="flex flex-col gap-5">
                    {/* World */}
                    <div className="relative space-y-2">
                        <Label htmlFor="ci-world">{t('instance.select_world')}</Label>
                        {selectedWorld ? (
                            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                                <Icon icon="material-symbols:language" className="size-4 shrink-0 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium">{selectedWorld.title}</span>
                                <span className="text-xs text-muted-foreground">{selectedWorld.server}</span>
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => { setSelectedWorld(null); setWorldQuery(''); }}
                                    disabled={submitting}
                                >
                                    <Icon icon="material-symbols:close-rounded" className="size-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Icon icon="material-symbols:search-rounded" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="ci-world"
                                    className="pl-9"
                                    placeholder={t('instance.search_worlds')}
                                    value={worldQuery}
                                    onChange={(e) => { setWorldQuery(e.target.value); setWorldSearchOpen(true); }}
                                    onFocus={() => setWorldSearchOpen(true)}
                                    onBlur={() => setTimeout(() => setWorldSearchOpen(false), 150)}
                                    autoComplete="off"
                                    disabled={submitting}
                                />
                                {worldSearchOpen && worldResults.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                        {worldResults.map((w) => (
                                            <button
                                                key={`${w.id}@${w.server}`}
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                                                onMouseDown={() => selectWorld(w)}
                                            >
                                                <Icon icon="material-symbols:language" className="size-4 shrink-0 text-muted-foreground" />
                                                <span className="flex-1 text-start font-medium">{w.title}</span>
                                                <span className="text-xs text-muted-foreground shrink-0">{w.server}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <section className="space-y-2">
                        <Label>{t('instance.field_title')}</Label>
                        <TextInput
                            value={title}
                            onChange={setTitle}
                            placeholder={t('instance.field_title_placeholder')}
                            maxLength={128}
                            disabled={submitting}
                        />
                    </section>

                    {/* Description */}
                    <section className="space-y-2">
                        <Label>{t('instance.field_description')}</Label>
                        <MarkdownAreaInput
                            value={description}
                            onChange={setDescription}
                            placeholder={t('instance.field_description_placeholder')}
                        />
                    </section>
                </div>
            ) : (
                /* ── Advanced mode: full two columns ─────────── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    {/* ── Left column ──────────────────────────────── */}
                    <div className="flex flex-col gap-5">
                        {/* Server */}
                        <div className="space-y-2">
                            <Label htmlFor="ci-server">{t('instance.select_server')}</Label>
                            {selectedAddress ? (
                                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                                    <Icon icon="material-symbols:dns" className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="flex-1 text-sm font-medium">{selectedAddress}</span>
                                    {selectedServerMeta?.isHome && (
                                        <Badge variant="secondary" className="text-xs">{t('instance.home_badge')}</Badge>
                                    )}
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => { setSelectedAddress(null); setServerQuery(''); }}
                                        disabled={submitting}
                                    >
                                        <Icon icon="material-symbols:close-rounded" className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Icon icon="material-symbols:search-rounded" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="ci-server"
                                        className="pl-9"
                                        placeholder={t('instance.search_servers', 'Search servers…')}
                                        value={serverQuery}
                                        onChange={(e) => { setServerQuery(e.target.value); setServerSearchOpen(true); }}
                                        onFocus={() => setServerSearchOpen(true)}
                                        onBlur={() => setTimeout(() => setServerSearchOpen(false), 150)}
                                        autoComplete="off"
                                        disabled={submitting}
                                    />
                                    {serverSearchOpen && filteredServers.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                            {filteredServers.map(({ address, isHome }) => (
                                                <button
                                                    key={address}
                                                    type="button"
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    onMouseDown={() => { setSelectedAddress(address); setServerQuery(''); setServerSearchOpen(false); }}
                                                >
                                                    <Icon icon="material-symbols:dns" className="size-4 shrink-0 text-muted-foreground" />
                                                    <span className="flex-1 text-start font-medium">{address}</span>
                                                    {isHome && (
                                                        <Badge variant="secondary" className="text-xs shrink-0">{t('instance.home_badge')}</Badge>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">{t('instance.remote_disabled')}</p>
                        </div>

                        {/* World */}
                        <div className="relative space-y-2">
                            <Label htmlFor="ci-world">{t('instance.select_world')}</Label>
                            {selectedWorld ? (
                                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                                    <Icon icon="material-symbols:language" className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="flex-1 text-sm font-medium">{selectedWorld.title}</span>
                                    <span className="text-xs text-muted-foreground">{selectedWorld.server}</span>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => { setSelectedWorld(null); setWorldQuery(''); }}
                                        disabled={submitting}
                                    >
                                        <Icon icon="material-symbols:close-rounded" className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Icon icon="material-symbols:search-rounded" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="ci-world"
                                        className="pl-9"
                                        placeholder={t('instance.search_worlds')}
                                        value={worldQuery}
                                        onChange={(e) => { setWorldQuery(e.target.value); setWorldSearchOpen(true); }}
                                        onFocus={() => setWorldSearchOpen(true)}
                                        onBlur={() => setTimeout(() => setWorldSearchOpen(false), 150)}
                                        autoComplete="off"
                                        disabled={submitting}
                                    />
                                    {worldSearchOpen && worldResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                            {worldResults.map((w) => (
                                                <button
                                                    key={`${w.id}@${w.server}`}
                                                    type="button"
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    onMouseDown={() => selectWorld(w)}
                                                >
                                                    <Icon icon="material-symbols:language" className="size-4 shrink-0 text-muted-foreground" />
                                                    <span className="flex-1 text-start font-medium">{w.title}</span>
                                                    <span className="text-xs text-muted-foreground shrink-0">{w.server}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <section className="space-y-2">
                            <Label>{t('instance.field_title')}</Label>
                            <TextInput
                                value={title}
                                onChange={setTitle}
                                placeholder={t('instance.field_title_placeholder')}
                                maxLength={128}
                                disabled={submitting}
                            />
                        </section>

                        {/* Description */}
                        <section className="space-y-2">
                            <Label>{t('instance.field_description')}</Label>
                            <MarkdownAreaInput
                                value={description}
                                onChange={setDescription}
                                placeholder={t('instance.field_description_placeholder')}
                            />
                        </section>
                    </div>

                    {/* ── Right column ─────────────────────────────── */}
                    <div className="flex flex-col gap-5">
                        {/* Region */}
                        {config?.regions && config.regions.length > 0 && (
                            <section className="space-y-2">
                                <Label>{t('instance.field_region')}</Label>
                                <Select value={region} onValueChange={(v) => setRegion(v ?? '')} disabled={submitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('instance.field_region_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {config.regions.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </section>
                        )}

                        {/* Capacity */}
                        <section className="space-y-2">
                            <Label>{t('instance.field_capacity')}</Label>
                            <InputGroup>
                                <InputGroupInput
                                    type="number"
                                    min={0}
                                    max={65535}
                                    value={capacity}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setCapacity(isNaN(v) ? 0 : Math.max(0, Math.min(65535, v)));
                                    }}
                                    disabled={submitting}
                                />
                            </InputGroup>
                            <p className="text-xs text-muted-foreground">{t('instance.field_capacity_desc')}</p>
                        </section>

                        {/* Thumbnail */}
                        <section className="space-y-2">
                            <Label>{t('instance.field_thumbnail')}</Label>
                            <ImageInput
                                value={thumbnail}
                                onChange={setThumbnail}
                                aspectRatio="16/9"
                                className="w-full"
                                alt={title || t('instance.field_thumbnail')}
                            />
                        </section>

                        {/* Tags */}
                        <section className="space-y-2">
                            <Label>{t('instance.field_tags')}</Label>
                            <TagListInput
                                tags={tags}
                                onChange={setTags}
                            />
                        </section>

                        {/* Name */}
                        <section className="space-y-2">
                            <Label>{t('instance.field_name')}</Label>
                            <TextInput
                                value={name}
                                onChange={setName}
                                placeholder={t('instance.field_name_placeholder')}
                                maxLength={8}
                                disabled={submitting}
                            />
                            <p className="text-xs text-muted-foreground">{t('instance.field_name_desc')}</p>
                            {nameInvalid && (
                                <p className="text-xs text-destructive">{t('instance.field_name_invalid')}</p>
                            )}
                        </section>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <Icon icon="material-symbols:error-rounded" className="size-4 shrink-0" />
                    {error}
                </div>
            )}
        </form>
    );

    const modeToggle = (
        <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as 'simple' | 'advanced')}
        >
            <TabsList>
                <TabsTrigger value="simple">{t('instance.mode_simple')}</TabsTrigger>
                <TabsTrigger value="advanced">{t('instance.mode_advanced')}</TabsTrigger>
            </TabsList>
        </Tabs>
    );

    const submitButton = (
        <Button
            type="submit"
            disabled={submitting || !selectedWorld || !isLocal || nameInvalid}
            className="w-full"
            onClick={handleSubmit}
        >
            {submitting
                ? <><Icon icon="material-symbols:progress-activity" className="size-4 mr-2 animate-spin" />{t('instance.creating')}</>
                : <><Icon icon="material-symbols:add-rounded" className="size-4 mr-2" />{t('instance.submit')}</>
            }
        </Button>
    );

    return (
        <ModalDrawer
            open={open}
            onOpenChange={handleOpenChange}
            header={t('instance.create_title')}
            headerEnd={modeToggle}
            footer={submitButton}
        >
            {formContent}
        </ModalDrawer>
    );
}

