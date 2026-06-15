'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { isAnimatedGif, cropAnimatedGif } from '@/lib/image-animated';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Parse "W/H" string into a numeric ratio, default 4/3. */
function parseRatio(ar: string): number {
    const [w, h] = ar.split('/').map(Number);
    return (w && h) ? w / h : 4 / 3;
}

/**
 * Strip metadata by redrawing onto a canvas.
 * Falls back to the original data-URL for formats the browser can't draw
 * (e.g. animated WebP that the browser doesn't support on canvas — rare,
 * but we detect draw failure and bail gracefully).
 */
async function stripMetadataFromDataUrl(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(dataUrl); return; }
                ctx.drawImage(img, 0, 0);
                // Detect blank canvas (tainted / unsupported frame) — PNG is safe default
                resolve(canvas.toDataURL('image/png'));
            } catch {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

/**
 * Crop a data-URL to the given target ratio using the provided pan/zoom state.
 * offsetX/offsetY are in [0,1] relative to the image natural size after zoom.
 */
async function cropDataUrl_(
    dataUrl: string,
    targetRatio: number,
    zoom: number,
    offsetX: number,
    offsetY: number,
): Promise<string> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;

            // Maximum crop area at targetRatio that fits the source image (zoom=1)
            let baseCropW: number, baseCropH: number;
            if (srcW / srcH > targetRatio) {
                baseCropH = srcH;
                baseCropW = srcH * targetRatio;
            } else {
                baseCropW = srcW;
                baseCropH = srcW / targetRatio;
            }

            // Crop region in source pixels shrinks as zoom increases
            const srcCropW = baseCropW / zoom;
            const srcCropH = baseCropH / zoom;
            const srcX = offsetX * srcW - srcCropW / 2;
            const srcY = offsetY * srcH - srcCropH / 2;

            // Clamp to source boundaries (belt-and-suspenders)
            const clampedSrcX = Math.max(0, Math.min(srcX, srcW - srcCropW));
            const clampedSrcY = Math.max(0, Math.min(srcY, srcH - srcCropH));
            const clampedW = Math.min(srcCropW, srcW - clampedSrcX);
            const clampedH = Math.min(srcCropH, srcH - clampedSrcY);

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(baseCropW);
            canvas.height = Math.round(baseCropH);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(dataUrl); return; }

            ctx.drawImage(img, clampedSrcX, clampedSrcY, clampedW, clampedH, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

// ─── crop modal ──────────────────────────────────────────────────────────────

interface CropModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (zoom: number, offsetX: number, offsetY: number) => void;
    dataUrl: string;
    targetRatio: number;
}

export interface CropControlsHandle {
    zoom: number;
    offsetX: number;
    offsetY: number;
}

interface CropControlsProps {
    dataUrl: string;
    targetRatio: number;
}

