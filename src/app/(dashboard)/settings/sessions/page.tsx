'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { EmptyBox } from '@/components/shared/ResultGrid';
import { useApi } from '@/lib/api';
import { notify } from '@/components/ui/notify';
import { useCountries } from '@/hooks/useCountries';
import {
    listMySessions,
    fetchCurrentSession,
    deleteMySession,
    deleteAllMySessions,
} from '@/lib/api/sessions';
import type { IRSession, IRDevice } from '@/lib/api/sessions';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';

// ── User-Agent Parsing ───────────────────────────────────────────────────────

interface ParsedDevice extends IRDevice {
    browserName: string;
    browserVersion: string;
    osName: string;
    engineName: string;
}

/** Lightweight UA parser — avoids pulling in ua-parser-js */
function parseDevice(device: IRDevice): ParsedDevice {
    const ua = device.user_agent;
    let browserName = '';
    let browserVersion = '';
    let osName = '';
    let engineName = '';

    // Check for custom Nox client format: Nox/0.0.9 (en=unity; pn=windows)
    const noxRegex = /Nox\/([\d.]+)\s\((.+)\)/;
    const noxMatch = ua.match(noxRegex);
    if (noxMatch) {
        browserName = 'Nox';
        browserVersion = noxMatch[1];
        const dict = noxMatch[2].split(';').reduce((acc: Record<string, string>, item) => {
            const [k, v] = item.split('=');
            acc[k.trim()] = v.trim();
            return acc;
        }, {});
        osName = dict['pn'] || '';
        engineName = dict['en'] || '';
    } else {
        // Basic browser/OS detection
        if (ua.includes('Firefox/')) {
            browserName = 'Firefox';
            browserVersion = (ua.match(/Firefox\/([\d.]+)/) ?? [])[1] ?? '';
        } else if (ua.includes('Edg/')) {
            browserName = 'Edge';
            browserVersion = (ua.match(/Edg\/([\d.]+)/) ?? [])[1] ?? '';
        } else if (ua.includes('Chrome/')) {
            browserName = 'Chrome';
            browserVersion = (ua.match(/Chrome\/([\d.]+)/) ?? [])[1] ?? '';
        } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
            browserName = 'Safari';
            browserVersion = (ua.match(/Version\/([\d.]+)/) ?? [])[1] ?? '';
        }

        if (ua.includes('Windows')) osName = 'Windows';
        else if (ua.includes('Mac OS')) osName = 'macOS';
        else if (ua.includes('Linux') && !ua.includes('Android')) osName = 'Linux';
        else if (ua.includes('Android')) osName = 'Android';
        else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';
    }

    return { ...device, browserName, browserVersion, osName, engineName };
}

function getDeviceIcon(device: ParsedDevice): string {
    if (device.browserName === 'Nox') return 'material-symbols:deployed-code';
    if (device.browserName && device.browserName !== 'Nox') return 'material-symbols:web-asset';
    const os = device.osName.toLowerCase();
    if (['windows', 'macos', 'linux'].includes(os)) return 'material-symbols:monitor-rounded';
    if (['android', 'ios'].includes(os)) return 'material-symbols:smartphone';
    return 'material-symbols:devices-rounded';
}

// ── IP Location ──────────────────────────────────────────────────────────────

interface IpLocation {
    country: string;
    country_name: string;
    city: string;
    region: string;
}

function countryCodeToFlag(code: string): string {
    if (!code) return '';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

// ── Session Card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
    session: IRSession;
    isCurrent: boolean;
    onDelete?: () => void;
    t: (key: string, opts?: Record<string, unknown>) => string;
    countries: Array<{ cca2: string; flags: { svg: string }; name: { common: string } }>;
}

