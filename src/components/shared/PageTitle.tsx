'use client';

import { useEffect } from 'react';
import { formatPageTitle } from '@/lib/site';

interface PageTitleProps {
  title: string | null;
}

/**
 * Sets document.title AND renders a <title> element so Next.js's
 * head manager (SideEffect) picks it up during client-side navigation.
 * Without the <title> tag, Next.js resets document.title to the root
 * layout's default metadata on every route change.
 */
export function PageTitle({ title }: PageTitleProps) {
  const formatted = formatPageTitle(title);

  useEffect(() => {
    document.title = formatted;
  }, [formatted]);

  // Render the <title> tag so Next.js's SideEffect/headManager
  // collects it and doesn't overwrite with the root metadata default.
  return <title>{formatted}</title>;
}

export function setTitle(title: string | null) {
  document.title = formatPageTitle(title);
}
