'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

interface NavMenuCardProps {
    href: string;
    icon: string;
    label: string;
    className?: string;
    colSpan?: 2 | 4;
    onClick?: () => void;
}

export function NavMenuCard({ href, icon, label, className, colSpan = 2, onClick }: NavMenuCardProps) {
    return (
        <NavigationMenuLink asChild>
            <Link
                href={href}
                onClick={onClick}
                className={cn(
                    `col-span-${colSpan} flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/80 hover:text-accent-foreground`,
                    className,
                )}
            >
                <Icon icon={icon} className="size-5" />
                <span className="text-sm font-medium">{label}</span>
            </Link>
        </NavigationMenuLink>
    );
}

interface NavMenuButtonProps {
    icon: string;
    label: string;
    className?: string;
    colSpan?: 2 | 4;
    onClick?: () => void;
}

export function NavMenuButton({ icon, label, className, colSpan = 4, onClick }: NavMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                `col-span-${colSpan} flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/80 hover:text-accent-foreground w-full text-left`,
                className,
            )}
        >
            <Icon icon={icon} className="size-5" />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
