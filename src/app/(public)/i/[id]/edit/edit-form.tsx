'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstance } from '@/components/features/instances/InstanceContext';
import { updateInstance, uploadInstanceThumbnail } from '@/lib/api/instances';
import { TextInput } from '@/components/ui/text-input';
import { MarkdownAreaInput } from '@/components/ui/markdown-area-input';
import { TagListInput } from '@/components/ui/tag-list-input';
import { ImageInput } from '@/components/ui/image-input';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { ApiError } from '@/types/envelope';

// ── Flags ─────────────────────────────────────────────────────────────────────
const F_LOADING = 1 << 0;
const F_THUMBNAIL = 1 << 1;
const F_TITLE = 1 << 2;
const F_DESCRIPTION = 1 << 3;
const F_CAPACITY = 1 << 4;
const F_TAGS = 1 << 5;

export function InstanceEditForm({ onDeleteRequest }: { onDeleteRequest?: () => void }) {
    const { t } = useTranslation();
    const { instance, isOwner, refresh } = useInstance();

    const [flags, setFlags] = useState(0);
    const [title, setTitle] = useState<string | undefined>();
    const [description, setDescription] = useState<string | undefined>();
    const [capacity, setCapacity] = useState<string | undefined>();
    const [thumbnail, setThumbnail] = useState<string | null | undefined>();
    const [tags, setTags] = useState<string[] | undefined>();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Reset when instance changes
    useEffect(() => {
        setTitle(undefined);
        setDescription(undefined);
        setCapacity(undefined);
        setThumbnail(undefined);
        setTags(undefined);
        setFlags(0);
    }, [instance?.id]);

    if (!isOwner)
        return <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <Icon icon="material-symbols:error-rounded" className="size-4 shrink-0" />
            {t('instance.edit_no_permission')}
        </div>;

    if (!instance) return null;

    const isSaving = (flags & F_LOADING) !== 0;
    const isDirty = (flags & ~F_LOADING) !== 0;
    const canSave = isDirty && !isSaving;

    const currentTags = tags ?? instance.tags ?? [];

    const handleSave = async () => {
        if (!instance || !canSave) return;
        setFlags(f => f | F_LOADING);
        setError(null);
        setSuccess(false);
        try {
            await updateInstance(instance.id, {
                title: (flags & F_TITLE) ? (title?.trim() || undefined) : undefined,
                description: (flags & F_DESCRIPTION) ? (description?.trim() || undefined) : undefined,
                capacity: (flags & F_CAPACITY) && capacity !== '' ? Number(capacity) : undefined,
                tags: (flags & F_TAGS) ? tags : undefined,
            });

            if ((flags & F_THUMBNAIL) && thumbnail?.startsWith('data:')) {
                const blob = await fetch(thumbnail).then(r => r.blob());
                await uploadInstanceThumbnail(instance.id, blob);
                setThumbnail(undefined);
            }

            setTitle(undefined);
            setDescription(undefined);
            setCapacity(undefined);
            setTags(undefined);
            setFlags(0);
            setSuccess(true);
            refresh();
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'An error occurred');
            setFlags(f => f & ~F_LOADING);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Feedback */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <Icon icon="material-symbols:error-rounded" className="size-4 shrink-0" />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    <Icon icon="material-symbols:check-circle-rounded" className="size-4 shrink-0" />
                    {t('instance.save_success')}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {/* Left column */}
                <div className="flex flex-col gap-5">
                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('instance.field_title')}</h2>
                        <TextInput
                            value={title ?? (instance.title ?? '')}
                            onChange={v => { setTitle(v); setFlags(f => f | F_TITLE); }}
                            placeholder={instance.title || t('instance.field_title_placeholder')}
                            maxLength={128}
                        />
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('instance.field_description')}</h2>
                        <MarkdownAreaInput
                            value={description ?? (instance.description ?? '')}
                            onChange={v => { setDescription(v); setFlags(f => f | F_DESCRIPTION); }}
                            placeholder={t('instance.field_description_placeholder')}
                            rows={8}
                        />
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('instance.field_tags')}</h2>
                        <TagListInput
                            tags={currentTags}
                            onChange={next => { setTags(next); setFlags(f => f | F_TAGS); }}
                        />
                    </section>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-5">
                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('instance.field_thumbnail')}</h2>
                        <p className="text-sm text-muted-foreground">{t('instance.field_thumbnail_desc')}</p>
                        <ImageInput
                            value={thumbnail !== undefined ? thumbnail : instance.thumbnail}
                            onChange={dataUrl => { setThumbnail(dataUrl); setFlags(f => f | F_THUMBNAIL); }}
                            alt={instance.title}
                            aspectRatio="4/3"
                            className="w-full"
                        />
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('instance.field_capacity')}</h2>
                        <p className="text-sm text-muted-foreground">{t('instance.field_capacity_desc')}</p>
                        <InputGroup>
                            <InputGroupInput
                                type="number"
                                value={capacity ?? (instance.capacity != null ? String(instance.capacity) : '0')}
                                onChange={e => { setCapacity(e.target.value); setFlags(f => f | F_CAPACITY); }}
                                placeholder="0"
                                min={0}
                                max={65535}
                            />
                        </InputGroup>
                    </section>
                </div>
            </div>

            {/* Save */}
            <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row">
                {isOwner && (
                    <Button variant="destructive" className="flex-0" onClick={onDeleteRequest} disabled={isSaving}>
                        <Icon icon="material-symbols:delete-rounded" className="size-4 mr-2" />
                        {t('instance.delete', 'Delete')}
                    </Button>
                )}
                <Button onClick={handleSave} disabled={!canSave} className="flex-1">
                    {isSaving
                        ? <><Icon icon="material-symbols:progress-activity" className="size-4 mr-2 animate-spin" />{t('instance.saving')}</>
                        : <><Icon icon="material-symbols:save-rounded" className="size-4 mr-2" />{t('instance.save')}</>
                    }
                </Button>
            </div>
        </div>
    );
}
