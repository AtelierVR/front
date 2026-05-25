'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonItemProps {
    icon?: ReactNode;
    label: ReactNode;
    description?: ReactNode;
    active?: boolean;
    onClick?: () => void;
}

export function ButtonItem({ icon, label, description, active, onClick }: ButtonItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground w-full text-left',
                active ? 'bg-fd-accent/80 text-fd-accent-foreground' : 'bg-fd-card',
            )}
        >
            {icon && (
                <div className="w-fit rounded-md border bg-fd-muted p-1 [&_svg]:size-4">
                    {icon}
                </div>
            )}
            <p className="text-base font-medium">{label}</p>
            {description && (
                <p className="text-sm text-fd-muted-foreground">{description}</p>
            )}
        </button>
    );
}
