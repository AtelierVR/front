'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface LogEntry {
    timestamp: number;
    level: string;
    message: string;
    tag?: string | null;
}

interface LogsViewerProps {
    logs: LogEntry[];
    loading?: boolean;
    error?: string;
    liveMode?: boolean;
    onRefresh?: () => void;
    className?: string;
    isInputable?: boolean;
    onInput?: (command: string) => void;
}

function getLevelColor(level: string) {
    switch (level.toLowerCase()) {
        case 'error':
            return 'text-red-500';
        case 'warning':
            return 'text-yellow-500';
        case 'debug':
            return 'text-blue-500';
        case 'log':
            return 'text-cyan-500';
        default:
            return 'text-foreground';
    }
}

function getLevelBgColor(level: string) {
    switch (level.toLowerCase()) {
        case 'error':
            return 'bg-red-500/5';
        case 'warning':
            return 'bg-yellow-500/5';
        case 'debug':
            return 'bg-blue-500/5';
        default:
            return '';
    }
}

const ALL_LOG_LEVELS = ['error', 'warning', 'log', 'debug'] as const;
const MAX_LOG_LEVEL_LENGTH = Math.max(...ALL_LOG_LEVELS.map(level => level.length)) - 2;
const STORAGE_KEY = 'logs-active-levels';
const TAGS_STORAGE_KEY = 'logs-active-tags';

function loadActiveLevels(): Set<string> {
    if (typeof window === 'undefined') return new Set(ALL_LOG_LEVELS);
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return new Set(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Set(ALL_LOG_LEVELS);
}

function saveActiveLevels(levels: Set<string>) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(levels))); } catch { /* ignore */ }
}

function loadActiveTags(): Set<string> | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(TAGS_STORAGE_KEY);
        if (stored) return new Set(JSON.parse(stored));
    } catch { /* ignore */ }
    return null;
}

function saveActiveTags(tags: Set<string> | null) {
    if (typeof window === 'undefined') return;
    try {
        if (tags === null) localStorage.removeItem(TAGS_STORAGE_KEY);
        else localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(Array.from(tags)));
    } catch { /* ignore */ }
}

