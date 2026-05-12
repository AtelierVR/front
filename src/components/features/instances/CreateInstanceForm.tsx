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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CreateInstanceForm() {
    const { t } = useTranslation();
    const router = useRouter();
    const { wellKnown } = useApi();

    const homeAddress = wellKnown?.address ?? null;

    // Servers
    const [servers, setServers] = useState<ApiServer[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

    // World search
    const [worldQuery, setWorldQuery] = useState('');
    const [worldResults, setWorldResults] = useState<ApiWorld[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<ApiWorld | null>(null);
    const [worldSearchOpen, setWorldSearchOpen] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [capacity, setCapacity] = useState(16);
    const [tags, setTags] = useState('');

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Init selected server to home
    useEffect(() => {
        if (homeAddress && selectedAddress === null) setSelectedAddress(homeAddress);
    }, [homeAddress, selectedAddress]);

    // Fetch known external servers
    useEffect(() => {
        listServers().then(setServers).catch(() => {});
    }, []);

    // Debounced world search
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    const isLocal = selectedAddress === homeAddress;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedWorld || !isLocal) return;
        setSubmitting(true);
        setError(null);
        try {
            const created = await createInstance({
                world: `w:${selectedWorld.id}@${selectedWorld.server}`,
                capacity,
                title: title.trim() || undefined,
                description: description.trim() || undefined,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            });
            router.push(`/i/${created.id}`);
        } catch (err: unknown) {
            setError((err as Error)?.message ?? t('error.title'));
            setSubmitting(false);
        }
    }

    // Build full server list: home first, then external
    const allServers: { address: string; isHome: boolean }[] = homeAddress
        ? [
              { address: homeAddress, isHome: true },
              ...servers
                  .filter((s) => s.address !== homeAddress)
                  .map((s) => ({ address: s.address, isHome: false })),
          ]
        : servers.map((s) => ({ address: s.address, isHome: false }));

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold font-heading">{t('instance.create_title')}</h1>

            {/* ── Server selector ────────────────────────────────────── */}
            <div className="space-y-3">
                <Label>{t('instance.select_server')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allServers.map(({ address, isHome }) => (
                        <button
                            key={address}
                            type="button"
                            onClick={() => isHome && setSelectedAddress(address)}
                            className={cn(
                                'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-start text-sm transition-colors',
                                selectedAddress === address
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/40',
                                !isHome && 'cursor-not-allowed opacity-50',
                            )}
                        >
                            <span className="flex items-center gap-1.5 font-medium">
                                <Icon icon="material-symbols:dns" className="size-3.5 shrink-0 text-muted-foreground" />
                                {address}
                            </span>
                            {isHome ? (
                                <Badge variant="secondary" className="text-xs">
                                    {t('instance.home_badge')}
                                </Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">
                                    {t('instance.remote_disabled')}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── World selector ─────────────────────────────────────── */}
            <div className="space-y-2 relative">
                <Label htmlFor="world-search">{t('instance.select_world')}</Label>

                {selectedWorld ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                        <Icon icon="material-symbols:language" className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">{selectedWorld.title}</span>
                        <span className="text-xs text-muted-foreground">{selectedWorld.server}</span>
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => { setSelectedWorld(null); setWorldQuery(''); }}
                        >
                            <Icon icon="material-symbols:close-rounded" className="size-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Icon icon="material-symbols:search-rounded" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                            id="world-search"
                            className="pl-9"
                            placeholder={t('instance.search_worlds')}
                            value={worldQuery}
                            onChange={(e) => { setWorldQuery(e.target.value); setWorldSearchOpen(true); }}
                            onFocus={() => setWorldSearchOpen(true)}
                            onBlur={() => setTimeout(() => setWorldSearchOpen(false), 150)}
                            autoComplete="off"
                        />
                        {worldSearchOpen && worldResults.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                {worldResults.map((w) => (
                                    <button
                                        key={`${w.id}@${w.server}`}
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                                        onMouseDown={() => {
                                            setSelectedWorld(w);
                                            setWorldQuery('');
                                            setWorldSearchOpen(false);
                                        }}
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

            {/* ── Title ─────────────────────────────────────────────── */}
            <div className="space-y-2">
                <Label htmlFor="instance-title">{t('instance.field_title')}</Label>
                <Input
                    id="instance-title"
                    placeholder={t('instance.field_title_placeholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* ── Description ───────────────────────────────────────── */}
            <div className="space-y-2">
                <Label htmlFor="instance-description">{t('instance.field_description')}</Label>
                <Textarea
                    id="instance-description"
                    rows={3}
                    placeholder={t('instance.field_description_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {/* ── Capacity ──────────────────────────────────────────── */}
            <div className="space-y-2">
                <Label htmlFor="instance-capacity">{t('instance.field_capacity')}</Label>
                <Input
                    id="instance-capacity"
                    type="number"
                    min={1}
                    max={65535}
                    value={capacity}
                    onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 16))}
                />
            </div>

            {/* ── Tags ──────────────────────────────────────────────── */}
            <div className="space-y-2">
                <Label htmlFor="instance-tags">{t('instance.field_tags')}</Label>
                <Input
                    id="instance-tags"
                    placeholder={t('instance.field_tags_placeholder')}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
                type="submit"
                disabled={submitting || !selectedWorld || !isLocal}
                className="w-full"
            >
                <Icon icon="material-symbols:add-rounded" className="size-4 me-2" />
                {submitting ? t('instance.creating') : t('instance.submit')}
            </Button>
        </form>
    );
}
