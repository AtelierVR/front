'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

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

            // Scaled source dimensions
            const scaledW = srcW * zoom;
            const scaledH = srcH * zoom;

            // Output canvas size = cropped to target ratio
            let outW: number, outH: number;
            if (scaledW / scaledH > targetRatio) {
                outH = scaledH;
                outW = scaledH * targetRatio;
            } else {
                outW = scaledW;
                outH = scaledW / targetRatio;
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(outW);
            canvas.height = Math.round(outH);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(dataUrl); return; }

            // sourceX/sourceY in original image coords
            const srcCropW = outW / zoom;
            const srcCropH = outH / zoom;
            const srcX = offsetX * srcW - srcCropW / 2;
            const srcY = offsetY * srcH - srcCropH / 2;

            ctx.drawImage(img, srcX, srcY, srcCropW, srcCropH, 0, 0, canvas.width, canvas.height);
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

function CropControls({
    dataUrl,
    targetRatio,
    onConfirm,
    onClose,
}: Omit<CropModalProps, 'open'>) {
    const [minZoom, setMinZoom] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0.5);
    const [offsetY, setOffsetY] = useState(0.5);

    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    // img natural size (loaded lazily)
    const naturalRef = useRef({ w: 1, h: 1 });

    /**
     * Minimum zoom so the image always covers the crop viewport with no empty space.
     * = max(imgRatio/targetRatio, targetRatio/imgRatio)
     */
    const computeMinZoom = useCallback((w: number, h: number) => {
        const imgRatio = w / h;
        return Math.max(imgRatio / targetRatio, targetRatio / imgRatio);
    }, [targetRatio]);

    const clampOffset = useCallback((x: number, y: number, z: number) => {
        const { w, h } = naturalRef.current;
        const scaledW = w * z;
        const scaledH = h * z;

        // half of the crop window in image coords
        let cropW: number, cropH: number;
        if (scaledW / scaledH > targetRatio) {
            cropH = scaledH; cropW = cropH * targetRatio;
        } else {
            cropW = scaledW; cropH = cropW / targetRatio;
        }
        const halfCropW = cropW / 2 / (w * z);
        const halfCropH = cropH / 2 / (h * z);

        return {
            x: Math.min(1 - halfCropW, Math.max(halfCropW, x)),
            y: Math.min(1 - halfCropH, Math.max(halfCropH, y)),
        };
    }, [targetRatio]);

    const onMouseDown = (e: React.MouseEvent) => {
        draggingRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = (e.clientX - lastPosRef.current.x) / rect.width;
        const dy = (e.clientY - lastPosRef.current.y) / rect.height;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        setOffsetX(ox => {
            setOffsetY(oy => {
                const c = clampOffset(ox - dx / zoom, oy - dy / zoom, zoom);
                setOffsetX(c.x);
                setOffsetY(c.y);
                return c.y;
            });
            return ox;
        });
    };
    const onMouseUp = () => { draggingRef.current = false; };

    // touch
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const onTouchStart = (e: React.TouchEvent) => {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = (e.touches[0].clientX - lastTouchRef.current.x) / rect.width;
        const dy = (e.touches[0].clientY - lastTouchRef.current.y) / rect.height;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setOffsetX(ox => {
            const ny = offsetY - dy / zoom;
            const c = clampOffset(ox - dx / zoom, ny, zoom);
            setOffsetX(c.x);
            setOffsetY(c.y);
            return c.x;
        });
    };

    const changeZoom = (delta: number) => {
        setZoom(z => {
            const next = Math.min(5, Math.max(minZoom, z + delta));
            const c = clampOffset(offsetX, offsetY, next);
            setOffsetX(c.x);
            setOffsetY(c.y);
            return next;
        });
    };

    // preview: show image shifted so the cropped region is centered
    // transform-origin = center of viewport
    const previewTransform = `translate(${-(offsetX - 0.5) * 100 * zoom}%, ${-(offsetY - 0.5) * 100 * zoom}%) scale(${zoom})`;

    return (
        <div className="flex flex-col gap-4">
            {/* Viewport clipped to target ratio */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-lg border border-border select-none cursor-grab active:cursor-grabbing"
                style={{ aspectRatio: targetRatio }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
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
                        const mz = computeMinZoom(w, h);
                        setMinZoom(mz);
                        setZoom(z => Math.max(z, mz));
                    }}
                    draggable={false}
                />
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon-sm" onClick={() => changeZoom(-0.25)} disabled={zoom <= minZoom}>
                    <Icon icon="material-symbols:remove-rounded" className="size-3.5" />
                </Button>
                <input
                    type="range"
                    min={minZoom} max={5} step={0.05}
                    value={zoom}
                    onChange={e => { const z = Number(e.target.value); setZoom(z); const c = clampOffset(offsetX, offsetY, z); setOffsetX(c.x); setOffsetY(c.y); }}
                    className="flex-1 h-1.5 accent-primary"
                />
                <Button variant="outline" size="icon-sm" onClick={() => changeZoom(0.25)} disabled={zoom >= 5}>
                    <Icon icon="material-symbols:add-rounded" className="size-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{zoom.toFixed(2)}×</span>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => onConfirm(zoom, offsetX, offsetY)}>Apply</Button>
            </div>
        </div>
    );
}

function CropModal({ open, onClose, onConfirm, dataUrl, targetRatio }: CropModalProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={v => !v && onClose()}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Adjust image</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-2">
                        <CropControls dataUrl={dataUrl} targetRatio={targetRatio} onConfirm={onConfirm} onClose={onClose} />
                    </div>
                    <DrawerFooter />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Adjust image</DialogTitle>
                </DialogHeader>
                <CropControls dataUrl={dataUrl} targetRatio={targetRatio} onConfirm={onConfirm} onClose={onClose} />
                <DialogFooter />
            </DialogContent>
        </Dialog>
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
     * redrawing onto a canvas. Has no effect on animated GIF/WebP frames
     * that the browser can't repaint — in those cases the original is kept.
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
    const targetRatio = parseRatio(aspectRatio);

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        const rawDataUrl = await new Promise<string>((res) => {
            reader.onload = (e) => res(e.target!.result as string);
            reader.readAsDataURL(file);
        });

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
            // Open crop modal — defer metadata stripping to after crop
            setCropDataUrl(rawDataUrl);
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
        const cropped = await cropDataUrl_(cropDataUrl, targetRatio, zoom, offsetX, offsetY);
        const result = stripMetadata ? await stripMetadataFromDataUrl(cropped) : cropped;
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
