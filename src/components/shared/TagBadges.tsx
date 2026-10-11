'use client';

import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDeveloperMode } from '@/lib/hooks/useDeveloperMode';
import { resolveTagDisplay, type TagDisplay } from '@/components/tags';

interface TagBadgesProps {
    tags: readonly string[];
    /** Maximum number of badges to render (defaults to all). */
    limit?: number;
    className?: string;
}

/**
 * Renders tags through the display registry. Tags with no known handler are hidden
 * unless advanced mode (`usr:developer`) is enabled on the signed-in account.
 */
export function TagBadges({ tags, limit, className }: TagBadgesProps) {
    const advanced = useDeveloperMode();

    const resolved = tags
        .map(tag => ({ tag, display: resolveTagDisplay(tag, { advanced }) }))
        .filter((d): d is { tag: string; display: TagDisplay } => d.display !== null)
        .slice(0, limit);

    if (resolved.length === 0) return null;

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {resolved.map(({ tag, display }) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className={cn('text-xs gap-1 px-1.5 py-0', display.background)}
                    style={display.color ? { color: display.color } : undefined}
                >
                    {display.icon != null && (
                        typeof display.icon === 'string'
                            ? <Icon icon={display.icon} className="size-3 shrink-0" />
                            : display.icon
                    )}
                    <span className="truncate max-w-[120px]">{display.label}</span>
                </Badge>
            ))}
        </div>
    );
}
