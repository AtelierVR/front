'use client';

import { useState, useEffect } from 'react';
import { languagesService, type Language } from '@/lib/languages-data';

export function useLanguages() {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        languagesService.get()
            .then(data => { if (!cancelled) { setLanguages(data); setLoading(false); } })
            .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    return { languages, loading, error };
}
