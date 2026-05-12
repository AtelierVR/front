'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  return [
    { href: '/settings/profile',  label: t('settings.profile'),  icon: <Icon icon="material-symbols:person-rounded" className="h-4 w-4" /> },
    { href: '/settings/account',  label: t('settings.account'),  icon: <Icon icon="material-symbols:manage-accounts-rounded" className="h-4 w-4" /> },
    { href: '/settings/security', label: t('settings.security'), icon: <Icon icon="material-symbols:shield-rounded" className="h-4 w-4" /> },
    { href: '/settings/sessions', label: t('settings.sessions'), icon: <Icon icon="material-symbols:devices-rounded" className="h-4 w-4" /> },
    { href: '/settings/follow',   label: t('settings.follow'),   icon: <Icon icon="material-symbols:group-rounded" className="h-4 w-4" /> },
    { href: '/settings/tables',   label: t('settings.tables'),   icon: <Icon icon="material-symbols:table" className="h-4 w-4" /> },
  ];
}

function NavList({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start gap-2', isActive && 'font-semibold')}
              render={<Link href={item.href} />}
            >
              {item.icon}
              {item.label}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop vertical sidebar for /settings/* pages */
export function SettingsSidebar() {
  const items = useNavItems();
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-56 shrink-0 md:block">
        <NavList items={items} />
      </aside>

      {/* Mobile Sheet */}
      <Sheet>
        <SheetTrigger render={<Button variant="outline" size="sm" className="md:hidden mb-4 gap-2" />}>
          <Icon icon="material-symbols:menu-rounded" className="h-4 w-4" />
          Settings
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetTitle className="mb-4 font-heading text-lg font-semibold">Settings</SheetTitle>
          <NavList items={items} />
        </SheetContent>
      </Sheet>
    </>
  );
}
