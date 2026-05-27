'use client';

import { type ComponentProps, type ReactNode } from 'react';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import type { CustomItemType, MainItemType, MenuItemType } from 'fumadocs-ui/layouts/shared';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { ButtonItem } from '@/components/layout/ButtonItem';
import { type UserNav, type UserNavItem } from '@/lib/layout.shared';
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
    user?: UserNav | null;
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

function UserMenuContent({ userNav }: { userNav: UserNav }) {
    const { t } = useTranslation();
    const [cols] = userNav.grid;
    const userItem = userNav.items.find((i): i is Extract<UserNavItem, { type: 'user' }> => i.type === 'user');
    const uid = userItem ? `${userItem.username}@${userItem.server}` : '';

    return (
        <div
            className="col-span-full grid gap-2 w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
            {userNav.items.map((item, i) => {
                if (item.type === 'separator') return null;
                const style = item.size ? { gridColumn: `span ${item.size[0]}`, gridRow: `span ${item.size[1]}` } : {};

                if (item.type === 'user') return (
                    <Link
                        key="user-card"
                        href={item.href}
                        style={{ ...style, backgroundImage: item.banner ? `url(${item.banner})` : undefined }}
                        className="relative flex flex-col justify-end rounded-lg border bg-fd-muted bg-cover bg-center overflow-hidden transition-colors hover:brightness-110"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="relative p-3 flex flex-row gap-4 items-center">
                            <div className="w-fit">
                                <Avatar size="lg" className="border-2 border-white/30">
                                    {item.thumbnail && <AvatarImage src={item.thumbnail} alt={item.display ?? ''} />}
                                    <AvatarFallback>{item.display?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col leading-tight">
                                <p className="text-base font-medium text-white">{item.display}</p>
                                <p className="text-sm text-white/70 truncate">{uid}</p>
                            </div>
                        </div>
                    </Link>
                );

                if (item.type === 'link') return (
                    <Link key={item.href} href={item.href} style={style} className={cardClass}>
                        <div className={iconClass}><Icon icon={item.icon} /></div>
                        <p className="text-base font-medium">{item.label}</p>
                    </Link>
                );

                if (item.type === 'button') return (
                    <button key={i} onClick={() => void item.action()} style={style} className={cn(cardClass, 'text-left')}>
                        <div className={iconClass}><Icon icon={item.icon} /></div>
                        <p className="text-base font-medium">{item.label}</p>
                    </button>
                );

                return null;
            })}
        </div>
    );
}

function transformUser(
    item: UserItemType,
    userNav: UserNav,
): MenuItemType {
    const userItem = userNav.items.find((i): i is Extract<UserNavItem, { type: 'user' }> => i.type === 'user');
    const display = userItem?.display ?? null;
    const thumbnail = userItem?.thumbnail ?? null;
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
            children: <UserMenuContent userNav={userNav} />,
        }],
    };
}

function transformLinks(
    links: MainLinkItemType[],
    userNav: UserNav,
): LinkItemType[] {
    return links.map((item): LinkItemType => {
        if (item.type === 'button') return transformAction(item as ActionItemType);
        if (item.type === 'user') return transformUser(item as UserItemType, userNav);
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

export function MainLayout({ links, user, ...props }: MainLayoutProps) {
    const { t } = useTranslation();

    const baseLinks: MainLinkItemType[] = [
        ...(links ?? []),
        ...(user != null ? [{ type: 'user' as const }] : []),
    ];

    const resolved: LinkItemType[] = [
        ...(baseLinks.length > 0
            ? transformLinks(baseLinks, user ?? { grid: [3, -1], items: [] })
            : []),
        ...(user === null ? [
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
