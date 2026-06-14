'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AvatarEditRedirect() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    useEffect(() => { router.replace(`/a/${id}`); }, [id, router]);
    return null;
}
