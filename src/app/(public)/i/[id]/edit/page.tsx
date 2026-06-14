'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InstanceEditRedirect() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    useEffect(() => { router.replace(`/i/${id}`); }, [id, router]);
    return null;
}

