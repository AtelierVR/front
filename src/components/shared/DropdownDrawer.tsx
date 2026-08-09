'use client';

import { type ReactNode } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface DropdownDrawerItem {
    key: string;
    label: string;
    icon?: ReactNode;
    active?: boolean;
    onClick?: () => void;
}

interface DropdownDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactNode;
    items: DropdownDrawerItem[];
    /** Title shown in the mobile drawer header. */
    title?: string;
    className?: string;
}

export function DropdownDrawer({ open, onOpenChange, trigger, items, title, className }: DropdownDrawerProps) {
    const isMobile = useIsMobile();

    if (!isMobile) {
        return (
            <DropdownMenu open={open} onOpenChange={onOpenChange}>
                <DropdownMenuTrigger>
                    {trigger}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={cn('min-w-[200px]', className)}>
                    {items.map((item) => (
                        <DropdownMenuItem
                            key={item.key}
                            onClick={() => {
                                item.onClick?.();
                                onOpenChange(false);
                            }}
                            className={item.active ? 'font-semibold bg-accent' : ''}
                        >
                            {item.icon}
                            {item.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerTrigger asChild>
                {trigger as React.ReactElement}
            </DrawerTrigger>
            <DrawerContent>
                {title && (
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                    </DrawerHeader>
                )}
                <div className="flex flex-col gap-1 px-4 pb-6">
                    {items.map((item) => (
                        <Button
                            key={item.key}
                            variant={item.active ? 'secondary' : 'ghost'}
                            className="justify-start"
                            onClick={() => {
                                item.onClick?.();
                                onOpenChange(false);
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </Button>
                    ))}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
