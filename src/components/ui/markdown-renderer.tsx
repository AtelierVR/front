'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { codeToHtml } from "shiki";
import { cn } from '@/lib/utils';
import type { Components } from 'react-markdown';
import Link from 'next/link';

// ─── css-variables Shiki theme (not bundled in Shiki 4, defined inline) ───────

const CSS_VAR_THEME = {
    name: 'css-variables',
    type: 'light' as const,
    colors: {
        'editor.background': 'var(--shiki-color-background)',
        'editor.foreground': 'var(--shiki-color-text)',
    },
    tokenColors: [
        {
            scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
            settings: { foreground: 'var(--shiki-token-comment)' }
        },
        {
            scope: ['constant', 'entity.name.constant', 'variable.other.constant', 'variable.language'],
            settings: { foreground: 'var(--shiki-token-constant)' }
        },
        {
            scope: ['keyword', 'storage', 'storage.type', 'keyword.control'],
            settings: { foreground: 'var(--shiki-token-keyword)' }
        },
        {
            scope: ['string', 'string punctuation.section.embedded source'],
            settings: { foreground: 'var(--shiki-token-string)' }
        },
        {
            scope: ['entity.name', 'entity.name.function', 'support.function'],
            settings: { foreground: 'var(--shiki-token-function)' }
        },
        {
            scope: ['variable.parameter', 'meta.function variable.other.readwrite'],
            settings: { foreground: 'var(--shiki-token-parameter)' }
        },
        {
            scope: ['punctuation', 'meta.tag', 'punctuation.definition.tag'],
            settings: { foreground: 'var(--shiki-token-punctuation)' }
        },
        {
            scope: ['markup.underline.link', 'string.other.link'],
            settings: { foreground: 'var(--shiki-token-link)' }
        },
    ],
};

// ─── ShikiCodeBlock ───────────────────────────────────────────────────────────

function ShikiCodeBlock({ lang, code }: { lang: string; code: string }) {
    let [html, setHtml] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        codeToHtml(code, { lang, theme: CSS_VAR_THEME }).then(result => {
            if (!cancelled) setHtml(result);
        });
        return () => { cancelled = true; };
    }, [code, lang]);
    
    return <>
        {html ? (
            <div
                className="not-prose rounded overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        ) : (
            <pre className="not-prose overflow-x-auto">
                <code>{code}</code>
            </pre>
        )}
    </>
}

// ─── react-markdown components ────────────────────────────────────────────────

const mdComponents: Components = {
    h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-1">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mt-3 mb-1">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1">{children}</h3>,
    ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5">{children}</ol>,
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-2">
            {children}
        </blockquote>
    ),
    a: ({ href, children }) => <Link
        href={href || '#'}
        className="underline text-primary hover:text-primary/80"
        target="_blank"
        rel="noopener noreferrer">
        {children}
    </Link>,
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children }) => {
        const content = String(children);
        const isBlock = content.includes('\n') || !!className?.startsWith('language-');
        if (isBlock) {
            const lang = /language-(\w+)/.exec(className ?? '')?.[1] ?? '';
            return <ShikiCodeBlock lang={lang} code={content.replace(/\n$/, '')} />;
        }
        return <code className="rounded font-mono">{children}</code>;
    },
};

// ─── MarkdownRenderer ─────────────────────────────────────────────────────────

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn('text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={mdComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
