'use client';

import { useState, useEffect } from 'react';
import { countriesService, type Country } from '@/lib/countries';

export function useCountries() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        countriesService.get()
            .then(data => { if (!cancelled) { setCountries(data); setLoading(false); } })
            .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    return { countries, loading, error };
}
