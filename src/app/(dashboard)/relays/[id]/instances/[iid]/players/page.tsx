'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getRelayInstancePlayers } from '@/lib/api/relays';
import type { ApiRelayPlayer } from '@/types/api';
import { ApiError } from '@/types/envelope';
import { useWsEvent } from '@/lib/ws/context';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagination } from '@/hooks/usePagination';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';

export default function RelayInstancePlayersPage() {
    const params = useParams<{ id: string; iid: string }>();
    const relayId = parseInt(params.id, 10);
    const iid = parseInt(params.iid, 10);
    const { t } = useTranslation();
    const { page, limit, setPage } = usePagination();

    const [allPlayers, setAllPlayers] = useState<ApiRelayPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [relayOffline, setRelayOffline] = useState(false);
    const loadedRef = useRef(false);

    const fetchPlayers = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        setRelayOffline(false);
        try {
            const res = await getRelayInstancePlayers(relayId, iid);
            const sorted = (res.items ?? []).slice().sort((a, b) => b.joined_at - a.joined_at);
            setAllPlayers(sorted);
        } catch (e) {
            if (e instanceof ApiError && e.status === 503) {
                setRelayOffline(true);
            } else {
                setError(e instanceof Error ? e.message : 'Failed to load players');
            }
        } finally {
            setLoading(false);
        }
    }, [relayId, iid]);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        fetchPlayers();
    }, [fetchPlayers]);

    const pagePlayers = useMemo(() => {
        const start = (page - 1) * limit;
        return allPlayers.slice(start, start + limit);
    }, [allPlayers, page, limit]);
    const pageCount = Math.max(1, Math.ceil(allPlayers.length / limit));

    useWsEvent('relay_player_join', (payload: unknown) => {
        const data = payload as { relay_id: number; player: { player_id: number; client_id: number; display: string; internal_id: number; flags: number; joined_at: number } };
        if (data.relay_id !== relayId || data.player.internal_id !== iid) return;
        const p = data.player;
        setAllPlayers(prev => [
            { id: p.player_id, client_id: p.client_id, display: p.display, flags: p.flags, joined_at: p.joined_at },
            ...prev.filter(x => x.id !== p.player_id),
        ]);
    });

    useWsEvent('relay_player_leave', (payload: unknown) => {
        const data = payload as { relay_id: number; player: { player_id: number; internal_id: number } };
        if (data.relay_id !== relayId || data.player.internal_id !== iid) return;
        setAllPlayers(prev => prev.filter(x => x.id !== data.player.player_id));
    });

    return (
        <div className="flex flex-col gap-4">
            {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {relayOffline && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Icon icon="material-symbols:wifi-off-rounded" className="size-8 opacity-40" />
                        <p className="text-sm">{t('admin.relay_unavailable')}</p>
                    </div>
                </div>
            )}

            {!relayOffline && (
                <>
            <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="w-14 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_player_id')}</th>
                                <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_display')}</th>
                                <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_flags')}</th>
                                <th className="w-20 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_client_id')}</th>
                                <th className="w-36 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_joined_at')}</th>
                                <th className="w-10 px-2 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                Array.from({ length: limit }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-2 py-3" />
                                    </tr>
                                ))
                            ) : pagePlayers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                        {t('admin.no_instance_players')}
                                    </td>
                                </tr>
                            ) : (
                                pagePlayers.map(player => (
                                    <tr key={player.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{player.id}</td>
                                        <td className="px-4 py-3 text-sm">{player.display || '—'}</td>
                                        <td className="px-4 py-3"><PlayerFlagsBadges flags={player.flags} /></td>
                                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{player.client_id}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap" title={player.joined_at ? format(new Date(player.joined_at), 'PPPP p') : undefined}>
                                            {player.joined_at ? formatDistanceToNow(new Date(player.joined_at), { addSuffix: true }) : '—'}
                                        </td>
                                        <td className="px-2 py-3">
                                            <PlayerActions playerId={player.id} clientId={player.client_id} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    {loading
                        ? <Skeleton className="h-4 w-24 inline-block" />
                        : `${allPlayers.length} player${allPlayers.length !== 1 ? 's' : ''}`}
                </span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="size-8"
                        onClick={() => setPage(1)} disabled={page <= 1}>
                        <Icon icon="material-symbols:keyboard-double-arrow-left-rounded" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8"
                        onClick={() => setPage(page - 1)} disabled={page <= 1}>
                        <Icon icon="material-symbols:chevron-left-rounded" />
                    </Button>
                    <span className="min-w-[80px] text-center font-medium">
                        {loading ? '…' : `${page} / ${pageCount}`}
                    </span>
                    <Button variant="outline" size="icon" className="size-8"
                        onClick={() => setPage(page + 1)} disabled={page >= pageCount}>
                        <Icon icon="material-symbols:chevron-right-rounded" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8"
                        onClick={() => setPage(pageCount)} disabled={page >= pageCount}>
                        <Icon icon="material-symbols:keyboard-double-arrow-right-rounded" />
                    </Button>
                </div>
            </div>
                </>
            )}
        </div>
    );
}

