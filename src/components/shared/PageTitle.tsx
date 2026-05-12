'use client';

import { useEffect } from 'react';
import { formatPageTitle } from '@/lib/site';

interface PageTitleProps {
  title: string | null;
}

/**
 * Dynamically updates document.title from a client component,
 * using the same template as the root layout metadata.
 * Renders nothing — drop it anywhere in a page or layout.
 */
export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    document.title = formatPageTitle(title);
    return () => {
      document.title = formatPageTitle(null);
    };
  }, [title]);

  return null;
}

export function setTitle(title: string | null) {
  document.title = formatPageTitle(title);
}
