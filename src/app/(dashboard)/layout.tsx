'use client';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions, type UserNav, type UserNavItem } from '@/lib/layout.shared';
import { useApi } from '@/lib/api';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

interface SidebarFooterProps {
    user: UserNav | null;
}

function DashboardSidebarFooter({ user }: SidebarFooterProps) {
    const { t } = useTranslation();

    const userItem = user?.items.find((i): i is Extract<UserNavItem, { type: 'user' }> => i.type === 'user');
    const name = userItem?.display ?? '';
    const username = userItem?.username ?? '';
    const initials = name.slice(0, 2).toUpperCase();
    const thumbnail = userItem?.thumbnail ?? undefined;
    const banner = userItem?.banner ?? undefined;

    return (
        <div className="flex flex-col gap-2 px-2 py-2">
            <div className="flex items-center gap-1">
                <LanguageSwitcher className="flex-1 flex" trigger={{ className: 'flex-1 flex' }} />
                <ThemeToggle className="flex-1 flex" trigger={{ className: 'flex-1 flex' }} />
            </div>
            {!user ? (
                <div className="flex flex-col gap-2 mt-1">
                    <Button variant="default" render={<Link href="/register" />} size="lg" className="w-full">
                        {t('auth.register')}
                    </Button>
                    <Button variant="outline" render={<Link href="/login" />} size="lg" className="w-full">
                        {t('auth.login')}
                    </Button>
                </div>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 w-full justify-start h-auto py-2 px-2"
                            />
                        }
                    >
                        <Avatar className="size-8 rounded-lg">
                            <AvatarImage src={thumbnail} alt={name} />
                            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{name}</span>
                            <span className="truncate text-xs text-foreground/70">@{username}</span>
                        </div>
                        <Icon icon="material-symbols:more-vert" className="ml-auto size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-56" side="top" align="end" sideOffset={4}>
                        <Link
                            href={`/u/${username}`}
                            style={{ backgroundImage: banner ? `url(${banner})` : undefined }}
                            className="relative flex items-center -mx-1 -mt-1 -mb-1 bg-fd-muted bg-cover bg-center overflow-hidden hover:brightness-110 transition-[filter]"
                        >
                            {banner && <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />}
                            <div className="relative p-3 flex items-center gap-2 w-full">
                                <Avatar className="size-8 rounded-lg">
                                    <AvatarImage src={thumbnail} alt={name} />
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className={cn('truncate font-medium', banner && 'text-white')}>{name}</span>
                                    <span className={cn('truncate text-xs', banner ? 'text-white/70' : 'text-muted-foreground')}>@{username}</span>
                                </div>
                            </div>
                        </Link>
                        <DropdownMenuSeparator />
                        {user.items.map((item, i) => {
                            if (item.type === 'separator') return <DropdownMenuSeparator key={i} />;
                            if (item.type === 'user') return null;
                            if (item.type === 'link') return (
                                <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                                    <Icon icon={item.icon} />
                                    {item.label}
                                </DropdownMenuItem>
                            );
                            if (item.type === 'button') return (
                                <DropdownMenuItem key={i} onClick={() => void item.action()}>
                                    <Icon icon={item.icon} />
                                    {item.label}
                                </DropdownMenuItem>
                            );
                            return null;
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const { user, ...layoutProps } = baseOptions();
    const { isAdmin } = useApi();

    const adminItems: PageTree.Node[] = isAdmin ? [
        { type: 'separator', name: 'Admin' },
        {
            type: 'page',
            name: t('admin.relays'),
            url: '/relays',
            icon: <Icon icon="material-symbols:cell-tower-rounded" />,
        },
        {
            type: 'page',
            name: t('admin.activity'),
            url: '/activity',
            icon: <Icon icon="material-symbols:history-rounded" />,
        },
        {
            type: 'page',
            name: t('admin.logs'),
            url: '/logs',
            icon: <Icon icon="material-symbols:terminal-rounded" />,
        },
        {
            type: 'page',
            name: t('admin.environment'),
            url: '/environment',
            icon: <Icon icon="material-symbols:tune-rounded" />,
        },
    ] : [];

    const tree: PageTree.Root = {
        name: 'Dashboard',
        children: [
            {
                type: 'page',
                name: t('dashboard.title'),
                url: '/dashboard',
                icon: <Icon icon="material-symbols:dashboard-rounded" />,
            },
            ...adminItems,
            { type: 'separator', name: t('nav.settings') },
            {
                type: 'folder',
                name: t('nav.settings'),
                icon: <Icon icon="material-symbols:settings-rounded" />,
                index: {
                    type: 'page',
                    name: t('settings.nav.profile'),
                    url: '/settings/profile',
                    icon: <Icon icon="material-symbols:person-rounded" />,
                },
                children: [
                    {
                        type: 'page',
                        name: t('settings.nav.profile'),
                        url: '/settings/profile',
                        icon: <Icon icon="material-symbols:person-rounded" />,
                    },
                    {
                        type: 'page',
                        name: t('settings.account.title'),
                        url: '/settings/account',
                        icon: <Icon icon="material-symbols:manage-accounts-rounded" />,
                    },
                    {
                        type: 'folder',
                        name: t('user.followers', 'Relations'),
                        icon: <Icon icon="material-symbols:group-rounded" />,
                        index: {
                            type: 'page',
                            name: t('user.followers'),
                            url: '/settings/relations/followers',
                            icon: <Icon icon="material-symbols:person-add-rounded" />,
                        },
                        children: [
                            {
                                type: 'page',
                                name: t('user.followers'),
                                url: '/settings/relations/followers',
                                icon: <Icon icon="material-symbols:person-add-rounded" />,
                            },
                            {
                                type: 'page',
                                name: t('user.following'),
                                url: '/settings/relations/following',
                                icon: <Icon icon="material-symbols:how-to-reg-rounded" />,
                            },
                        ],
                    },
                ],
            },
        ],
    };

    return (
        <DocsLayout
            {...layoutProps}
            tree={tree}
            sidebar={{
                footer: <DashboardSidebarFooter user={user} />,
            }}
        >
            <div id="nd-main" className="[grid-area:main] flex flex-col min-h-0 overflow-y-auto">
                {children}
            </div>
        </DocsLayout>
    );
}
