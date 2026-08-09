'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FollowersRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/settings/relations?tab=followers'); }, [router]);
    return null;
}