const CropControls = forwardRef<CropControlsHandle, CropControlsProps>(function CropControls({
    dataUrl,
    targetRatio,
}, ref) {
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0.5);
    const [offsetY, setOffsetY] = useState(0.5);

    useImperativeHandle(ref, () => ({ zoom, offsetX, offsetY }), [zoom, offsetX, offsetY]);

    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    // img natural size (loaded lazily)
    const naturalRef = useRef({ w: 1, h: 1 });

    /** Maximum crop area that fits the image at targetRatio (state → triggers re-render). */
    const [baseCrop, setBaseCrop] = useState({ w: 1, h: 1 });
    /** CSS scale multiplier so the object-contain image fills the viewport (state → triggers re-render). */
    const [displayScale, setDisplayScale] = useState(1);

    const computeBaseCrop = useCallback((w: number, h: number) => {
        if (w / h > targetRatio) 
            return { w: h * targetRatio, h };
        return { w, h: w / targetRatio };
    }, [targetRatio]);

    const clampOffset = useCallback((x: number, y: number, z: number) => {
        const { w, h } = naturalRef.current;
        // Crop region in image pixels at current zoom
        const cropW = baseCrop.w / z;
        const cropH = baseCrop.h / z;
        const halfCropW = cropW / 2 / w;
        const halfCropH = cropH / 2 / h;

        return {
            x: Math.min(1 - halfCropW, Math.max(halfCropW, x)),
            y: Math.min(1 - halfCropH, Math.max(halfCropH, y)),
        };
    }, [targetRatio, baseCrop]);

    // Per-axis mouse sensitivity: the "tight" axis (where object-fit leaves
    // gaps) needs displayScale×zoom to convert mouse px → offset fraction;
    // the "loose" axis only needs zoom.
    const mouseScaleX = zoom * (naturalRef.current.w / naturalRef.current.h > targetRatio ? displayScale : 1);
    const mouseScaleY = zoom * (naturalRef.current.w / naturalRef.current.h < targetRatio ? displayScale : 1);

    // global mouse listeners so dragging survives cursor leaving the modal.
    // Uses accumulated delta from the mousedown position (not incremental)
    // to avoid drift from nested state updaters and floating-point creep.
    const grabOffsetRef = useRef({ x: 0.5, y: 0.5 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = (e.clientX - lastPosRef.current.x) / rect.width;
        const dy = (e.clientY - lastPosRef.current.y) / rect.height;
        const c = clampOffset(
            grabOffsetRef.current.x - dx / mouseScaleX,
            grabOffsetRef.current.y - dy / mouseScaleY,
            zoom,
        );
        setOffsetX(c.x);
        setOffsetY(c.y);
    }, [zoom, clampOffset, mouseScaleX, mouseScaleY]);

    const handleMouseUp = useCallback(() => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        draggingRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        grabOffsetRef.current = { x: offsetX, y: offsetY };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp, offsetX, offsetY]);

    // touch
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const grabTouchOffsetRef = useRef({ x: 0.5, y: 0.5 });
    const onTouchStart = (e: React.TouchEvent) => {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        grabTouchOffsetRef.current = { x: offsetX, y: offsetY };
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = (e.touches[0].clientX - lastTouchRef.current.x) / rect.width;
        const dy = (e.touches[0].clientY - lastTouchRef.current.y) / rect.height;
        const c = clampOffset(
            grabTouchOffsetRef.current.x - dx / mouseScaleX,
            grabTouchOffsetRef.current.y - dy / mouseScaleY,
            zoom,
        );
        setOffsetX(c.x);
        setOffsetY(c.y);
    };

    const changeZoom = (delta: number) => {
        setZoom(z => {
            const next = Math.min(5, Math.max(1, z + delta));
            const c = clampOffset(offsetX, offsetY, next);
            setOffsetX(c.x);
            setOffsetY(c.y);
            return next;
        });
    };

    // preview: CSS transform — displayScale ensures the object-contain image
    // fills the viewport at zoom=1; user zoom multiplies on top.
    // Translate uses different scales per axis: the "tight" axis (where
    // object-fit leaves gaps) needs displayScale×zoom, the "loose" axis
    // (where content naturally fills) only needs zoom.
    const cssScale = displayScale * zoom;
    const imgRatio = naturalRef.current.w / naturalRef.current.h;
    const txScale = cssScale * (imgRatio > targetRatio ? 1 : imgRatio / targetRatio);
    const tyScale = cssScale * (imgRatio > targetRatio ? targetRatio / imgRatio : 1);
    const previewTransform = `translate(${-(offsetX - 0.5) * 100 * txScale}%, ${-(offsetY - 0.5) * 100 * tyScale}%) scale(${cssScale})`;

    return (
        <div className="flex flex-col gap-4">
            {/* Viewport clipped to target ratio */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-lg border border-border select-none cursor-grab active:cursor-grabbing"
                style={{ aspectRatio: targetRatio }}
                onMouseDown={onMouseDown}
                onWheel={(e) => {
                    e.preventDefault();
                    changeZoom(e.deltaY > 0 ? -0.1 : 0.1);
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={dataUrl}
                    alt="crop preview"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ transform: previewTransform, transformOrigin: 'center center' }}
                    onLoad={(e) => {
                        const img = e.currentTarget;
                        const w = img.naturalWidth;
                        const h = img.naturalHeight;
                        naturalRef.current = { w, h };

                        const crop = computeBaseCrop(w, h);
                        setBaseCrop(crop);

                        const ds = Math.max(w / h / targetRatio, targetRatio / (w / h));
                        setDisplayScale(ds);

                        // Start at ~1.1× zoom so there is at least 5 % panning room
                        // in the tightest dimension (user can always zoom back to 1×).
                        const defaultZoom = 1.1;
                        setZoom(defaultZoom);
                        setOffsetX(0.5);
                        setOffsetY(0.5);
                    }}
                    draggable={false}
                />
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon-sm" onClick={() => changeZoom(-0.25)} disabled={zoom <= 1}>
                    <Icon icon="material-symbols:remove-rounded" className="size-3.5" />
                </Button>
                <input
                    type="range"
                    min={1} max={5} step={0.05}
                    value={zoom}
                    onChange={e => { const z = Number(e.target.value); setZoom(z); const c = clampOffset(offsetX, offsetY, z); setOffsetX(c.x); setOffsetY(c.y); }}
                    className="flex-1 h-1.5 accent-primary"
                />
                <Button variant="outline" size="icon-sm" onClick={() => changeZoom(0.25)} disabled={zoom >= 5}>
                    <Icon icon="material-symbols:add-rounded" className="size-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{zoom.toFixed(2)}×</span>
            </div>
        </div>
    );
});

function CropModal({ open, onClose, onConfirm, dataUrl, targetRatio }: CropModalProps) {
    const controlsRef = useRef<CropControlsHandle>(null);

    return (
        <ModalDrawer
            open={open}
            onOpenChange={v => !v && onClose()}
            header="Adjust image"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => {
                        const c = controlsRef.current;
                        if (c) onConfirm(c.zoom, c.offsetX, c.offsetY);
                    }}>Apply</Button>
                </div>
            }
        >
            <CropControls ref={controlsRef} dataUrl={dataUrl} targetRatio={targetRatio} />
        </ModalDrawer>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

