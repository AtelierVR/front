'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { getEnvironment, patchEnvironment, useApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import type { ApiConfigEntry } from '@/types/api';
import { NotFound } from '@/app/(dashboard)/not-found';

function effectiveValue(cfg: ApiConfigEntry): string {
    if (cfg.forced && cfg.environment !== null) return cfg.environment;
    if (cfg.override !== null) return cfg.override;
    if (cfg.environment !== null) return cfg.environment;
    return displayDefault(cfg.default);
}

function displayDefault(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const obj = value as Record<string, string>;
        return obj['en'] ?? Object.values(obj)[0] ?? '';
    }
    return String(value);
}

function valueSource(cfg: ApiConfigEntry): 'forced' | 'db' | 'env' | 'default' {
    if (cfg.forced) return 'forced';
    if (cfg.override !== null) return 'db';
    if (cfg.environment !== null) return 'env';
    return 'default';
}

const SOURCE_COLORS: Record<string, string> = {
    forced: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40',
    db: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40',
    env: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/40',
    default: 'bg-muted/60 text-muted-foreground border-border',
};

const SOURCE_LABELS: Record<string, string> = {
    forced: 'forced',
    db: 'db override',
    env: 'env var',
    default: 'default',
};

function ConfigRow({
    cfg,
    editValue,
    onChange,
    onReset,
    dirty,
    saveError,
}: {
    cfg: ApiConfigEntry;
    editValue: string;
    onChange: (v: string) => void;
    onReset: () => void;
    dirty: boolean;
    saveError?: string;
}) {
    const source = valueSource(cfg);
    const isForced = cfg.forced;

    return (
        <div className={cn(
            'rounded-lg border p-4 flex flex-col gap-3 transition-all',
            dirty ? 'border-ring/60 bg-primary/5' : 'border-border bg-accent/10',
            saveError && 'border-destructive/50 bg-destructive/5',
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{cfg.label ?? cfg.key}</span>
                        <code className="text-xs bg-muted/80 px-1.5 py-0.5 rounded border border-border font-mono">{cfg.key}</code>
                        <Badge className={cn('text-xs font-medium rounded border', SOURCE_COLORS[source])}>
                            {SOURCE_LABELS[source]}
                        </Badge>
                        {cfg.risky && (
                            <Badge className="text-xs font-medium rounded border bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30">
                                <Icon icon="material-symbols:warning-rounded" className="size-3 mr-1" />
                                risky
                            </Badge>
                        )}
                    </div>
                    {cfg.description && (
                        <p className="text-xs text-muted-foreground mt-1">{cfg.description}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    value={editValue}
                    onChange={e => onChange(e.target.value)}
                    disabled={isForced}
                    placeholder={isForced ? '(forced by environment — cannot edit)' : `Default: ${displayDefault(cfg.default)}`}
                    className={cn('h-9 text-sm', dirty && 'border-ring ring-ring/30 ring-[3px]')}
                />
                {!isForced && (
                    <Button
                        variant="outline"
                        size="icon-sm"
                        title="Reset to env/default (remove db override)"
                        onClick={onReset}
                        disabled={cfg.override === null}
                        className="shrink-0 h-9 w-9"
                    >
                        <Icon icon="material-symbols:settings-backup-restore-rounded" className="size-4" />
                    </Button>
                )}
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                {cfg.environment !== null && (
                    <span>
                        <span className="opacity-60">env: </span>
                        <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">{cfg.environment}</code>
                    </span>
                )}
                <span>
                    <span className="opacity-60">default: </span>
                    <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">{displayDefault(cfg.default) || '(empty)'}</code>
                </span>
            </div>

            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
    );
}

export default function EnvironmentPage() {
    const { isAdmin, isLoading } = useApi();
    const { t } = useTranslation();
    if (isLoading) return null;
    if (!isAdmin) return <NotFound />;
    return <EnvironmentPageInner />;
}

function EnvironmentPageInner() {
    const { t } = useTranslation();
    const [configs, setConfigs] = useState<ApiConfigEntry[]>([]);
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [resets, setResets] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
    const [filterText, setFilterText] = useState('');
    const [filterSources, setFilterSources] = useState<Set<string>>(new Set());
    const [showRisky, setShowRisky] = useState(false);

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const res = await getEnvironment();
            setConfigs(res.items);
            const init: Record<string, string> = {};
            for (const cfg of res.items) init[cfg.key] = cfg.override ?? '';
            setEdits(init);
            setResets(new Set());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const isDirty = useCallback(
        (cfg: ApiConfigEntry) => {
            if (resets.has(cfg.key)) return true;
            return (edits[cfg.key] ?? '') !== (cfg.override ?? '');
        },
        [edits, resets],
    );

    const handleChange = (key: string, value: string) => {
        setEdits(prev => ({ ...prev, [key]: value }));
        setResets(prev => { const n = new Set(prev); n.delete(key); return n; });
        setSavedOk(false);
    };

    const handleReset = (key: string) => {
        setResets(prev => new Set(prev).add(key));
        setEdits(prev => ({ ...prev, [key]: '' }));
        setSavedOk(false);
    };

    const hasAnyChanges = configs.some(isDirty);

    const toggleSourceFilter = (source: string) => {
        setFilterSources(prev => {
            const next = new Set(prev);
            if (next.has(source)) next.delete(source); else next.add(source);
            return next;
        });
    };

    const filteredConfigs = configs.filter(cfg => {
        if (!showRisky && cfg.risky) return false;
        if (filterSources.size > 0 && !filterSources.has(valueSource(cfg))) return false;
        if (filterText.trim()) {
            const q = filterText.toLowerCase();
            if (
                !cfg.key.toLowerCase().includes(q) &&
                !(cfg.label ?? '').toLowerCase().includes(q) &&
                !(cfg.description ?? '').toLowerCase().includes(q)
            ) return false;
        }
        return true;
    });

    const handleSave = async () => {
        setSaving(true);
        setSaveErrors({});
        setSavedOk(false);

        const payload = configs
            .filter(isDirty)
            .map(cfg => ({
                key: cfg.key,
                value: resets.has(cfg.key) ? null : (edits[cfg.key]?.trim() || null),
            }));

        try {
            const res = await patchEnvironment(payload);
            const errs: Record<string, string> = {};
            for (const r of res.results) {
                if (!r.ok) errs[r.key] = r.error ?? 'error';
            }
            if (Object.keys(errs).length > 0) {
                setSaveErrors(errs);
            } else {
                setSavedOk(true);
                await loadConfigs();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageTitle title={t('admin.environment')} />
            <SiteHeader children={t('admin.environment')} />
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Icon icon="material-symbols:search-rounded" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            placeholder="Filter by key, label, or description…"
                            className="pl-8 pr-8 h-9 text-sm"
                        />
                        {filterText && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                                onClick={() => setFilterText('')}
                            >
                                <Icon icon="material-symbols:close-rounded" className="size-4" />
                            </Button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowRisky(v => !v)}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border transition-colors whitespace-nowrap',
                            showRisky
                                ? 'bg-orange-500 text-black border-orange-500/80 hover:bg-orange-500/80'
                                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                    >
                        <Icon icon="material-symbols:warning-rounded" className="size-3.5" />
                        Risky
                    </button>

                    {(['forced', 'db', 'env', 'default'] as const).map(s => {
                        const count = configs.filter(c => valueSource(c) === s).length;
                        const active = filterSources.has(s);
                        return (
                            <button
                                key={s}
                                onClick={() => toggleSourceFilter(s)}
                                className={cn(
                                    'inline-flex items-center gap-1 h-9 px-3 rounded-md text-xs font-medium border transition-colors whitespace-nowrap',
                                    active ? SOURCE_COLORS[s] : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                )}
                            >
                                {SOURCE_LABELS[s]}
                                <span className="opacity-60">({count})</span>
                            </button>
                        );
                    })}

                    <div className="ml-auto flex items-center gap-2">
                        {savedOk && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <Icon icon="material-symbols:check-circle-rounded" className="size-4" />
                                Saved
                            </span>
                        )}
                        <Button onClick={loadConfigs} variant="outline" size="sm" disabled={loading}>
                            <Icon icon="material-symbols:refresh-rounded" className={cn('size-4', loading && 'animate-spin')} />
                            Refresh
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={!hasAnyChanges || saving}>
                            {saving ? (
                                <Icon icon="material-symbols:refresh-rounded" className="size-4 animate-spin" />
                            ) : (
                                <Icon icon="material-symbols:save-rounded" className="size-4" />
                            )}
                            Save changes
                        </Button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <Alert variant="destructive">
                        <Icon icon="material-symbols:error-circle-rounded" className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Config list */}
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                        <Icon icon="material-symbols:progress-activity" className="size-5 animate-spin" />
                        {t('admin.loading_config')}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredConfigs.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                {t('admin.no_configs')}
                            </div>
                        ) : filteredConfigs.map(cfg => (
                            <ConfigRow
                                key={cfg.key}
                                cfg={cfg}
                                editValue={edits[cfg.key] ?? ''}
                                onChange={v => handleChange(cfg.key, v)}
                                onReset={() => handleReset(cfg.key)}
                                dirty={isDirty(cfg)}
                                saveError={saveErrors[cfg.key]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
