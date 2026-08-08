'use client';

import { useState, useEffect } from 'react';
import { Languages, type Language } from '@/lib/languages';

export function useLanguages() {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        Languages.get()
            .then((data: Language[]) => { if (!cancelled) { setLanguages(data); setLoading(false); } })
            .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    return { languages, loading, error };
}
