'use client';

import { useLayoutEffect } from 'react';
import { formatPageTitle } from '@/lib/site';

interface PageTitleProps {
  title: string | null;
}

/**
 * Sets document.title synchronously before the first browser paint.
 *
 * `useLayoutEffect` runs after DOM mutations but BEFORE the browser paints,
 * so `document.title` is set before Next.js head manager or any other
 * mechanism can overwrite it. If `title` is `null` (e.g. still loading),
 * this component does nothing — the parent or page component is responsible
 * for setting the correct title in that case.
 *
 * We intentionally render nothing — no <title> tag — to avoid conflicts
 * with Next.js's head management on subsequent navigations.
 */
export function PageTitle({ title }: PageTitleProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    if (title !== null) document.title = formatPageTitle(title);
  }, [title]);

  return null;
}

export function setTitle(title: string | null) {
  document.title = formatPageTitle(title);
}
