'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function WorldEditRedirect() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    useEffect(() => { router.replace(`/w/${id}`); }, [id, router]);
    return null;
}
