'use client';

import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/layout/ThemeProvider';
import React from 'react';

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

    const { trigger: triggerProp, className: wrapperClassName } = props;

    let triggerClassName: string | undefined;
    if (triggerProp && !React.isValidElement(triggerProp)) 
        triggerClassName = (triggerProp as { className?: string }).className;

    const icon = mounted && (resolvedTheme === 'dark'
        ? <Icon icon="material-symbols:light-mode-rounded" className="h-4 w-4" />
        : <Icon icon="material-symbols:dark-mode-rounded" className="h-4 w-4" />);

    return (
        <div className={wrapperClassName}>
            {/* Desktop */}
            <div className="hidden md:flex w-full">
                <Button
                    variant="ghost"
                    aria-label="Toggle theme"
                    className={triggerClassName}
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                    {icon}
                </Button>
            </div>

            {/* Mobile */}
            <div className="md:hidden w-full">
                <Button
                    variant="ghost"
                    aria-label="Toggle theme"
                    className={triggerClassName}
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                    {icon}
                </Button>
            </div>
        </div>
    );
}
