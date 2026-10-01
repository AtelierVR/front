'use client';

import { TagListInput } from '@/components/ui/tag-list-input';
import { useTranslation } from 'react-i18next';

interface TagsPartProps {
    tags: string[];
    onChange: (tags: string[]) => void;
}

export function TagsPart({ tags, onChange }: TagsPartProps) {
    const { t } = useTranslation();

    return (
        <section id="tags" className="space-y-2">
            <h2 className="text-base font-semibold">{t('settings.account.tags.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.account.tags.description')}</p>
            <TagListInput
                tags={tags}
                onChange={onChange}
            />
            <p className="text-xs text-muted-foreground">{t('settings.profile.tags.hint')}</p>
        </section>
    );
}
