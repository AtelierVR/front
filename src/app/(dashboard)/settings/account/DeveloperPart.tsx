'use client';

import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

interface DeveloperPartProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

/**
 * Advanced mode (`usr:developer`): reveals tags that have no display handler and
 * extra internal information across the app.
 */
export function DeveloperPart({ enabled, onChange }: DeveloperPartProps) {
    const { t } = useTranslation();

    return (
        <section id="developer" className="space-y-2">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold">{t('settings.account.developer.title')}</h2>
                <Switch checked={enabled} onCheckedChange={onChange} />
            </div>
            <p className="text-sm text-muted-foreground">{t('settings.account.developer.description')}</p>
        </section>
    );
}
