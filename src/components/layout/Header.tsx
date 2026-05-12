'use client';

import { type ComponentProps, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useApi } from '@/lib/api/context';
import { Button, buttonVariants } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserNavMenu } from '@/components/layout/user-nav-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { InstanceLogo } from './InstanceLogo';


function HeaderNavigationMenu(props: ComponentProps<'div'>) {
  const [value, setValue] = useState('');
  const isInHeaderRef = useRef(false);

  return (
    <NavigationMenu
      value={value}
      onValueChange={(v) => {
        // Ignore close events while the mouse is still inside the header
        if (!v && isInHeaderRef.current) return;
        setValue(v);
      }}
      asChild
    >
      <header
        className="sticky top-0 z-50 w-full"
        onMouseEnter={() => { isInHeaderRef.current = true; }}
        onMouseLeave={() => { isInHeaderRef.current = false; setValue(''); }}
      >
        <div
          className={cn(
            'relative border-b bg-background/95 backdrop-blur-lg transition-colors supports-[backdrop-filter]:bg-background/60',
          )}
        >
          <NavigationMenuList className="flex h-14 w-full items-center px-4 container mx-auto max-w-screen-xl" asChild>
            <nav>{props.children}</nav>
          </NavigationMenuList>

          <NavigationMenuViewport />
        </div>
      </header>
    </NavigationMenu>
  );
}


export function Header() {
  const { t, i18n } = useTranslation();
  const { wellKnown, config, currentUser, logout } = useApi();

  const instanceName = resolveLocalized(wellKnown?.metadata.title, i18n.language) || 'Nox';
  const registrationOpen = config?.allowUserRegistration === true;

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/search', label: t('nav.search') }
  ];

  return (
    <HeaderNavigationMenu>
      {/* Logo */}
      <Link href="/" className="mr-4 flex items-center gap-2 font-heading text-lg font-bold text-foreground shrink-0">
        <InstanceLogo className="h-6 w-6" />
        {instanceName}
      </Link>

      {/* Desktop nav links */}
      <ul className="hidden md:flex items-center gap-1 px-2 list-none">
        {navLinks.map((link) => (
          <NavigationMenuItem key={link.href}>
            <Button variant="ghost" size="sm" render={<Link href={link.href} />}>
              {link.label}
            </Button>
          </NavigationMenuItem>
        ))}
      </ul>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: desktop */}
      <div className="flex items-center gap-1.5 max-md:hidden">
        <LanguageSwitcher />
        <ThemeToggle />
        {currentUser ? (
          <UserNavMenu user={currentUser} onLogout={logout} />
        ) : (
          <>
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              {t('auth.login')}
            </Button>
            {registrationOpen && (
              <Button size="sm" render={<Link href="/register" />}>
                {t('auth.register')}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Mobile: LanguageSwitcher + ThemeToggle + hamburger trigger */}
      <div className="flex items-center gap-1 md:hidden ms-auto -me-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
        <NavigationMenuItem>
          <NavigationMenuTrigger
            aria-label="Toggle menu"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'group',
            )}
          >
            <Icon icon="material-symbols:keyboard-arrow-down-rounded" className="size-5 transition-transform duration-300 group-data-[state=open]:rotate-180" />
          </NavigationMenuTrigger>
          <NavigationMenuContent className="flex flex-col p-4">
            {currentUser && (
              <>
                <div className="flex items-center gap-3 px-2 py-2 mb-1">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={currentUser.thumbnail ?? undefined} alt={currentUser.display} />
                    <AvatarFallback className="text-xs">
                      {(currentUser.display ?? currentUser.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{currentUser.display}</p>
                    <p className="text-xs text-muted-foreground truncate">@{currentUser.username}</p>
                  </div>
                </div>
                <Button variant="ghost" className="justify-start" render={<Link href={`/u/${currentUser.username}`} />}>
                  <Icon icon="material-symbols:person-rounded" className="mr-2 h-4 w-4" />
                  {t('nav.profile', 'Profile')}
                </Button>
                <Button variant="ghost" className="justify-start" render={<Link href="/settings/profile" />}>
                  <Icon icon="material-symbols:settings-rounded" className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </Button>
                <Button variant="ghost" className="justify-start text-destructive hover:text-destructive" onClick={() => logout()}>
                  <Icon icon="material-symbols:logout-rounded" className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </Button>
                <Separator className="my-2" />
              </>
            )}
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" className="justify-start" render={<Link href={link.href} />}>
                {link.label}
              </Button>
            ))}
            {!currentUser && (
              <div className="flex flex-col gap-1 mt-1">
                <Button variant="ghost" className="justify-start" render={<Link href="/login" />}>
                  {t('auth.login')}
                </Button>
                {registrationOpen && (
                  <Button className="justify-start" render={<Link href="/register" />}>
                    {t('auth.register')}
                  </Button>
                )}
              </div>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </div>
    </HeaderNavigationMenu>
  );
}
