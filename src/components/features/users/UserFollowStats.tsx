'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from './UserContext';
import { UserFollowModal } from './UserFollowModal';

type FollowMode = 'followers' | 'following';

function StatItem({ count, label, href, onClick }: { count: number; label: string; href?: string; onClick?: () => void }) {
    const className = "flex-1 text-center cursor-pointer hover:opacity-80 transition-opacity";
    const content = <>
        <p className="text-2xl font-bold font-heading">{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </>;

    if (href) return <Link href={href} className={className}>{content}</Link>;
    return <button onClick={onClick} className={className}>{content}</button>;
}

export function UserFollowStats() {
    const { user, isSame } = useUser();
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const [modal, setModal] = useState<FollowMode | null>(null);

    // Sync with URL hash so back/forward works
    useEffect(() => {
        const sync = () => {
            const h = window.location.hash.slice(1);
            setModal(h === 'followers' ? 'followers' : h === 'following' ? 'following' : null);
        };
        sync();
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, []);

    const openModal = (mode: FollowMode) => {
        setModal(mode);
        router.push(`${pathname}#${mode}`);
    };

    const closeModal = () => {
        setModal(null);
        router.replace(pathname);
    };

    if (!user)
        return <Card>
            <CardContent className="p-6">
                <div className="flex justify-around items-center">
                    {[0, 1].map((i) => (
                        <div key={i} className="text-center">
                            <div className="animate-pulse rounded-md bg-muted h-8 w-16 mx-auto mb-2" />
                            <div className="animate-pulse rounded-md bg-muted h-4 w-20 mx-auto" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>;

    if (user.followers === -1 && user.following === -1)
        return null;

    return <>
        <Card>
            <CardContent>
                <div className="flex items-center divide-x divide-border">
                    {user.followers > -1 && <StatItem
                        count={user.followers}
                        label={t('user.followers')}
                        href={isSame ? '/settings/relations?tab=followers' : undefined}
                        onClick={isSame ? undefined : () => openModal('followers')}
                    />}
                    {user.following > -1 && <StatItem
                        count={user.following}
                        label={t('user.following')}
                        href={isSame ? '/settings/relations?tab=following' : undefined}
                        onClick={isSame ? undefined : () => openModal('following')}
                    />}
                </div>
            </CardContent>
        </Card>

        {modal && (
            <UserFollowModal
                mode={modal}
                open={!!modal}
                onOpenChange={(open) => { if (!open) closeModal(); }}
            />
        )}
    </>;
}
