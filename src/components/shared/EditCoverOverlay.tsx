'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

interface EditCoverOverlayProps {
  href: string;
  iconSize?: number;
}

export function EditCoverOverlay({ href, iconSize = 8 }: EditCoverOverlayProps) {
  return (
    <Link
      href={href}
      className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
    >
      <Icon icon="material-symbols:edit-rounded" className={`size-${iconSize} text-white`} />
    </Link>
  );
}
