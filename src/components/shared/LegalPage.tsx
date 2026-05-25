'use client';

import { useState, useEffect } from 'react';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { createMarkdownRenderer } from 'fumadocs-core/content/md';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { remarkHeading } from 'fumadocs-core/mdx-plugins/remark-heading';
import remarkGfm from 'remark-gfm';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {
    DocsTitle,
    DocsDescription,
    DocsBody,
    PageLastUpdate,
    MarkdownCopyButton,
    ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { TOCProvider, TOC } from 'fumadocs-ui/layouts/docs/page/slots/toc';
import { useTOCItems, TOCScrollArea } from 'fumadocs-ui/components/toc';
import { TOCItems, TOCItem, TOCEmpty } from 'fumadocs-ui/components/toc/default';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWellKnown } from '@/hooks/useWellKnown';
import type { TOCItemType } from 'fumadocs-core/toc';

const { Markdown: FumaMarkdown } = createMarkdownRenderer({
    remarkPlugins: [remarkHeading, remarkGfm],
});

enum Status {
    Loading,
    Error,
}

interface LegalFrontmatter {
    title?: string;
    description?: string;
    version?: number | string;
    date?: string;
}

function LegalTOCPopover() {
    const [open, setOpen] = useState(false);
    const items = useTOCItems();

    if (items.length === 0) return null;

    return (
        <div className="sticky top-[var(--fd-docs-row-2,3.5rem)] z-10 [grid-area:toc-popover] xl:hidden">
            <div className={cn('border-b backdrop-blur-sm transition-colors', open ? 'shadow-lg bg-fd-background/80' : 'bg-fd-background/80')}>
                <button
                    className="flex w-full h-10 items-center text-sm text-fd-muted-foreground gap-2.5 px-4 py-2.5 focus-visible:outline-none"
                    onClick={() => setOpen(v => !v)}
                >
                    <span className="flex-1 text-start truncate">On this page</span>
                    <ChevronDown className={cn('shrink-0 size-4 transition-transform mx-0.5', open && 'rotate-180')} />
                </button>
                {open && (
                    <div className="flex flex-col px-4 max-h-[50vh]">
                        <TOCScrollArea>
                            <TOCItems>
                                {items.length === 0 && <TOCEmpty />}
                                {items.map(item => (
                                    <TOCItem key={item.url} item={item} onClick={() => setOpen(false)} />
                                ))}
                            </TOCItems>
                        </TOCScrollArea>
                    </div>
                )}
            </div>
        </div>
    );
}

export interface LegalPageProps {
    endpoint: 'privacy' | 'terms' | 'rules';
    title: string;
    description: string;
}

export function LegalPage({ endpoint, title: propTitle, description: propDescription }: LegalPageProps) {
    const wk = useWellKnown();
    const src = wk?.endpoints[endpoint] ?? null;

    const [body, setBody] = useState<string | Status>(Status.Loading);
    const [toc, setToc] = useState<TOCItemType[]>([]);
    const [meta, setMeta] = useState<LegalFrontmatter>({});

    useEffect(() => {
        if (!src) return;
        setBody(Status.Loading);
        fetch(src)
            .then((r) => {
                if (!r.ok) throw new Error('Failed to fetch');
                return r.text();
            })
            .then((text) => {
                const parsed = frontmatter(text);
                const data = parsed.data as LegalFrontmatter;
                setMeta(data ?? {});
                const content = parsed.content;
                setBody(content);
                setToc(getTableOfContents(content));
            })
            .catch(() => setBody(Status.Error));
    }, [src]);

    const title = meta.title ?? propTitle;
    const description = meta.description ?? propDescription;
    const version = meta.version;
    const date = meta.date ? new Date(meta.date) : null;

    return (
        <TOCProvider toc={toc}>
            {/*
             * Replicate the fumadocs docs-layout grid (no sidebar).
             * The `layout` CSS variant targets #nd-home-layout:has(&) to propagate
             * --fd-toc-width / --fd-toc-popover-height back to the layout root.
             * --fd-docs-row-1 = height of the HomeLayout sticky navbar (h-14 = 3.5rem).
             */}
            <div
                className="grid overflow-x-clip"
                style={{
                    gridTemplateAreas: '"toc-popover toc"\n"main toc"',
                    gridTemplateColumns: 'minmax(0, 1fr) var(--fd-toc-width, 0px)',
                    gridTemplateRows: 'auto 1fr',
                    '--fd-docs-row-1': '3.5rem',
                    '--fd-docs-row-2': '3.5rem',
                    '--fd-docs-height': '100dvh',
                } as React.CSSProperties}
            >
                {/* Mobile TOC popover — hidden at xl, sticky below navbar */}
                <LegalTOCPopover />

                <article className="[grid-area:main] flex flex-col max-w-3xl w-full mx-auto px-4 py-8 md:px-6">
                    <DocsTitle>{title}</DocsTitle>
                    <DocsDescription>{description}</DocsDescription>

                    {/* Actions row: version badge + date + copy/open buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
                        {version != null && (
                            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-fd-muted-foreground">
                                v{version}
                            </span>
                        )}
                        {date && <PageLastUpdate date={date} className="text-xs text-fd-muted-foreground m-0" />}
                        {src && (
                            <>
                                <MarkdownCopyButton markdownUrl={src} className="h-7 text-xs" />
                                <ViewOptionsPopover markdownUrl={src} className="h-7 text-xs" />
                            </>
                        )}
                    </div>
                    <hr className="my-4 border-fd-border" />

                    <DocsBody>
                        {body === Status.Loading ? (
                            <div>Loading…</div>
                        ) : body === Status.Error ? (
                            <div>Failed to load content.</div>
                        ) : (
                            <FumaMarkdown components={defaultMdxComponents}>{body as string}</FumaMarkdown>
                        )}
                    </DocsBody>
                </article>

                {/* Desktop TOC — hidden on mobile, sticky in the toc grid area */}
                <TOC />
            </div>
        </TOCProvider>
    );
}