function SessionCard({ session, isCurrent, onDelete, t, countries }: SessionCardProps) {
    const device = session.devices[0];
    const parsed = device ? parseDevice(device) : null;
    const iconName = parsed ? getDeviceIcon(parsed) : 'material-symbols:devices-rounded';
    const lastSeen = device ? device.last_seen : session.created_at;
    const [ipLocations, setIpLocations] = useState<Record<string, IpLocation | null>>({});
    const [loadingIps, setLoadingIps] = useState<Record<string, boolean>>({});

    const [accordionOpen, setAccordionOpen] = useState(false);

    const fetchIpLocation = useCallback(async (ip: string) => {
        if (ipLocations[ip] !== undefined || loadingIps[ip]) return;
        setLoadingIps(prev => ({ ...prev, [ip]: true }));
        try {
            const res = await fetch(`https://ipapi.co/${ip}/json/`);
            if (res.ok) {
                const data = await res.json();
                setIpLocations(prev => ({ ...prev, [ip]: data }));
            } else {
                setIpLocations(prev => ({ ...prev, [ip]: null }));
            }
        } catch {
            setIpLocations(prev => ({ ...prev, [ip]: null }));
        } finally {
            setLoadingIps(prev => ({ ...prev, [ip]: false }));
        }
    }, [ipLocations, loadingIps]);

    const handleOpenChange = useCallback((value: unknown) => {
        const isOpen = Array.isArray(value) ? value.includes('details') : value === 'details';
        setAccordionOpen(isOpen);
        if (isOpen && session.devices.length > 0) {
            session.devices.forEach(d => fetchIpLocation(d.ip));
        }
    }, [session.devices, fetchIpLocation]);

    return (
        <div className={cn(
            'rounded-lg border bg-card',
            'hover:border-primary/30 transition-colors',
        )}>
            <Accordion onValueChange={handleOpenChange}>
                <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50 transition-colors items-center">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'size-10 rounded-full flex items-center justify-center shrink-0',
                                isCurrent
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground',
                            )}>
                                <Icon icon={iconName} className="size-5" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                        {parsed ? (
                                            <>
                                                {parsed.browserName || t('settings.sessions.unknown_device')}
                                                {parsed.osName && (
                                                    <span className="text-muted-foreground"> • {parsed.osName}</span>
                                                )}
                                            </>
                                        ) : (
                                            t('settings.sessions.unknown_device')
                                        )}
                                    </span>
                                    {isCurrent && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                            {t('settings.sessions.current_badge')}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(lastSeen).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="space-y-4 text-sm">
                            {/* Session Info */}
                            <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">{t('settings.sessions.status')}</span>
                                    <span className={cn(
                                        'text-xs font-medium',
                                        session.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                                    )}>
                                        {session.active ? (
                                            <span className="flex items-center gap-1">
                                                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                                                {t('settings.sessions.status_active')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <span className="size-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                                                {t('settings.sessions.status_idle')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {session.public_key && (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">{t('settings.sessions.public_key')}</span>
                                        <span className="font-mono text-xs max-w-[60%] truncate text-right" title={session.public_key}>
                                            {session.public_key.slice(0, 16)}…
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">{t('settings.sessions.created')}</span>
                                    <span className="text-xs">{new Date(session.created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">{t('settings.sessions.expires')}</span>
                                    <span className="text-xs">{new Date(session.expires_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Devices */}
                            {session.devices.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {session.devices.length === 1
                                            ? t('settings.sessions.devices', { count: 1 })
                                            : t('settings.sessions.devices_plural', { count: session.devices.length })
                                        }
                                    </div>
                                    <div className="space-y-2">
                                        {session.devices.map((d, idx) => {
                                            const loc = ipLocations[d.ip];
                                            const country = loc?.country
                                                ? countries.find(c => c.cca2 === loc.country)
                                                : null;

                                            return (
                                                <div key={idx} className="rounded-md bg-muted/50 p-3 space-y-2">
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">{t('settings.sessions.ip')}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs">{d.ip}</span>
                                                            {loadingIps[d.ip] && (
                                                                <Icon icon="material-symbols:progress-activity" className="size-3 animate-spin text-muted-foreground" />
                                                            )}
                                                            {country && (
                                                                <img
                                                                    src={country.flags.svg}
                                                                    alt={country.name.common}
                                                                    title={`${loc?.city ?? ''}, ${loc?.region ?? ''}, ${loc?.country_name ?? ''}`}
                                                                    className="h-4 w-auto rounded-sm"
                                                                />
                                                            )}
                                                            {loc?.country && !country && (
                                                                <span className="text-xs" title={`${loc.city}, ${loc.region}, ${loc.country_name}`}>
                                                                    {countryCodeToFlag(loc.country)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">{t('settings.sessions.last_seen')}</span>
                                                        <span className="text-xs">{new Date(d.last_seen).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">{t('settings.sessions.user_agent')}</span>
                                                        <span className="font-mono break-all text-xs max-w-[60%] text-right">{d.user_agent}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Revoke button */}
                            {!isCurrent && onDelete && (
                                <Button
                                    onClick={onDelete}
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Icon icon="material-symbols:logout-rounded" className="size-4 mr-1.5" />
                                    {t('settings.sessions.revoke_session')}
                                </Button>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const SESSIONS_PER_PAGE = 10;

export default function SessionsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { logout, wellKnown } = useApi();
    const { countries } = useCountries();

    const [query, setQuery] = useState(searchParams.get('q') ?? '');
    const [sessions, setSessions] = useState<IRSession[] | null>(null);
    const [currentSession, setCurrentSession] = useState<IRSession | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null as unknown as ReturnType<typeof setTimeout>);

    // Revoke single
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Revoke all
    const [showRevokeAll, setShowRevokeAll] = useState(false);
    const [revokingAll, setRevokingAll] = useState(false);

    const loadPage = useCallback(async (offset: number, ipFilter?: string) => {
        setLoading(true);
        try {
            const [sessionsRes, currentRes] = await Promise.all([
                listMySessions(SESSIONS_PER_PAGE, offset, ipFilter || undefined),
                currentSession ? Promise.resolve(currentSession) : fetchCurrentSession(),
            ]);

            if (!currentSession) {
                setCurrentSession(currentRes);
            }

            setTotal(sessionsRes.total);
            setSessions(prev => {
                if (offset === 0 || !prev) return sessionsRes.sessions;
                const existingIds = new Set(prev.map(s => s.id));
                const next = sessionsRes.sessions.filter(s => !existingIds.has(s.id));
                return [...prev, ...next];
            });
        } catch (e: any) {
            notify(e?.message ?? t('settings.sessions.error_load'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    }, [currentSession, t]);

    // Initial load — wait for wellKnown (gateway URL registration) before fetching
    useEffect(() => {
        if (!hasLoaded && wellKnown) { loadPage(0, query.trim() || undefined); setHasLoaded(true); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasLoaded, wellKnown]);

    // Debounced search: reset + reload on query change
    useEffect(() => {
        if (!hasLoaded || !wellKnown) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const q = query.trim();
            const params = new URLSearchParams(searchParams);
            if (q) params.set('q', q);
            else params.delete('q');
            router.replace(`?${params.toString()}`, { scroll: false });
            setSessions(null);
            setTotal(0);
            loadPage(0, q || undefined);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const handleDeleteSingle = async () => {
        if (!sessionToDelete) return;
        setDeleting(true);
        try {
            const res = await deleteMySession(sessionToDelete);
            if (res.logout) {
                await logout();
                router.push('/');
                return;
            }
            setSessions(prev => (prev ?? []).filter(s => s.id !== sessionToDelete));
            setTotal(prev => prev - 1);
            notify(t('settings.sessions.revoked_success'), { type: 'success' });
        } catch (e: any) {
            notify(e?.message ?? t('settings.sessions.error_delete'), { type: 'danger' });
        } finally {
            setDeleting(false);
            setSessionToDelete(null);
        }
    };

    const handleRevokeAll = async () => {
        setRevokingAll(true);
        try {
            const res = await deleteAllMySessions();
            if (res.logout) {
                await logout();
                router.push('/');
                return;
            }
            setSessions(currentSession ? [currentSession] : []);
            setTotal(1);
            notify(t('settings.sessions.revoke_all_success'), { type: 'success' });
        } catch (e: any) {
            notify(e?.message ?? t('settings.sessions.error_delete_all'), { type: 'danger' });
        } finally {
            setRevokingAll(false);
            setShowRevokeAll(false);
        }
    };

    const allSessions = sessions ?? [];
    // Separate active (websocket connected) from idle, exclude current
    const otherSessions = allSessions.filter(s => !s.current && s.id !== currentSession?.id);
    const activeSessions = otherSessions.filter(s => s.active);
    const idleSessions = otherSessions.filter(s => !s.active);
    const hasMore = sessions !== null && total > allSessions.length;

    const skeletons = (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card py-2.5 px-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const hasOtherSessions = otherSessions.length > 0;

    const renderSessionList = (list: IRSession[]) => (
        <div className="space-y-3">
            {list.map(s => (
                <SessionCard
                    key={s.id}
                    session={s}
                    isCurrent={false}
                    onDelete={() => setSessionToDelete(s.id)}
                    t={t}
                    countries={countries}
                />
            ))}
        </div>
    );

    return (
        <>
            <PageTitle title={t('settings.sessions.title')} />
            <SiteHeader
                children={t('settings.sessions.title')}
                subtitle={t('settings.sessions.description')}
                after={
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Icon
                                icon="material-symbols:search-rounded"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                            />
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={t('settings.sessions.search_ip_placeholder')}
                                className="pl-8 h-8 w-44 text-sm"
                            />
                        </div>
                        {hasOtherSessions && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRevokeAll(true)}
                                disabled={loading}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Icon icon="material-symbols:block-rounded" className="size-4 mr-1.5" />
                                {t('settings.sessions.revoke_all')}
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="p-4 md:p-6">
                <div className="space-y-8">
                    {/* Current Session */}
                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">{t('settings.sessions.current_session')}</h2>
                        {currentSession ? (
                            <SessionCard
                                session={currentSession}
                                isCurrent
                                t={t}
                                countries={countries}
                            />
                        ) : sessions === null ? (
                            skeletons
                        ) : (
                            <EmptyBox>{t('settings.sessions.no_other_sessions')}</EmptyBox>
                        )}
                    </section>

                    {/* Active (Connected) Sessions */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">{t('settings.sessions.active_sessions')}</h2>
                            {sessions !== null && (
                                <span className="text-sm text-muted-foreground">{activeSessions.length}</span>
                            )}
                        </div>
                        {sessions === null
                            ? skeletons
                            : activeSessions.length === 0
                                ? <EmptyBox>{t('settings.sessions.no_active_sessions')}</EmptyBox>
                                : renderSessionList(activeSessions)
                        }
                    </section>

                    {/* Inactive (Idle) Sessions */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">{t('settings.sessions.idle_sessions')}</h2>
                            {sessions !== null && (
                                <span className="text-sm text-muted-foreground">{idleSessions.length}</span>
                            )}
                        </div>
                        {sessions === null
                            ? skeletons
                            : idleSessions.length === 0
                                ? <EmptyBox>{t('settings.sessions.no_idle_sessions')}</EmptyBox>
                                : renderSessionList(idleSessions)
                        }
                    </section>

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center pt-2">
                            <Button
                                onClick={() => loadPage(allSessions.length, query.trim() || undefined)}
                                disabled={loading}
                                variant="outline"
                            >
                                {loading ? t('settings.sessions.loading') : t('settings.sessions.load_more')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Revoke Single Confirmation Modal */}
                <ModalDrawer
                    open={!!sessionToDelete}
                    onOpenChange={open => { if (!open) setSessionToDelete(null); }}
                    header={t('settings.sessions.revoke_session')}
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setSessionToDelete(null)} disabled={deleting}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteSingle} disabled={deleting}>
                                {deleting ? (
                                    <>
                                        <Icon icon="material-symbols:progress-activity" className="size-4 mr-1.5 animate-spin" />
                                        {t('settings.sessions.revoking')}
                                    </>
                                ) : (
                                    t('settings.sessions.revoke')
                                )}
                            </Button>
                        </>
                    }
                >
                    <p className="text-sm text-muted-foreground">
                        {t('settings.sessions.revoke_session_desc')}
                    </p>
                </ModalDrawer>

                {/* Revoke All Confirmation Modal */}
                <ModalDrawer
                    open={showRevokeAll}
                    onOpenChange={setShowRevokeAll}
                    header={t('settings.sessions.revoke_all_title')}
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setShowRevokeAll(false)} disabled={revokingAll}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleRevokeAll} disabled={revokingAll}>
                                {revokingAll ? (
                                    <>
                                        <Icon icon="material-symbols:progress-activity" className="size-4 mr-1.5 animate-spin" />
                                        {t('settings.sessions.revoking')}
                                    </>
                                ) : (
                                    t('settings.sessions.revoke_all_button')
                                )}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                            {t('settings.sessions.revoke_all_desc')}
                        </p>
                        <p className="font-medium text-destructive">
                            {t('settings.sessions.revoke_all_warning')}
                        </p>
                    </div>
                </ModalDrawer>
            </div>
        </>
    );
}
