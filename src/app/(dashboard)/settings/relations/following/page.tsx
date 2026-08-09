'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FollowingRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/settings/relations?tab=following'); }, [router]);
    return null;
}
