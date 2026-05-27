'use client';

import { useEffect, useState } from 'react';
import { localeFlagUrl } from '@/lib/languages';
import { RESOURCES } from '@/lib/i18n/constants';

export interface LanguageOption {
    code: string;
    name: string;
    flag: string | null;
}

export function useLanguage(): LanguageOption[] {
    const [options, setOptions] = useState<LanguageOption[]>(
        Object.entries(RESOURCES)
            .map(([code, locale]) => ({
                code,
                name: locale.translation.language,
                flag: null,
            }))
    );

    useEffect(() => {
        Promise.all(
            Object.entries(RESOURCES)
                .map(async ([code, locale]) => ({
                    code,
                    name: locale.translation.language,
                    flag: await localeFlagUrl(locale.translation.cca),
                }))
        ).then(setOptions);
    }, []);

    return options;
}
