'use client';

import { Icon } from '@iconify/react';
import { isValidUrl } from '@/lib/utils';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useUser } from './UserContext';

export function UserLinkBox() {
  const { user, isSame } = useUser();

  const links = user?.links ?? [];

  return (
    <SidebarCard title="Links" editHref="/settings/profile#links" isSame={isSame}>
      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">No links.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((link, i) =>
            isValidUrl(link.value) ? (
              <a
                key={i}
                href={link.value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
              >
                <Icon icon="material-symbols:open-in-new-rounded" className="size-3.5 shrink-0" />
                <span className="truncate">{link.label || link.value}</span>
              </a>
            ) : (
              <span key={i} className="text-sm text-muted-foreground truncate">{link.label || link.value}</span>
            ),
          )}
        </div>
      )}
    </SidebarCard>
  );
}
