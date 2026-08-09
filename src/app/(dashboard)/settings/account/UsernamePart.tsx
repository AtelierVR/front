'use client';

import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText } from '@/components/ui/input-group';
import { useApi } from '@/lib/api/context';
import { useTranslation } from 'react-i18next';

interface UsernamePartProps {
    username: string | undefined;
    onChange: (value: string) => void;
    onDirty: () => void;
}

export function UsernamePart({ username, onChange, onDirty }: UsernamePartProps) {
    const { t } = useTranslation();
    const { currentUser } = useApi();
    const server = currentUser?.server || '';

    return (
        <section id="username" className="space-y-2">
            <h2 className="text-base font-semibold">{t('settings.account.username.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.account.username.description')}</p>
            <InputGroup>
                <InputGroupInput
                    value={username ?? currentUser?.username ?? ''}
                    onChange={e => { onChange(e.target.value); onDirty(); }}
                    placeholder={currentUser?.username}
                    maxLength={32}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupText>@{server}</InputGroupText>
                </InputGroupAddon>
            </InputGroup>
        </section>
    );
}
