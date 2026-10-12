'use client';

import { useMemo, useState } from 'react';
import NoxImage from '@/components/NoxImage';
import { cn } from '@/lib/utils';
import { imageList, type ApiImageList, type ApiImageObject } from '@/types/api';

const NO_URLS: readonly string[] = [];

export interface ImageDisplayProps {
    /**
     * One image, or a list of candidates — the closest to `ratio` wins. Any
     * {@link ApiImageList} is accepted, so a legacy `thumbnail`/`banner` field can
     * be passed straight in.
     */
    source: ApiImageList;
    /**
     * Rendered box ratio (`width / height`), used to pick among the candidates
     * and as the box's aspect ratio: a banner uses `128 / 45`, a square card `1`.
     * Defaults to `1`.
     */
    ratio?: number;
    alt?: string;
    /** Applied to both the image and the fallback box. */
    className?: string;
    /** Classes of the fallback box only (`bg-muted` by default). */
    fallbackClassName?: string;
    /** Rendered inside the fallback box (e.g. an icon or a label). */
    fallback?: React.ReactNode;
    /** Load eagerly — for an image above the fold. */
    priority?: boolean;
    /** `next/image` sizes hint. */
    sizes?: string;
}

/**
 * Picks the image whose own ratio is closest to `ratio` (log distance, so a
 * 2× too wide is penalised like a 2× too tall). `priority` — lower is better,
 * the API orders the images by it — breaks ties, and is the only criterion for
 * images whose dimensions are unknown (uploads made before they were recorded).
 */
function bestImage(images: ApiImageObject[], ratio: number): ApiImageObject | null {
    if (images.length === 0) return null;
    const sorted = [...images].sort((a, b) => a.priority - b.priority);
    const measured = sorted.filter((image) => image.width > 0 && image.height > 0);
    if (measured.length === 0) return sorted[0];

    const target = Math.log(ratio > 0 ? ratio : 1);
    let best = measured[0];
    let bestScore = Infinity;
    for (const image of measured) {
        const score = Math.abs(Math.log(image.width / image.height) - target);
        if (score < bestScore) {
            best = image;
            bestScore = score;
        }
    }
    return best;
}

/**
 * Displays an entity image, choosing the best candidate for the box ratio.
 *
 * Used by the banners (asset `images`, ratio `128 / 45`) and the cards (ratio
 * `1`): it accepts any {@link ApiImageList} and falls back to a neutral box when
 * there is nothing to show — including when every candidate fails to load.
 */
export function ImageDisplay({
    source,
    ratio = 1,
    alt,
    className,
    fallbackClassName,
    fallback,
    priority,
    sizes,
}: ImageDisplayProps) {
    const images = useMemo(() => imageList(source), [source]);
    const sourceKey = images.map((image) => image.url).join('|');

    // A failing candidate is dropped and the next best one is tried; the record
    // is scoped to the source, so a different one starts from scratch.
    const [failures, setFailures] = useState<{ key: string; urls: readonly string[] }>({
        key: sourceKey,
        urls: NO_URLS,
    });
    const failedUrls = failures.key === sourceKey ? failures.urls : NO_URLS;

    const usable = useMemo(
        () => images.filter((image) => !failedUrls.includes(image.url)),
        [images, failedUrls],
    );
    const picked = useMemo(() => bestImage(usable, ratio), [usable, ratio]);

    const url = picked?.url ?? null;
    const height = Math.round(1024 / (ratio > 0 ? ratio : 1));

    if (!url)
        return (
            <div
                className={cn(
                    'flex h-full w-full items-center justify-center bg-muted',
                    fallbackClassName,
                    className,
                )}
                style={{ aspectRatio: String(ratio > 0 ? ratio : 1) }}
            >
                {fallback}
            </div>
        );

    return (
        <NoxImage
            className={cn('h-full w-full object-cover', className)}
            style={{ aspectRatio: String(ratio > 0 ? ratio : 1) }}
            src={url}
            alt={alt ?? picked?.alt ?? ''}
            width={picked && picked.width > 0 ? picked.width : 1024}
            height={picked && picked.height > 0 ? picked.height : height}
            sizes={sizes}
            priority={priority}
            onError={() =>
                setFailures((previous) => {
                    const urls = previous.key === sourceKey ? previous.urls : NO_URLS;
                    return urls.includes(url)
                        ? { key: sourceKey, urls }
                        : { key: sourceKey, urls: [...urls, url] };
                })
            }
        />
    );
}
