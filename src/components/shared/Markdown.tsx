'use client';

import { useEffect, useState } from "react";
import { createMarkdownRenderer } from "fumadocs-core/content/md";
import defaultMdxComponents from "fumadocs-ui/mdx";

const { Markdown: FumaMarkdown } = createMarkdownRenderer();

export interface MarkdownProps {
    src: string | null;
    fallback?: string;
}

enum Status {
    Loading,
    Error,
}

export default function Markdown({ src, fallback }: MarkdownProps) {
    const [content, setContent] = useState<string | Status>(Status.Loading);

    useEffect(() => {
        if (src === null) {
            setContent(Status.Error);
            return;
        }
        setContent(Status.Loading);
        fetch(src)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch markdown");
                return res.text();
            })
            .then(setContent)
            .catch(() => setContent(Status.Error));
    }, [src]);

    if (content === Status.Loading)
        return <div>Loading…</div>;

    if (content === Status.Error)
        return <div>{fallback ?? "Failed to load markdown"}</div>;

    return <FumaMarkdown components={defaultMdxComponents}>{content}</FumaMarkdown>;
}