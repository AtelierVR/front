'use client';

import { type ReactNode } from 'react';
import { PublicNavLayout } from '@/components/layout/PublicNavLayout';

export default function Layout({ children }: { children: ReactNode }) {
    return <PublicNavLayout>{children}</PublicNavLayout>;
}
