'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAvatar } from '@/components/features/avatars/AvatarContext';
import { updateAvatar, uploadAvatarThumbnail } from '@/lib/api/avatars';
import { useApi } from '@/lib/api/context';
import {
    InputGroup,
    InputGroupInput,
} from '@/components/ui/input-group';
import { TextInput } from '@/components/ui/text-input';
import { Button } from '@/components/ui/button';
import { ImageInput } from '@/components/ui/image-input';
import { MarkdownAreaInput } from '@/components/ui/markdown-area-input';
import { UserListInput } from '@/components/ui/user-list-input';
import { ApiError } from '@/types/envelope';
import { Icon } from '@iconify/react';

// ── Flags ────────────────────────────────────────────────────────────────────
const F_LOADING      = 1 << 0;
const F_THUMBNAIL    = 1 << 1;
const F_TITLE        = 1 << 2;
const F_DESCRIPTION  = 1 << 3;
const F_RELEASE      = 1 << 4;
const F_CONTRIBUTORS = 1 << 5;
const F_NAME         = 1 << 6;

export default function AvatarEditPage() {
    const { t } = useTranslation();
    const { avatar, isOwner, isContributor, refresh } = useAvatar();
    const { currentUser } = useApi();

    const canEdit = isOwner || isContributor;

    // ── Field state ───────────────────────────────────────────────────────────
    const [flags, setFlags] = useState(0);
    const [name, setName] = useState<string | undefined>();
    const [title, setTitle] = useState<string | undefined>();
    const [description, setDescription] = useState<string | undefined>();
    const [release, setRelease] = useState<string | undefined>();
    const [thumbnail, setThumbnail] = useState<string | null | undefined>();
    const [contributors, setContributors] = useState<string[] | undefined>();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Reset local state when the avatar changes
    useEffect(() => {
        setName(undefined);
        setTitle(undefined);
        setDescription(undefined);
        setRelease(undefined);
        setThumbnail(undefined);
        setContributors(undefined);
        setFlags(0);
    }, [avatar?.id]);

    if (!canEdit) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <Icon icon="material-symbols:error-rounded" className="size-4 shrink-0" />
                {t('avatar.edit_no_permission', 'You don\'t have permission to edit this avatar.')}
            </div>
        );
    }

    if (!avatar) return null;

    const isSaving = (flags & F_LOADING) !== 0;
    const isDirty = (flags & ~F_LOADING) !== 0;
    const canSave = isDirty && !isSaving;

    const currentContributors = contributors ?? avatar.contributors;

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!avatar || !canSave) return;
        setFlags(f => f | F_LOADING);
        setError(null);
        setSuccess(false);
        try {
            await updateAvatar(avatar.id, {
                name: (flags & F_NAME) ? (name?.trim() || null) : undefined,
                title: (flags & F_TITLE) ? (title?.trim() || undefined) : undefined,
                description: (flags & F_DESCRIPTION) ? (description?.trim() || null) : undefined,
                release: (flags & F_RELEASE)
                    ? (release === '' || release === '-1' ? null : Number(release))
                    : undefined,
                contributors: (flags & F_CONTRIBUTORS) ? contributors : undefined,
            });

            if ((flags & F_THUMBNAIL) && thumbnail) {
                const blob = await fetch(thumbnail).then(r => r.blob());
                await uploadAvatarThumbnail(avatar.id, blob);
                setThumbnail(undefined);
            }

            setName(undefined);
            setTitle(undefined);
            setRelease(undefined);
            setContributors(undefined);
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
        <div className="space-y-8">
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
                    {t('avatar.edit_saved', 'Changes saved successfully.')}
                </div>
            )}

            {/* Short name */}
            {isOwner && (
                <section id="name" className="space-y-2">
                    <h2 className="text-base font-semibold">{t('avatar.field_name', 'Short Name')}</h2>
                    <p className="text-sm text-muted-foreground">{t('avatar.field_name_desc', 'Unique identifier used in URLs. 3–8 characters: lowercase letters, digits, hyphens, underscores, or dots.')}</p>
                    <TextInput
                        value={name ?? (avatar.name ?? '')}
                        onChange={v => { setName(v); setFlags(f => f | F_NAME); }}
                        placeholder={avatar.name ?? 'shortname'}
                        pattern={/^[a-z0-9._-]*$/}
                        minLength={3}
                        maxLength={8}
                    />
                </section>
            )}

            {/* Title */}
            <section id="title" className="space-y-2">
                <h2 className="text-base font-semibold">{t('avatar.field_title', 'Title')}</h2>
                <TextInput
                    value={title ?? (avatar.title ?? '')}
                    onChange={v => { setTitle(v); setFlags(f => f | F_TITLE); }}
                    placeholder={avatar.title || t('avatar.field_title_placeholder', 'Avatar title')}
                    maxLength={128}
                />
            </section>

            {/* Thumbnail */}
            <section id="thumbnail" className="space-y-2">
                <h2 className="text-base font-semibold">{t('avatar.field_thumbnail', 'Thumbnail')}</h2>
                <p className="text-sm text-muted-foreground">{t('avatar.field_thumbnail_desc', '512×512px — 1:1')}</p>
                <ImageInput
                    value={thumbnail ?? avatar.thumbnail}
                    onChange={dataUrl => { setThumbnail(dataUrl); setFlags(f => f | F_THUMBNAIL); }}
                    alt={avatar.title}
                    aspectRatio="1/1"
                    className="w-full max-w-xs"
                />
            </section>

            {/* Description */}
            <section id="description" className="space-y-2">
                <h2 className="text-base font-semibold">{t('avatar.field_description', 'Description')}</h2>
                <MarkdownAreaInput
                    value={description ?? (avatar.description ?? '')}
                    onChange={v => { setDescription(v); setFlags(f => f | F_DESCRIPTION); }}
                    placeholder={t('avatar.field_description_placeholder', 'Describe your avatar…')}
                    rows={8}
                />
            </section>

            {/* Release */}
            <section id="release" className="space-y-2">
                <h2 className="text-base font-semibold">{t('avatar.field_release', 'Release Version')}</h2>
                <p className="text-sm text-muted-foreground">{t('avatar.field_release_desc', 'Recommended release version index. Use -1 for automatic (latest).')}</p>
                <InputGroup>
                    <InputGroupInput
                        type="number"
                        value={release ?? (avatar.release != null ? String(avatar.release) : '-1')}
                        onChange={e => { setRelease(e.target.value); setFlags(f => f | F_RELEASE); }}
                        placeholder="-1"
                    />
                </InputGroup>
            </section>

            {/* Contributors */}
            <section id="contributors" className="space-y-2">
                <h2 className="text-base font-semibold">{t('avatar.field_contributors', 'Contributors')}</h2>
                <p className="text-sm text-muted-foreground">
                    {isOwner
                        ? t('avatar.field_contributors_desc_owner', 'People who can edit this avatar. Enter their NoxIdentifier (e.g. 42@nox.example) to add them.')
                        : t('avatar.field_contributors_desc', 'People who can edit this avatar.')}
                </p>
                <UserListInput
                    users={currentContributors}
                    editable={isOwner}
                    onChange={next => { setContributors(next); setFlags(f => f | F_CONTRIBUTORS); }}
                    emptyLabel={t('avatar.no_contributors', 'No contributors yet.')}
                />
            </section>

            {/* Save */}
            <div className="flex justify-end pb-4">
                <Button onClick={handleSave} disabled={!canSave}>
                    {isSaving
                        ? <><Icon icon="material-symbols:progress-activity" className="size-4 mr-2 animate-spin" />{t('avatar.saving', 'Saving…')}</>
                        : <><Icon icon="material-symbols:save-rounded" className="size-4 mr-2" />{t('avatar.save', 'Save Changes')}</>
                    }
                </Button>
            </div>
        </div>
    );
}
