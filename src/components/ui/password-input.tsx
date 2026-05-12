'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
            <Input
                {...props}
                type={show ? 'text' : 'password'}
                className={cn('pr-10', className)}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? <Icon icon="material-symbols:visibility-off-rounded" className="h-4 w-4" /> : <Icon icon="material-symbols:visibility-rounded" className="h-4 w-4" />}
            </button>
        </div>
    );
}
