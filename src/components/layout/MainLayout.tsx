'use client';

import { type ComponentProps, type ReactNode } from 'react';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import type { CustomItemType, MainItemType, MenuItemType } from 'fumadocs-ui/layouts/shared';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { ButtonItem } from '@/components/layout/ButtonItem';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export interface ActionItemType {
    type: 'button';
    icon?: ReactNode;
    text: ReactNode;
    description?: ReactNode;
    active?: boolean;
    onClick?: () => void;
    on?: 'nav' | 'menu';
    secondary?: boolean;
}

export interface UserItemType {
    type: 'user';
    url?: string;
    on?: 'nav' | 'menu';
    secondary?: boolean;
}

type MainMenuChild =
    | (MainItemType & { menu?: ComponentProps<'a'> & { banner?: ReactNode } })
    | CustomItemType
    | ActionItemType
    | UserItemType;

interface MainMenuItemType extends Omit<MenuItemType, 'items'> {
    items: MainMenuChild[];
}

export type MainLinkItemType =
    | Exclude<LinkItemType, MenuItemType>
    | MainMenuItemType
    | ActionItemType
    | UserItemType;

export interface MainLayoutProps extends Omit<HomeLayoutProps, 'links'> {
    links?: MainLinkItemType[];
    userItem?: { url?: string; on?: 'nav' | 'menu'; secondary?: boolean };
}

function transformAction(item: ActionItemType): CustomItemType {
    return {
        type: 'custom',
        on: item.on,
        secondary: item.secondary,
        children: (
            <ButtonItem
                icon={item.icon}
                label={item.text}
                description={item.description}
                active={item.active}
                onClick={item.onClick}
            />
        ),
    };
}

const cardClass = 'flex flex-col gap-2 rounded-lg border bg-fd-card p-3 transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground';
const iconClass = 'w-fit rounded-md border bg-fd-muted p-1 [&_svg]:size-4';

function UserMenuContent({ profileUrl }: { profileUrl: string }) {
    const user = useCurrentUser();
    const { logout, isAdmin } = useApi();
    const { t } = useTranslation();
    const uid = user ? `${user.username}@${user.server}` : '';

    if (!user)
        return <div className="col-span-full grid grid-cols-2 gap-2 w-full">
            <Link href="/login" className={cardClass}>
                <div className={iconClass}><Icon icon="material-symbols:login-rounded" /></div>
                <p className="text-base font-medium">{t('auth.login')}</p>
            </Link>
            <Link href="/register" className={cardClass}>
                <div className={iconClass}><Icon icon="material-symbols:person-add-rounded" /></div>
                <p className="text-base font-medium">{t('auth.register')}</p>
            </Link>
        </div>;

    return (
        <div
            className="col-span-full grid gap-2 w-full"
            style={{
                gridTemplateColumns: 'repeat(6, 1fr)',
                gridTemplateAreas: isAdmin
                    ? '"a a b b c c" "a a d d e e"'
                    : '"a a b b c c" "a a e e e e"',
            }}
        >
            {/* A – user info (banner as full-cover background) */}
            <Link
                href={profileUrl}
                style={{
                    gridArea: 'a',
                    backgroundImage: user?.banner ? `url(${user.banner})` : undefined,
                }}
                className="relative flex flex-col justify-end rounded-lg border bg-fd-muted bg-cover bg-center overflow-hidden transition-colors hover:brightness-110"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative p-3 flex flex-row gap-4 items-center">
                    <div className="w-fit">
                        <Avatar size="lg" className="border-2 border-white/30">
                            {user?.thumbnail && <AvatarImage src={user.thumbnail} alt={user?.display ?? ''} />}
                            <AvatarFallback>{user?.display?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col leading-tight">
                        <p className="text-base font-medium text-white">{user?.display}</p>
                        <p className="text-sm text-white/70 truncate">{uid}</p>
                    </div>
                </div>
            </Link>

            {/* B – Dashboard */}
            <Link href="/dashboard" style={{ gridArea: 'b' }} className={cardClass}>
                <div className={iconClass}><Icon icon="material-symbols:dashboard-rounded" /></div>
                <p className="text-base font-medium">{t('nav.dashboard')}</p>
            </Link>

            {/* C – Messages */}
            <Link href="/messages" style={{ gridArea: 'c' }} className={cardClass}>
                <div className={iconClass}><Icon icon="material-symbols:chat-rounded" /></div>
                <p className="text-base font-medium">{t('nav.messages')}</p>
            </Link>

            {/* D – Admin (if available) */}
            {isAdmin && (
                <Link href="/admin" style={{ gridArea: 'd' }} className={cardClass}>
                    <div className={iconClass}><Icon icon="material-symbols:admin-panel-settings-rounded" /></div>
                    <p className="text-base font-medium">{t('nav.admin')}</p>
                </Link>
            )}

            {/* E – Logout */}
            <button
                onClick={() => void logout()}
                style={{ gridArea: 'e' }}
                className={cn(cardClass, 'text-left')}
            >
                <div className={iconClass}><Icon icon="material-symbols:logout-rounded" /></div>
                <p className="text-base font-medium">{t('auth.logout')}</p>
            </button>
        </div>
    );
}

function transformUser(item: UserItemType, display: string | null, thumbnail: string | null): MenuItemType {
    const initials = display ? display.slice(0, 2).toUpperCase() : '?';
    return {
        type: 'menu',
        on: item.on,
        secondary: item.secondary ?? true,
        text: (
            <Avatar size="sm">
                {thumbnail && <AvatarImage src={thumbnail} alt={display ?? ''} />}
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
        ),
        items: [{
            type: 'custom',
            children: <UserMenuContent profileUrl={item.url ?? '/profile'} />,
        }],
    };
}

function transformLinks(
    links: MainLinkItemType[],
    userDisplay: string | null,
    userThumbnail: string | null,
): LinkItemType[] {
    return links.map((item): LinkItemType => {
        if (item.type === 'button') return transformAction(item as ActionItemType);
        if (item.type === 'user') return transformUser(item as UserItemType, userDisplay, userThumbnail);
        if (item.type === 'menu') {
            return {
                ...item,
                items: item.items.map(
                    (child): MenuItemType['items'][number] => {
                        if (child.type === 'button') return transformAction(child as ActionItemType);
                        return child as MainItemType | CustomItemType;
                    },
                ),
            } as MenuItemType;
        }
        return item as LinkItemType;
    });
}

export function MainLayout({ links, userItem, ...props }: MainLayoutProps) {
    const user = useCurrentUser();
    const { t } = useTranslation();

    const baseLinks: MainLinkItemType[] = [
        ...(links ?? []),
        ...(userItem !== undefined && user ? [{ type: 'user' as const, ...userItem }] : []),
    ];

    const resolved: LinkItemType[] = [
        ...(baseLinks.length > 0
            ? transformLinks(baseLinks, user?.display ?? null, user?.thumbnail ?? null)
            : []),
        ...(userItem !== undefined && !user ? [
            {
                type: 'custom' as const,
                secondary: true,
                children: (
                    <Link
                        href="/login"
                        className="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-fd-accent transition-colors"
                    >
                        {t('auth.login')}
                    </Link>
                ),
            },
            {
                type: 'custom' as const,
                secondary: true,
                children: (
                    <Link
                        href="/register"
                        className="text-sm font-medium px-3 py-1.5 rounded-md bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
                    >
                        {t('auth.register')}
                    </Link>
                ),
            },
        ] as LinkItemType[] : []),
    ];

    return <HomeLayout {...props} links={resolved.length > 0 ? resolved : undefined} />;
}
