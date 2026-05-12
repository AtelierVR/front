'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SidebarCardProps {
  title: string;
  editHref?: string;
  isSame?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SidebarCard({ title, editHref, isSame, children, className }: SidebarCardProps) {
  return (
    <Card className={cn('group/card relative', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-medium text-muted-foreground uppercase tracking-wide">{title}</h2>
        </div>
      </CardHeader>
      {isSame && editHref && (
        <Link href={editHref} className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Icon icon="material-symbols:edit-rounded" className="size-4" />
          </Button>
        </Link>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
