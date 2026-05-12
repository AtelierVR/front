'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import type { ApiCurrentUser } from '@/types/api';

function initials(user: ApiCurrentUser) {
    return (user.display || user.username).replace(/[^a-zA-Z ]/g, '').split(' ').map(n => n[0]).join('').toUpperCase();
}

interface UserNavMenuProps {
    user: ApiCurrentUser;
    onLogout: () => void;
}

export function UserNavMenu({ user, onLogout }: UserNavMenuProps) {
    const profileHref = user.alias?.find(a => a.key === 'profile')?.value || `/u/${user.username}`;

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-full p-0',
            )}>
                <Avatar>
                    <AvatarImage src={user.thumbnail ?? undefined} alt={user.display || user.username} />
                    <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">{initials(user)}</AvatarFallback>
                </Avatar>
            </NavigationMenuTrigger>

            <NavigationMenuContent>
                {/*
                 * AABBCC
                 * AADDEE
                 * AA = profile card (row-span-2)
                 * BB CC / DD EE = action cards
                 */}
                <div className="container mx-auto max-w-screen-xl px-4 py-3">
                    <div className="grid grid-cols-3 gap-2 w-full">
                    {/* AA - Profile (row-span-2) */}
                    <NavigationMenuLink asChild>
                        <Link
                            href={profileHref}
                            className="row-span-2 flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-3 hover:bg-accent/80 hover:text-accent-foreground text-center transition-colors"
                        >
                            <Avatar className="size-10">
                                <AvatarImage src={user.thumbnail ?? undefined} alt={user.display || user.username} />
                                <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">{initials(user)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 w-full">
                                <p className="text-sm font-semibold truncate">{user.display || user.username}</p>
                                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                            </div>
                        </Link>
                    </NavigationMenuLink>

                    {/* BB - Messages */}
                    <NavigationMenuLink asChild>
                        <Link href="/messages" className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium hover:bg-accent/80 hover:text-accent-foreground transition-colors">
                            <Icon icon="material-symbols:mail-rounded" className="size-4 shrink-0" />
                            <span>Messages</span>
                        </Link>
                    </NavigationMenuLink>

                    {/* CC - Dashboard */}
                    <NavigationMenuLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium hover:bg-accent/80 hover:text-accent-foreground transition-colors">
                            <Icon icon="material-symbols:dashboard-rounded" className="size-4 shrink-0" />
                            <span>Dashboard</span>
                        </Link>
                    </NavigationMenuLink>

                    {/* DD - Settings */}
                    <NavigationMenuLink asChild>
                        <Link href="/settings/profile" className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium hover:bg-accent/80 hover:text-accent-foreground transition-colors">
                            <Icon icon="material-symbols:settings-rounded" className="size-4 shrink-0" />
                            <span>Settings</span>
                        </Link>
                    </NavigationMenuLink>

                    {/* EE - Logout */}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium hover:bg-accent/80 text-destructive hover:text-destructive transition-colors w-full"
                    >
                        <Icon icon="material-symbols:logout-rounded" className="size-4 shrink-0" />
                        <span>Logout</span>
                    </button>
                    </div>
                </div>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
}
