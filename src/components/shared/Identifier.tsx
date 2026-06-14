'use client';

import { useState } from 'react';
import type { NoxIdString } from '@/types/nox-identifier';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface IdentifierProps {
    value: NoxIdString;
    className?: string;
}

export function Identifier({ value, className }: IdentifierProps) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard may be unavailable (e.g. insecure context)
        }
    }

    return (
        <button
            onClick={copy}
            title={copied ? 'Copied!' : 'Copy identifier'}
            className={cn(
                `hover:text-foreground transition-colors hover:underline underline-offset-2 flex items-center gap-1`,
                className,
            )}
        >
            <span>{value}</span>
        </button>
    );
}
