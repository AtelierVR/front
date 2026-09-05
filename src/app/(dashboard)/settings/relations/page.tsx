'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { useApi } from '@/lib/api/context';
import { getFollowers, getFollowing, getFriends, getUser, respondToRequest } from '@/lib/api/users';
import type { ApiUser } from '@/types/api';
import { getAlias } from '@/lib/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import {
    ResultList,
    SkeletonList,
    EmptyBox,
    PageNav,
} from '@/components/shared/ResultGrid';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
import { notify } from '@/components/ui/notify';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'followers' | 'following' | 'friends' | 'pending';

interface TabDef {
    key: TabKey;
    title: string;
    icon: string;
    description: string;
}

// ── User Row (list mode, matches /search style) ──────────────────────────────

function UserRow({ user: u, localAddress }: { user: ApiUser; localAddress: string }) {
    const displayName = u.display || u.username || '?';
    const identifier = getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid') || '';
    const initial = displayName.charAt(0).toUpperCase();
    const rawId = getAlias(u.alias, 'uid') ?? getAlias(u.alias, 'iid') ?? `${u.id}@${u.server}`;
    const href = `/u/${noxIdToSegment(rawId, localAddress)}`;

    return (
        <Link
            href={href}
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4',
            )}
        >
            <AvatarWithPresence
                presence={u.presence.status}
                size="lg"
                src={u.thumbnail}
                alt={displayName}
                fallback={<span className="text-lg font-semibold">{initial}</span>}
                avatarClassName="h-12 w-12"
            />
            <div className="min-w-0">
                <p className="font-bold text-lg">{displayName}</p>
                {identifier && (
                    <p className="text-sm text-muted-foreground">{identifier}</p>
                )}
            </div>
        </Link>
    );
}

// ── Pending Row (list mode with accept/reject actions) ────────────────────────

function PendingRow({ user: u, onAccept, onReject }: {
    user: ApiUser;
    onAccept: () => void;
    onReject: () => void;
}) {
    const displayName = u.display || u.username || '?';
    const identifier = getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid') || '';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4 cursor-default hover:bg-background',
            )}
        >
            <AvatarWithPresence
                presence={u.presence.status}
                size="lg"
                src={u.thumbnail}
                alt={displayName}
                fallback={<span className="text-lg font-semibold">{initial}</span>}
                avatarClassName="h-12 w-12"
            />
            <div className="min-w-0 flex-1">
                <p className="font-bold text-lg">{displayName}</p>
                {identifier && (
                    <p className="text-sm text-muted-foreground">{identifier}</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={onAccept}>
                    <Icon icon="material-symbols:check-rounded" className="size-4 mr-1" />
                    Accept
                </Button>
                <Button variant="outline" size="sm" onClick={onReject}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Icon icon="material-symbols:close-rounded" className="size-4 mr-1" />
                    Reject
                </Button>
            </div>
        </div>
    );
}

// ── Tab Content ───────────────────────────────────────────────────────────────

