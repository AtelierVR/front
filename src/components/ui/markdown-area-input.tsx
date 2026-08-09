'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

interface MarkdownAreaInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

export function MarkdownAreaInput({ value, onChange, placeholder, rows = 16, className }: MarkdownAreaInputProps) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');
    const { t } = useTranslation();

    return (
        <div className={cn(
            'flex flex-col rounded-lg border border-input overflow-hidden',
            'transition-colors',
            'has-[[data-slot=markdown-input]:focus]:border-ring has-[[data-slot=markdown-input]:focus]:ring-3 has-[[data-slot=markdown-input]:focus]:ring-ring/50',
            className
        )}>
            {/* Tab bar */}
            <div className="flex border-b border-input bg-muted/30">
                <button
                    type="button"
                    onClick={() => setTab('write')}
                    className={cn(
                        'px-4 py-1.5 text-sm font-medium transition-colors',
                        tab === 'write'
                            ? 'bg-background border-b-2 border-primary text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {t('editor.write')}
                </button>
                <button
                    type="button"
                    onClick={() => setTab('preview')}
                    className={cn(
                        'px-4 py-1.5 text-sm font-medium transition-colors',
                        tab === 'preview'
                            ? 'bg-background border-b-2 border-primary text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {t('editor.preview')}
                </button>
            </div>

            {/* Content */}
            {tab === 'write' ? (
                <Textarea
                    data-slot="markdown-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className="rounded-none border-0 shadow-none focus-visible:ring-0 resize-y"
                />
            ) : (
                <div className="min-h-[8rem] p-4">
                    {value
                        ? <MarkdownRenderer content={value} />
                        : <span className="text-sm text-muted-foreground italic">{t('editor.nothing_to_preview')}</span>
                    }
                </div>
            )}
        </div>
    );
}
