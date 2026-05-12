'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from './UserContext';
import Link from 'next/link';

function StatItem({ count, label, href }: { count: number; label: string; href: string }) {
    return <Link href={href} className="flex-1 text-center cursor-pointer">
        <p className="text-2xl font-bold font-heading ">{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Link>;
}

export function UserFollowStats() {
    const { user } = useUser();
    const { t } = useTranslation();

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

    return <Card>
        <CardContent>
            <div className="flex items-center divide-x divide-border">
                {user.followers > -1 && <StatItem
                    count={user.followers}
                    label={t('user.followers')}
                    href={`/u/${user.username}/followers`}
                />}
                {user.following > -1 && <StatItem
                    count={user.following}
                    label={t('user.following')}
                    href={`/u/${user.username}/following`}
                />}
            </div>
        </CardContent>
    </Card>;
}