interface ImageInputProps {
    /** Current data-URL or remote URL to display. null/undefined = no image. */
    value?: string | null;
    /** Called with a data-URL when the user picks a new image. */
    onChange: (dataUrl: string) => void;
    /** aspect-ratio as CSS value e.g. "4/3". Defaults to "4/3". */
    aspectRatio?: string;
    /**
     * When true (default), opens a crop/zoom modal if the image ratio
     * doesn't match `aspectRatio`. If false, image is accepted as-is.
     */
    cropOnAspectMismatch?: boolean;
    /**
     * When true (default), strips image metadata (EXIF, ICC, etc.) by
     * redrawing onto a canvas. Animated GIFs are detected and kept
     * intact — metadata stripping is skipped for them to preserve
     * animation. Cropping animated GIFs is done frame-by-frame.
     */
    stripMetadata?: boolean;
    className?: string;
    alt?: string;
}

export function ImageInput({
    value,
    onChange,
    aspectRatio = '4/3',
    cropOnAspectMismatch = true,
    stripMetadata = true,
    className,
    alt = 'image',
}: ImageInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [imageError, setImageError] = useState(false);

    // crop modal state
    const [cropDataUrl, setCropDataUrl] = useState<string | null>(null);
    // Track whether the image currently in the crop modal is animated
    const cropIsAnimatedRef = useRef(false);
    const targetRatio = parseRatio(aspectRatio);

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        const rawDataUrl = await new Promise<string>((res) => {
            reader.onload = (e) => res(e.target!.result as string);
            reader.readAsDataURL(file);
        });

        // Detect animated GIF early (before any canvas processing)
        const animated = await isAnimatedGif(file, rawDataUrl);

        // Check whether the image ratio matches
        const needsCrop = await new Promise<boolean>((res) => {
            const img = new window.Image();
            img.onload = () => {
                const ratio = img.naturalWidth / img.naturalHeight;
                res(Math.abs(ratio - targetRatio) > 0.02);
            };
            img.onerror = () => res(false);
            img.src = rawDataUrl;
        });

        if (cropOnAspectMismatch && needsCrop) {
            // Open crop modal — for animated GIFs the actual crop is deferred to handleCropConfirm
            cropIsAnimatedRef.current = animated;
            setCropDataUrl(rawDataUrl);
        } else if (animated) {
            // Animated GIF with matching ratio: keep original (canvas processing kills animation)
            setImageError(false);
            onChange(rawDataUrl);
        } else {
            const result = stripMetadata ? await stripMetadataFromDataUrl(rawDataUrl) : rawDataUrl;
            setImageError(false);
            onChange(result);
        }
    }, [targetRatio, cropOnAspectMismatch, stripMetadata, onChange]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const handleCropConfirm = useCallback(async (zoom: number, offsetX: number, offsetY: number) => {
        if (!cropDataUrl) return;

        let result: string;
        if (cropIsAnimatedRef.current) {
            // Frame-by-frame animated GIF crop — preserves all frames and delays
            result = await cropAnimatedGif(cropDataUrl, targetRatio, zoom, offsetX, offsetY);
        } else {
            const cropped = await cropDataUrl_(cropDataUrl, targetRatio, zoom, offsetX, offsetY);
            result = stripMetadata ? await stripMetadataFromDataUrl(cropped) : cropped;
        }

        cropIsAnimatedRef.current = false;
        setCropDataUrl(null);
        setImageError(false);
        onChange(result);
    }, [cropDataUrl, targetRatio, stripMetadata, onChange]);

    const hasSrc = !imageError && !!value;

    return (
        <>
            <div
                className={cn(
                    'relative overflow-hidden rounded-lg border-2 border-dashed cursor-pointer transition-all group',
                    'bg-muted/30 hover:bg-muted/50',
                    dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50',
                    className,
                )}
                style={{ aspectRatio }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDrop={handleDrop}
            >
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

                {/* Image */}
                {hasSrc ? (
                    <Image
                        src={value!}
                        alt={alt}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground select-none">
                        <Icon icon="material-symbols:image-rounded" className="size-8" />
                        <span className="text-sm font-medium">No image</span>
                    </div>
                )}

                {/* Drop overlay */}
                {dragging && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-primary-foreground">
                        <Icon icon="material-symbols:upload-rounded" className="size-8" />
                        <span className="text-sm font-semibold">Drop to upload</span>
                    </div>
                )}

                {/* Hover overlay */}
                {!dragging && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        <Icon icon="material-symbols:upload-rounded" className="size-6 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Click or drag to upload</span>
                    </div>
                )}
            </div>

            {/* Crop modal (dialog desktop / drawer mobile) */}
            {cropDataUrl && (
                <CropModal
                    open={!!cropDataUrl}
                    onClose={() => setCropDataUrl(null)}
                    onConfirm={handleCropConfirm}
                    dataUrl={cropDataUrl}
                    targetRatio={targetRatio}
                />
            )}
        </>
    );
}
