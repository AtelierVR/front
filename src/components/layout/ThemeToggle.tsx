'use client';

import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
    trigger?: React.ReactElement | {
        mobile?: React.ReactElement;
        desktop?: React.ReactElement;
        className?: string;
    };
    className?: string;
}

export function ThemeToggle(props: ThemeToggleProps = {}) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    let trigger = props.trigger;
    console.log(trigger);

    trigger ??= {};

    if (React.isValidElement(trigger))
        trigger = { desktop: trigger };

    trigger.desktop ??= <Button
        variant="ghost"
        aria-label="Toggle theme"
        className={trigger.className}
    >
        {mounted && (resolvedTheme === 'dark'
            ? <Icon icon="material-symbols:light-mode-rounded" className="h-4 w-4" />
            : <Icon icon="material-symbols:dark-mode-rounded" className="h-4 w-4" />)}
    </Button>;

    trigger.mobile ??= <Button
        variant="ghost"
        aria-label="Toggle theme"
        className={trigger.className}
    >
        {mounted && (resolvedTheme === 'dark'
            ? <Icon icon="material-symbols:light-mode-rounded" className="h-4 w-4" />
            : <Icon icon="material-symbols:dark-mode-rounded" className="h-4 w-4" />)}
    </Button>;

    return <>
        <div className={cn(
            "hidden md:flex",
            props.className
        )}>
            <Button
                variant="ghost"
                render={trigger.desktop}
                className={trigger.className}
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            />
        </div>

        <div className={cn(
            "md:hidden",
            props.className
        )}>
            <Button
                variant="ghost"
                render={trigger.mobile}
                className={trigger.className}
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            />
        </div>
    </>
}
