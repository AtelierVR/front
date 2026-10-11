'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface FieldSeparatorProps extends React.ComponentProps<'div'> {
    /** Label shown between the two rules. */
    children: React.ReactNode;
}

/**
 * Horizontal rule with a centred label, used to separate a primary form action
 * from its alternatives.
 *
 * @example
 *   <FieldSeparator>Or continue with</FieldSeparator>
 */
function FieldSeparator({ children, className, ...props }: FieldSeparatorProps) {
    return (
        <div
            data-slot="field-separator"
            className={cn('flex items-center gap-3', className)}
            {...props}
        >
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{children}</span>
            <Separator className="flex-1" />
        </div>
    );
}

export { FieldSeparator };
