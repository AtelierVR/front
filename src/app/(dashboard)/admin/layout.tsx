'use client';

/**
 * Admin section shell.
 *
 * Everything under `/admin` is admin-only: `AdminGuard` renders a 403 for authenticated
 * non-admins and redirects anonymous visitors to `/login?redirect=<path>`. The sidebar already
 * hides the section for non-admins — this is the actual enforcement.
 */

import { type ReactNode } from 'react';
import { AdminGuard } from '@/lib/auth/guards';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return <AdminGuard>{children}</AdminGuard>;
}
