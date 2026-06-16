/**
 * Animated GIF processing utilities.
 *
 * Uses gifuct-js (parser/decoder) + gif.js (encoder) to crop animated GIFs
 * frame-by-frame while preserving animation, delays, and transparency.
 */

import { parseGIF, decompressFrames } from 'gifuct-js';

// gif.js is a CJS module without TS types — lazily imported when needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _GIF: any;
async function getGifEncoder(): Promise<any> {
    if (!_GIF) {
        const mod = await import('gif.js');
        _GIF = mod.default || mod;
    }
    return _GIF;
}

// ─── detection ────────────────────────────────────────────────────────────────

/** Quick check: does the MIME type suggest an animated-capable format? */
function isGifMime(file: File): boolean {
    return file.type === 'image/gif';
}

/**
 * Parse a data URL and return the number of frames.
 * Returns 0 if the image is not a valid GIF or has no frames.
 */
export async function getGifFrameCount(dataUrl: string): Promise<number> {
    try {
        const resp = await fetch(dataUrl);
        if (!resp.ok) return 0;
        const buffer = await resp.arrayBuffer();
        const gif = parseGIF(buffer);
        const frames = decompressFrames(gif, false); // false = skip patch building, faster
        return frames.length;
    } catch {
        return 0;
    }
}

/**
 * Returns true if the file is an animated GIF (>1 frame).
 * For non-GIF files always returns false.
 */
export async function isAnimatedGif(file: File, dataUrl: string): Promise<boolean> {
    if (!isGifMime(file)) return false;
    const count = await getGifFrameCount(dataUrl);
    return count > 1;
}

// ─── crop ─────────────────────────────────────────────────────────────────────

interface CropParams {
    /** Source image natural width */
    srcW: number;
    /** Source image natural height */
    srcH: number;
    /** Target aspect ratio (w/h) */
    targetRatio: number;
    /** Zoom level, 1 = fill, >1 = zoom in */
    zoom: number;
    /** Pan X in [0, 1] (0.5 = centered) */
    offsetX: number;
    /** Pan Y in [0, 1] (0.5 = centered) */
    offsetY: number;
}

/** Compute the source crop rectangle (in original image pixels) from crop params. */
function computeCropRect(p: CropParams): {
    srcX: number; srcY: number; srcW: number; srcH: number;
    outW: number; outH: number;
} {
    // Maximum crop area at targetRatio that fits the source image (zoom=1)
    let baseCropW: number, baseCropH: number;
    if (p.srcW / p.srcH > p.targetRatio) {
        baseCropH = p.srcH;
        baseCropW = p.srcH * p.targetRatio;
    } else {
        baseCropW = p.srcW;
        baseCropH = p.srcW / p.targetRatio;
    }

    const srcCropW = baseCropW / p.zoom;
    const srcCropH = baseCropH / p.zoom;
    const srcX = p.offsetX * p.srcW - srcCropW / 2;
    const srcY = p.offsetY * p.srcH - srcCropH / 2;

    const clampedSrcX = Math.max(0, Math.min(srcX, p.srcW - srcCropW));
    const clampedSrcY = Math.max(0, Math.min(srcY, p.srcH - srcCropH));
    const clampedW = Math.min(srcCropW, p.srcW - clampedSrcX);
    const clampedH = Math.min(srcCropH, p.srcH - clampedSrcY);

    return {
        srcX: clampedSrcX, srcY: clampedSrcY,
        srcW: clampedW, srcH: clampedH,
        outW: Math.round(baseCropW),
        outH: Math.round(baseCropH),
    };
}

/**
 * Crop an animated GIF to the target aspect ratio, preserving all frames and delays.
 *
 * Strategy:
 * 1. Parse GIF → frames with pixel patches
 * 2. Maintain a full-size compositing canvas (handles disposal / partial frames)
 * 3. For each frame: apply patch → crop region → add to encoder
 * 4. Return data URL of the resulting animated GIF
 */
export async function cropAnimatedGif(
    dataUrl: string,
    targetRatio: number,
    zoom: number,
    offsetX: number,
    offsetY: number,
): Promise<string> {
    // 1. Fetch & parse
    const resp = await fetch(dataUrl);
    const buffer = await resp.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true); // true = build patches

    if (frames.length === 0) return dataUrl;

    const fullW = gif.lsd.width;
    const fullH = gif.lsd.height;
    const crop = computeCropRect({ srcW: fullW, srcH: fullH, targetRatio, zoom, offsetX, offsetY });

    // 2. Compositing canvas (full GIF size)
    const comp = document.createElement('canvas');
    comp.width = fullW;
    comp.height = fullH;
    const compCtx = comp.getContext('2d')!;

    // Output canvas (cropped size)
    const out = document.createElement('canvas');
    out.width = crop.outW;
    out.height = crop.outH;
    const outCtx = out.getContext('2d')!;

    // 3. Build frames for the encoder
    interface EncoderFrame {
        canvas: HTMLCanvasElement;
        delay: number;
    }
    const encoderFrames: EncoderFrame[] = [];

    for (const frame of frames) {
        const { dims, patch, delay, disposalType } = frame;

        // Apply disposal from *previous* frame
        if (disposalType === 2) {
            // "Restore to background" — clear the frame's region
            compCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
        } else if (disposalType === 3) {
            // "Restore to previous" — we approximate by leaving as-is
            // (full previous-state restore would require a snapshot)
        }
        // disposalType 0 & 1: "no disposal" / "do not dispose" — leave content

        // Draw this frame's patch
        if (patch && dims.width > 0 && dims.height > 0) {
            const imageData = new ImageData(patch as any, dims.width, dims.height);
            // We must use a temp canvas because putImageData ignores globalCompositeOperation
            const temp = document.createElement('canvas');
            temp.width = dims.width;
            temp.height = dims.height;
            temp.getContext('2d')!.putImageData(imageData, 0, 0);
            compCtx.drawImage(temp, dims.left, dims.top);
        }

        // Crop from the composited canvas
        outCtx.clearRect(0, 0, crop.outW, crop.outH);
        outCtx.drawImage(
            comp,
            crop.srcX, crop.srcY, crop.srcW, crop.srcH,
            0, 0, crop.outW, crop.outH,
        );

        // Clone the output canvas for the encoder (it needs a stable reference)
        const clone = document.createElement('canvas');
        clone.width = crop.outW;
        clone.height = crop.outH;
        clone.getContext('2d')!.drawImage(out, 0, 0);

        encoderFrames.push({ canvas: clone, delay: Math.max(20, delay) }); // min 2 cs
    }

    // 4. Encode with gif.js
    const GIF = await getGifEncoder();

    return new Promise((resolve, reject) => {
        const encoder = new GIF({
            workers: 2,
            quality: 10,
            width: crop.outW,
            height: crop.outH,
            workerScript: '/gif.worker.js',
            background: 0,
            transparent: 0x000000,
        });

        for (const f of encoderFrames) {
            encoder.addFrame(f.canvas, { delay: f.delay, copy: true });
        }

        encoder.on('finished', (blob: Blob) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read encoder blob'));
            reader.readAsDataURL(blob);
        });

        encoder.on('error', (err: Error) => reject(err));

        encoder.render();
    });
}

/**
 * Detect if a file is an animated-capable format (GIF or PNG).
 * For APNG: we check the MIME type; actual frame-count detection
 * is expensive, so we treat all PNGs uploaded as potentially APNG
 * and skip canvas processing for them to preserve animation.
 */
export function isAnimatedCapableFormat(file: File): boolean {
    return file.type === 'image/gif' || file.type === 'image/png' || file.type === 'image/apng';
}