function PlayerActions({ playerId, clientId }: { playerId: number; clientId: number }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="inline-flex items-center justify-center rounded-md size-7 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
                <Icon icon="material-symbols:more-vert" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                    className="text-xs"
                    onClick={() => navigator.clipboard.writeText(String(playerId))}
                >
                    <Icon icon="material-symbols:content-copy-outline-rounded" className="size-3.5" />
                    Copy Player ID
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="text-xs"
                    onClick={() => navigator.clipboard.writeText(String(clientId))}
                >
                    <Icon icon="material-symbols:content-copy-outline-rounded" className="size-3.5" />
                    Copy Client ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" disabled>
                    <Icon icon="material-symbols:person-remove-outline-rounded" className="size-3.5" />
                    Kick
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const PLAYER_FLAGS: { bit: number; label: string; icon: string; variant: 'secondary' | 'outline' | 'destructive' }[] = [
    { bit: 1 << 0, label: 'Bot',             icon: 'material-symbols:smart-toy-outline-rounded',       variant: 'outline' },
    { bit: 1 << 1, label: 'Master',          icon: 'material-symbols:star-rounded',                    variant: 'secondary' },
    { bit: 1 << 2, label: 'Moderator',       icon: 'material-symbols:shield-outline-rounded',          variant: 'secondary' },
    { bit: 1 << 3, label: 'Owner',           icon: 'material-symbols:manage-accounts-outline-rounded', variant: 'secondary' },
    { bit: 1 << 4, label: 'Guild Mod',       icon: 'material-symbols:group-outline-rounded',           variant: 'outline' },
    { bit: 1 << 5, label: 'Master Mod',      icon: 'material-symbols:admin-panel-settings-outline-rounded', variant: 'outline' },
    { bit: 1 << 6, label: 'World Owner',     icon: 'material-symbols:public-rounded',                  variant: 'outline' },
    { bit: 1 << 7, label: 'World Mod',       icon: 'material-symbols:travel-explore-rounded',          variant: 'outline' },
    { bit: 1 << 8, label: 'Unverified',      icon: 'material-symbols:warning-outline-rounded',         variant: 'destructive' },
    { bit: 1 << 9, label: 'Hidden',          icon: 'material-symbols:visibility-off-outline-rounded',  variant: 'outline' },
];

function PlayerFlagsBadges({ flags }: { flags: number }) {
    const active = PLAYER_FLAGS.filter(f => (flags & f.bit) !== 0);
    if (active.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {active.map(f => (
                <Badge key={f.bit} variant={f.variant} className="gap-1 text-xs px-1.5 py-0.5">
                    <Icon icon={f.icon} className="size-3" />
                    {f.label}
                </Badge>
            ))}
        </div>
    );
}
