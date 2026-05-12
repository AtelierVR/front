'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApi } from '@/lib/api/context';
import { Skeleton } from '@/components/ui/skeleton';

// ── AuthGuard ─────────────────────────────────────────────────────────────────
// Renders a skeleton while loading, redirects to /login if unauthenticated,
// otherwise renders children. Intended for (auth)/layout.tsx.

interface GuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: GuardProps) {
  const { isLoading, currentUser } = useApi();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, currentUser, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!currentUser) {
    // Redirect is in flight — render nothing
    return null;
  }

  return <>{children}</>;
}

// ── AdminGuard ────────────────────────────────────────────────────────────────
// Redirects to /login if unauthenticated.
// Renders a 403 message inline if authenticated but not admin.
// Intended for (admin)/layout.tsx.

export function AdminGuard({ children }: GuardProps) {
  const { isLoading, currentUser, isAdmin } = useApi();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, currentUser, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-heading text-4xl font-bold">403</h1>
        <p className="text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
