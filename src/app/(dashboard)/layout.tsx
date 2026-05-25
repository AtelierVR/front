'use client';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { type ReactNode } from 'react';
import { useApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

function DashboardSidebarFooter() {
    const { currentUser, logout } = useApi();
    const { t } = useTranslation();

    const name = currentUser?.display ?? currentUser?.username ?? 'Admin';
    const username = currentUser?.username ?? '';
    const initials = name.slice(0, 2).toUpperCase();
    const thumbnail = currentUser?.thumbnail ?? undefined;

    return (
        <div className="flex flex-col gap-2 px-2 py-2">
            <div className="flex items-center gap-1">
                <LanguageSwitcher className="flex-1 flex" trigger={{ className: 'flex-1 flex' }} />
                <ThemeToggle className="flex-1 flex" trigger={{ className: 'flex-1 flex' }} />
            </div>
            {!currentUser ? (
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
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="size-8">
                                        <AvatarImage src={thumbnail} alt={name} />
                                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{name}</span>
                                        <span className="truncate text-xs text-muted-foreground">@{username}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem render={<Link href="/settings/profile" />}>
                                <Icon icon="material-symbols:account-circle" />
                                {t('profile')}
                            </DropdownMenuItem>
                            <DropdownMenuItem render={<Link href="/" />}>
                                <Icon icon="material-symbols:open-in-new-rounded" />
                                {t('public_site')}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()}>
                            <Icon icon="material-symbols:logout-rounded" />
                            {t('logout')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isAdmin } = useApi();
    const { t } = useTranslation();

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
            { type: 'separator' },
            {
                type: 'page',
                name: t('nav.settings'),
                url: '/settings',
                icon: <Icon icon="material-symbols:settings-rounded" />,
            },
        ],
    };

    return (
        <DocsLayout
            {...baseOptions()}
            tree={tree}
            sidebar={{
                footer: <DashboardSidebarFooter />,
            }}
        >
            <div id="nd-main" className="[grid-area:main] flex flex-col min-h-0 overflow-y-auto">
                {children}
            </div>
        </DocsLayout>
    );
}
