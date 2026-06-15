'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, type Language } from '@/lib/languages';

export function useLanguages() {
    const { i18n } = useTranslation();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        Languages.get(i18n.language)
            .then(setLanguages)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [i18n.language]);

    return { languages, loading, error };
}
