'use client';

import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyBox } from '@/components/shared/ResultGrid';

const TAG_EDIT_REGEX = /^usr:([a-z_]+)?$/;
export const TAG_VALID_REGEX = /^usr:([a-z_])([a-z_]+)?$/;

interface TagListInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    className?: string;
}

export function TagListInput({ tags, onChange, className }: TagListInputProps) {
    const currentTags = tags.filter((t) => t.startsWith('usr:'));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (!TAG_EDIT_REGEX.test(value)) return;
        const next = [...currentTags];
        next[index] = value;
        onChange(next);
    };

    const handleRemove = (index: number) => {
        onChange(currentTags.filter((_, i) => i !== index));
    };

    const handleAdd = () => {
        onChange([...currentTags, 'usr:']);
        // Focus the new input after render
        setTimeout(() => inputRefs.current[currentTags.length]?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        } else if (e.key === 'Backspace' && currentTags[index] === 'usr:') {
            // Block deletion below the prefix — don't remove the tag
            e.preventDefault();
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {currentTags.length === 0 && (
                <EmptyBox>No tags yet.</EmptyBox>
            )}

            {currentTags.length > 0 && (
                <div className={cn(
                    'rounded-lg border border-input overflow-hidden divide-y divide-border',
                    'transition-colors',
                    'has-[[data-slot=tag-input]:focus]:border-ring has-[[data-slot=tag-input]:focus]:ring-3 has-[[data-slot=tag-input]:focus]:ring-ring/50',
                )}>
                    {currentTags.map((tag, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-muted/50 transition-colors"
                        >
                            <Input
                                data-slot="tag-input"
                                ref={(el) => { inputRefs.current[index] = el; }}
                                value={tag}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="flex-1 h-7 border-0 bg-transparent dark:bg-transparent focus-visible:ring-0 px-0 text-sm shadow-none font-mono"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemove(index)}
                                aria-label="Remove tag"
                            >
                                <Icon icon="material-symbols:close-rounded" className="size-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-3/4"
                    onClick={handleAdd}
                >
                    <Icon icon="material-symbols:add-rounded" className="size-4" />
                </Button>
            </div>
        </div>
    );
}