function RelationTab({ tab, query }: { tab: TabKey; query: string }) {
    const { t } = useTranslation();
    const { currentUser, wellKnown } = useApi();
    const localAddress = wellKnown?.address ?? '::';

    const [items, setItems] = useState<ApiUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 20;

    const load = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const offset = (page - 1) * limit;

            if (tab === 'followers') {
                const res = await getFollowers(currentUser.id, limit, offset);
                const refs = res.items.map(r => r.initiator);
                const settled = await Promise.allSettled(refs.map(ref => getUser(ref)));
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
                setTotal(res.total);
            } else if (tab === 'following') {
                const res = await getFollowing(currentUser.id, limit, offset);
                const refs = res.items.map(r => r.target);
                const settled = await Promise.allSettled(refs.map(ref => getUser(ref)));
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
                setTotal(res.total);
            } else if (tab === 'friends') {
                const res = await getFriends(currentUser.id, limit, offset);
                const refs = res.items.map(r => r.out.target);
                const settled = await Promise.allSettled(refs.map(ref => getUser(ref)));
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
                setTotal(res.total);
            } else if (tab === 'pending') {
                // Pending: followers with type=REQUEST
                const res = await getFollowers(currentUser.id, 100, 0);
                const pendingRefs = res.items
                    .filter(r => r.type === 'request')
                    .map(r => r.initiator);
                setTotal(pendingRefs.length);
                const settled = await Promise.allSettled(
                    pendingRefs.slice(offset, offset + limit).map(ref => getUser(ref))
                );
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
            }
        } catch {
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [currentUser, tab, page]);

    useEffect(() => { load(); }, [load]);

    const handleAccept = async (initiatorRef: string) => {
        try {
            await respondToRequest(initiatorRef, true);
            notify(t('relations.request_accepted'), { type: 'success' });
            load();
        } catch (e: any) {
            notify(e?.message ?? t('common.error'), { type: 'danger' });
        }
    };

    const handleReject = async (initiatorRef: string) => {
        try {
            await respondToRequest(initiatorRef, false);
            notify(t('relations.request_rejected'), { type: 'success' });
            load();
        } catch (e: any) {
            notify(e?.message ?? t('common.error'), { type: 'danger' });
        }
    };

    if (loading) return <SkeletonList count={5} />;
    if (items.length === 0) return <EmptyBox>{t(`relations.empty_${tab}`)}</EmptyBox>;

    const filtered = query
        ? items.filter(u =>
            (u.display || u.username || '').toLowerCase().includes(query.toLowerCase())
        )
        : items;

    if (filtered.length === 0) return <EmptyBox>{t('common.no_results')}</EmptyBox>;

    return (
        <div className="space-y-4">
            <ResultList>
                {filtered.map((u) => {
                    if (tab === 'pending') {
                        const ref = getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid') || '';
                        return (
                            <PendingRow
                                key={u.id}
                                user={u}
                                onAccept={() => handleAccept(ref)}
                                onReject={() => handleReject(ref)}
                            />
                        );
                    }
                    return (
                        <UserRow
                            key={u.id}
                            user={u}
                            localAddress={localAddress}
                        />
                    );
                })}
            </ResultList>
            <PageNav page={page} total={total} limit={limit} onPage={setPage} />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
    { key: 'followers', title: 'relations.tab_followers', icon: 'material-symbols:group-remove-rounded', description: 'relations.desc_followers' },
    { key: 'following', title: 'relations.tab_following', icon: 'material-symbols:group-add-rounded', description: 'relations.desc_following' },
    { key: 'friends', title: 'relations.tab_friends', icon: 'material-symbols:diversity-3-rounded', description: 'relations.desc_friends' },
    { key: 'pending', title: 'relations.tab_pending', icon: 'material-symbols:pending-actions-rounded', description: 'relations.desc_pending' },
];

export default function RelationsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabKey) || 'followers';
    const [query, setQuery] = useState('');
    const activeDef = TABS.find(d => d.key === activeTab)!;

    return (
        <Suspense fallback={<div className="p-4 md:p-6"><SkeletonList count={5} /></div>}>
            <PageTitle title={t('relations.title')} />
            <SiteHeader
                children={t('relations.title')}
                subtitle={t(activeDef.description)}
                after={
                    <div className="relative">
                        <Icon
                            icon="material-symbols:search-rounded"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                        />
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={t('relations.search_placeholder')}
                            className="pl-8 h-8 w-44 text-sm"
                        />
                    </div>
                }
            />

            <div className="p-4 md:p-6">
                <Tabs value={activeTab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`)}>
                    <TabsList className="w-full justify-start">
                        {TABS.map(tab => (
                            <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
                                <Icon icon={tab.icon} className="size-4" />
                                {t(tab.title)}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Only mount the active tab to avoid N parallel API calls on page load */}
                    <TabsContent value={activeTab} className="mt-4">
                        <RelationTab tab={activeTab} query={query} />
                    </TabsContent>
                </Tabs>
            </div>
        </Suspense>
    );
}
