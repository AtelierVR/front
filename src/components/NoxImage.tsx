'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';
import Image from 'next/image';
import type { ImageProps } from 'next/image';
import { useApi } from '@/lib/api/context';
import { addUrlQuery } from '@/lib/url';

/** Round up to the nearest allowed width, capped at the max. */
function nearestWidth(w: number, allowed: number[]): number {
    for (const a of allowed)
        if (a >= w) return a;
    return allowed[allowed.length - 1];
}

/**
 * Drop-in replacement for next/image that automatically requests the
 * optimal width from the server's image resize service (using the
 * `allowed_image_widths` from the instance config).
 *
 * The `?size=` parameter is based on the actual rendered width of the
 * image element (measured on load), not the `width` prop.
 */
export default function NoxImage({ src, width, height, alt, onLoad, ...rest }: ImageProps) {
    const { config } = useApi();
    const allowed = config?.allowed_image_widths;
    const imgRef = useRef<HTMLImageElement>(null);
    const [measured, setMeasured] = useState<number | null>(null);

    // Measure on load and on resize
    useEffect(() => {
        const el = imgRef.current;
        if (!el || !allowed) return;
        const update = () => {
            const w = Math.round(el.getBoundingClientRect().width);
            if (w > 0) setMeasured(prev => prev === w ? prev : w);
        };
        const observer = new ResizeObserver(update);
        observer.observe(el);
        update(); // initial measure
        return () => observer.disconnect();
    }, [allowed]);

    const handleLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
        onLoad?.(e);
    }, [onLoad]);

    const effectiveWidth = measured ?? (typeof width === 'number' ? width : undefined);

    let resolvedSrc = src;
    if (allowed && typeof src === 'string' && effectiveWidth
        && !src.startsWith('data:') && !src.startsWith('blob:')) {
        resolvedSrc = addUrlQuery(src, 'size', String(nearestWidth(effectiveWidth, allowed)));
    }

    return <Image
        ref={imgRef}
        src={resolvedSrc}
        width={width}
        height={height}
        alt={alt}
        onLoad={handleLoad}
        {...rest}
    />;
}
