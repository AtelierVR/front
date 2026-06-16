'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorld } from '@/components/features/worlds/WorldContext';
import { updateWorld, uploadWorldThumbnail } from '@/lib/api/worlds';
import { useApi } from '@/lib/api/context';
import {
    InputGroup,
    InputGroupInput,
} from '@/components/ui/input-group';
import { TextInput } from '@/components/ui/text-input';
import { Button } from '@/components/ui/button';
import { ImageInput } from '@/components/ui/image-input';
import { MarkdownAreaInput } from '@/components/ui/markdown-area-input';
import { TagListInput } from '@/components/ui/tag-list-input';
import { UserListInput } from '@/components/ui/user-list-input';
import { ApiError } from '@/types/envelope';
import { releaseVersion, releaseIsAuto } from '@/types/api';
import { Icon } from '@iconify/react';

// ── Flags ────────────────────────────────────────────────────────────────────
const F_LOADING      = 1 << 0;
const F_THUMBNAIL    = 1 << 1;
const F_TITLE        = 1 << 2;
const F_DESCRIPTION  = 1 << 3;
const F_CAPACITY     = 1 << 4;
const F_RELEASE      = 1 << 5;
const F_CONTRIBUTORS = 1 << 6;
const F_TAGS         = 1 << 7;
const F_NAME         = 1 << 8;

