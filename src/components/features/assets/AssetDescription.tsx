'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { useTranslation } from 'react-i18next';
import { useAsset } from './AssetContext';

/** Description card of an asset: its markdown, or the kind's empty label. */
export function AssetDescription() {
    const { asset, kind, isOwner, isContributor } = useAsset();
    const { t } = useTranslation();
    const canEdit = isOwner || isContributor;

    // Generic keys: a kind served by the instance gets a page without needing
    // front code, its labels come from the `common` namespace.
    const empty = t('common.no_description', { defaultValue: '' });

    return (
        <Card className="group/card relative">
            {canEdit && asset && kind && (
                <Link href={`/${kind.key}/${asset.id}/edit#description`} className="absolute top-3 right-3 z-10">
                    <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <Icon icon="material-symbols:edit-rounded" className="size-4" />
                    </Button>
                </Link>
            )}
            <CardContent>
                {!asset ? (
                    <div className="space-y-2">
                        {[60, 80, 40].map((width, index) => (
                            <div key={index} style={{ inlineSize: `${width}%` }} className="animate-pulse rounded-sm bg-muted h-3" />
                        ))}
                    </div>
                ) : asset.description ? (
                    <MarkdownRenderer content={asset.description} />
                ) : empty ? (
                    <p className="text-sm text-muted-foreground italic">{empty}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}
