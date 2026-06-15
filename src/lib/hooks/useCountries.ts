'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Countries, type Country } from '@/lib/countries';

export function useCountries() {
    const { i18n } = useTranslation();
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        Countries.get(i18n.language)
            .then(setCountries)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [i18n.language]);

    return { countries, loading, error };
}