export function WorldEditForm() {
    const { t } = useTranslation();
    const { world, isOwner, isContributor, refresh } = useWorld();
    const { currentUser } = useApi();

    const canEdit = isOwner || isContributor;

    // ── Field state ───────────────────────────────────────────────────────────
    const [flags, setFlags] = useState(0);
    const [name, setName] = useState<string | undefined>();
    const [title, setTitle] = useState<string | undefined>();
    const [description, setDescription] = useState<string | undefined>();
    const [capacity, setCapacity] = useState<string | undefined>();
    const [release, setRelease] = useState<string | undefined>();
    const [thumbnail, setThumbnail] = useState<string | null | undefined>();
    const [contributors, setContributors] = useState<string[] | undefined>();
    const [tags, setTags] = useState<string[] | undefined>();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Reset local state when the world changes
    useEffect(() => {
        setName(undefined);
        setTitle(undefined);
        setDescription(undefined);
        setCapacity(undefined);
        setRelease(undefined);
        setThumbnail(undefined);
        setContributors(undefined);
        setTags(undefined);
        setFlags(0);
    }, [world?.id]);

    if (!canEdit) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <Icon icon="material-symbols:error-rounded" className="size-4 shrink-0" />
                {t('world.edit_no_permission', 'You don\'t have permission to edit this world.')}
            </div>
        );
    }

    if (!world) return null;

    const isSaving = (flags & F_LOADING) !== 0;
    const isDirty = (flags & ~F_LOADING) !== 0;
    const canSave = isDirty && !isSaving;

    const currentContributors = contributors ?? world.contributors;
    const currentTags = tags ?? world.tags ?? [];

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!world || !canSave) return;
        setFlags(f => f | F_LOADING);
        setError(null);
        setSuccess(false);
        try {
            await updateWorld(world.id, {
                name: (flags & F_NAME) ? (name?.trim() || null) : undefined,
                title: (flags & F_TITLE) ? (title?.trim() || undefined) : undefined,
                description: (flags & F_DESCRIPTION) ? (description?.trim() || null) : undefined,
                capacity: (flags & F_CAPACITY) && capacity !== '' ? Number(capacity) : undefined,
                release: (flags & F_RELEASE)
                    ? (release === '' || release === '-1' ? null : Number(release))
                    : undefined,
                contributors: (flags & F_CONTRIBUTORS) ? contributors : undefined,
                tags: (flags & F_TAGS) ? tags : undefined,
            });

            if ((flags & F_THUMBNAIL) && thumbnail) {
                const blob = await fetch(thumbnail).then(r => r.blob());
                await uploadWorldThumbnail(world.id, blob);
                setThumbnail(undefined);
            }

            setName(undefined);
            setTitle(undefined);
            setCapacity(undefined);
            setRelease(undefined);
            setContributors(undefined);
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
                    {t('world.edit_saved', 'Changes saved successfully.')}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {/* Left column */}
                <div className="flex flex-col gap-5">
                    {isOwner && (
                        <section className="space-y-2">
                            <h2 className="text-base font-semibold">{t('world.field_name', 'Short Name')}</h2>
                            <p className="text-sm text-muted-foreground">{t('world.field_name_desc', 'Unique identifier used in URLs. 3–8 characters: lowercase letters, digits, hyphens, underscores, or dots.')}</p>
                            <TextInput
                                value={name ?? (world.name ?? '')}
                                onChange={v => { setName(v); setFlags(f => f | F_NAME); }}
                                placeholder={world.name ?? 'shortname'}
                                pattern={/^[a-z0-9._-]*$/}
                                minLength={3}
                                maxLength={8}
                            />
                        </section>
                    )}

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_title', 'Title')}</h2>
                        <TextInput
                            value={title ?? (world.title ?? '')}
                            onChange={v => { setTitle(v); setFlags(f => f | F_TITLE); }}
                            placeholder={world.title || t('world.field_title_placeholder', 'World title')}
                            maxLength={128}
                        />
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_description', 'Description')}</h2>
                        <MarkdownAreaInput
                            value={description ?? (world.description ?? '')}
                            onChange={v => { setDescription(v); setFlags(f => f | F_DESCRIPTION); }}
                            placeholder={t('world.field_description_placeholder', 'Describe your world…')}
                            rows={8}
                        />
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_contributors', 'Contributors')}</h2>
                        <p className="text-sm text-muted-foreground">
                            {isOwner
                                ? t('world.field_contributors_desc_owner', 'People who can edit this world. Enter their NoxIdentifier (e.g. 42@nox.example) to add them.')
                                : t('world.field_contributors_desc', 'People who can edit this world.')}
                        </p>
                        <UserListInput
                            users={currentContributors}
                            editable={isOwner}
                            onChange={next => { setContributors(next); setFlags(f => f | F_CONTRIBUTORS); }}
                            emptyLabel={t('world.no_contributors', 'No contributors yet.')}
                        />
                    </section>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-5">
                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_thumbnail', 'Thumbnail')}</h2>
                        <p className="text-sm text-muted-foreground">{t('world.field_thumbnail_desc', '1024×768px — 4:3')}</p>
                        <ImageInput
                            value={thumbnail ?? world.thumbnail}
                            onChange={dataUrl => { setThumbnail(dataUrl); setFlags(f => f | F_THUMBNAIL); }}
                            alt={world.title}
                            aspectRatio="4/3"
                            className="w-full"
                        />
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_capacity', 'Capacity')}</h2>
                        <p className="text-sm text-muted-foreground">{t('world.field_capacity_desc', 'Maximum number of simultaneous players. Zero for unlimited.')}</p>
                        <InputGroup>
                            <InputGroupInput
                                type="number"
                                value={capacity ?? (world.capacity != null ? String(world.capacity) : '')}
                                onChange={e => { setCapacity(e.target.value); setFlags(f => f | F_CAPACITY); }}
                                placeholder={t('world.field_capacity_placeholder', 'Unlimited')}
                                min={0}
                            />
                        </InputGroup>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_release', 'Release Version')}</h2>
                        <p className="text-sm text-muted-foreground">{t('world.field_release_desc', 'Recommended release version index. Use -1 for automatic (latest).')}</p>
                        <InputGroup>
                            <InputGroupInput
                                type="number"
                                value={release ?? (!releaseIsAuto(world.release) ? String(releaseVersion(world.release)) : '-1')}
                                onChange={e => { setRelease(e.target.value); setFlags(f => f | F_RELEASE); }}
                                placeholder="-1"
                            />
                        </InputGroup>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold">{t('world.field_tags', 'Tags')}</h2>
                        <p className="text-sm text-muted-foreground">{t('world.field_tags_desc', 'User-defined tags for this world (only usr:* tags).')}</p>
                        <TagListInput
                            tags={currentTags}
                            onChange={next => { setTags(next); setFlags(f => f | F_TAGS); }}
                        />
                    </section>
                </div>
            </div>

            {/* Save */}
            <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
                <Button onClick={handleSave} disabled={!canSave} className="w-full sm:w-auto">
                    {isSaving
                        ? <><Icon icon="material-symbols:progress-activity" className="size-4 mr-2 animate-spin" />{t('world.saving', 'Saving…')}</>
                        : <><Icon icon="material-symbols:save-rounded" className="size-4 mr-2" />{t('world.save', 'Save Changes')}</>
                    }
                </Button>
            </div>
        </div>
    );
}