export function LogsViewer({
    logs,
    loading = false,
    error,
    liveMode = false,
    onRefresh,
    className,
    isInputable = false,
    onInput,
}: LogsViewerProps) {
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [focusBottom, setFocusBottom] = useState(true);
    const [activeLevels, setActiveLevels] = useState<Set<string>>(() => loadActiveLevels());
    const [activeTags, setActiveTags] = useState<Set<string> | null>(() => loadActiveTags());
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const modalLogsContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalInputRef = useRef<HTMLInputElement>(null);

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        logs.forEach(log => { if (log.tag) tags.add(log.tag); });
        return Array.from(tags).sort();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (!activeLevels.has(log.level.toLowerCase())) return false;
            if (activeTags !== null) {
                if (!log.tag || !activeTags.has(log.tag)) return false;
            }
            return true;
        });
    }, [logs, activeLevels, activeTags]);

    const toggleLevel = (level: string) => {
        setActiveLevels(prev => {
            const next = new Set(prev);
            if (next.has(level)) next.delete(level); else next.add(level);
            saveActiveLevels(next);
            return next;
        });
    };

    const toggleTag = (tag: string) => {
        setActiveTags(prev => {
            if (prev === null) {
                const next = new Set([tag]);
                saveActiveTags(next);
                return next;
            }
            const next = new Set(prev);
            if (next.has(tag)) {
                next.delete(tag);
                if (next.size === 0) { saveActiveTags(null); return null; }
            } else {
                next.add(tag);
            }
            saveActiveTags(next);
            return next;
        });
    };

    const clearTagFilter = () => { setActiveTags(null); saveActiveTags(null); };

    const handleSendCommand = (isModal = false) => {
        if (!inputValue.trim() || !onInput) return;
        onInput(inputValue);
        setInputValue('');
        (isModal ? modalInputRef : inputRef).current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isModal = false) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSendCommand(isModal); }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 4;
        if (isAtBottom && !focusBottom) setFocusBottom(true);
        else if (!isAtBottom && focusBottom) setFocusBottom(false);
    };

    useEffect(() => {
        if (!focusBottom) return;
        setTimeout(() => {
            logsContainerRef.current?.scrollTo({ top: logsContainerRef.current.scrollHeight });
            modalLogsContainerRef.current?.scrollTo({ top: modalLogsContainerRef.current.scrollHeight });
        }, 0);
    }, [filteredLogs, focusBottom]);

    useEffect(() => {
        if (fullscreenOpen && focusBottom) {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                modalLogsContainerRef.current?.scrollTo({ top: modalLogsContainerRef.current.scrollHeight });
            }));
        }
    }, [fullscreenOpen, focusBottom]);

    useEffect(() => {
        if (!fullscreenOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreenOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [fullscreenOpen]);

    const renderContent = (isModal = false) => (
        <div className={cn('flex flex-col overflow-hidden', isModal ? 'h-full flex-1' : ['flex-1', className])}>
            {error && (
                <Alert variant="destructive">
                    <Icon icon="material-symbols:error-circle-rounded" className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="p-0 overflow-hidden relative flex-1 flex flex-col rounded-lg border border-border bg-accent/10">
                {/* Controls */}
                <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        {liveMode && (
                            <Icon icon="material-symbols:radio-button-checked" className="size-3.5 animate-pulse text-green-600" />
                        )}

                        {/* Tag filter */}
                        {availableTags.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={cn('gap-1.5 bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-3', activeTags !== null && 'bg-accent text-accent-foreground')}
                                >
                                    <Icon icon="material-symbols:label-outline" className="size-4" />
                                    Tags
                                    {activeTags !== null && (
                                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                            {activeTags.size}
                                        </Badge>
                                    )}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        <span>Tags</span>
                                        {activeTags !== null && (
                                            <button
                                                onClick={clearTagFilter}
                                                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-5 px-2 text-xs')}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {availableTags.map(tag => (
                                        <DropdownMenuCheckboxItem
                                            key={tag}
                                            checked={activeTags !== null && activeTags.has(tag)}
                                            onCheckedChange={() => toggleTag(tag)}
                                        >
                                            <span className="font-mono text-xs">{tag}</span>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Level filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="gap-1.5 bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-3"
                            >
                                <Icon icon="material-symbols:filter-list-rounded" className="size-4" />
                                Levels
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Log Levels</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {ALL_LOG_LEVELS.map(level => (
                                    <DropdownMenuCheckboxItem
                                        key={level}
                                        checked={activeLevels.has(level)}
                                        onCheckedChange={() => toggleLevel(level)}
                                    >
                                        <span className={cn('font-semibold', getLevelColor(level))}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </span>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Refresh */}
                        {onRefresh && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="bg-background"
                                onClick={onRefresh}
                                disabled={loading}
                                aria-label="Refresh"
                            >
                                <Icon
                                    icon="material-symbols:refresh-rounded"
                                    className={cn('size-4', loading && 'animate-spin')}
                                />
                            </Button>
                        )}

                        {/* Fullscreen toggle */}
                        {!isModal ? (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="bg-background"
                                onClick={() => setFullscreenOpen(true)}
                                aria-label="Open fullscreen"
                            >
                                <Icon icon="material-symbols:open-in-full-rounded" className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="bg-background"
                                onClick={() => setFullscreenOpen(false)}
                                aria-label="Close fullscreen"
                            >
                                <Icon icon="material-symbols:close-rounded" className="size-4" />
                            </Button>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground me-1">
                        {filteredLogs.length} / {logs.length}
                    </span>
                </div>

                {/* Log lines */}
                <div
                    ref={isModal ? modalLogsContainerRef : logsContainerRef}
                    onScroll={handleScroll}
                    className={cn(
                        'bg-zinc-950 overflow-auto font-mono text-xs',
                        isModal ? 'h-screen' : 'flex-1',
                        isInputable && 'pb-0',
                    )}
                    style={isModal ? { height: isInputable ? 'calc(100vh - 48px)' : '100vh' } : undefined}
                >
                    {loading && logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Icon icon="material-symbols:refresh-rounded" className="size-6 animate-spin mr-2" />
                            Loading logs…
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {logs.length === 0 ? 'No logs' : 'No matching logs'}
                        </div>
                    ) : (
                        <div className="p-2 pt-12 h-0">
                            {filteredLogs.map((log, index) => (
                                <div
                                    key={`${log.timestamp}-${index}`}
                                    className={cn('py-1 px-2 hover:bg-white/5 rounded', getLevelBgColor(log.level))}
                                >
                                    <span className="text-zinc-500">
                                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                                    </span>
                                    <span className={cn('mx-2 font-semibold', getLevelColor(log.level))}>
                                        [{log.level}]
                                        {'\u00A0'.repeat(Math.max(0, MAX_LOG_LEVEL_LENGTH - log.level.length))}
                                    </span>
                                    {log.tag && (
                                        <span className="text-blue-400 font-mono text-xs mr-2">[{log.tag}]</span>
                                    )}
                                    <span className="text-zinc-200 whitespace-pre-wrap break-all">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Command input */}
                {isInputable && onInput && (
                    <div className="bg-zinc-900 border-t border-zinc-800 p-2 flex items-center gap-2">
                        <span className="text-zinc-500 text-xs">$</span>
                        <input
                            ref={isModal ? modalInputRef : inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => handleKeyDown(e, isModal)}
                            placeholder="Type a command…"
                            className="flex-1 bg-transparent text-zinc-200 text-xs font-mono outline-none placeholder:text-zinc-600"
                        />
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSendCommand(isModal)}
                            disabled={!inputValue.trim()}
                            aria-label="Send command"
                        >
                            <Icon icon="material-symbols:send-rounded" className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {renderContent(false)}
            {fullscreenOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-background">
                    {renderContent(true)}
                </div>
            )}
        </>
    );
}
