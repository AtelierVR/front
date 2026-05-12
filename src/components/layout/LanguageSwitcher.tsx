'use client';

import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
import { RESOURCES } from '@/lib/i18n/constants';
import React from 'react';
import { cn } from '@/lib/utils';

export interface LanguageSwitcherProps {
    trigger?: React.ReactElement | {
        mobile?: React.ReactElement;
        desktop?: React.ReactElement;
        className?: string;
    };
    className?: string;
}

export function LanguageSwitcher(props: LanguageSwitcherProps = {}) {
    const { i18n, t } = useTranslation();

    let trigger = props.trigger;

    trigger ??= {};

    if (React.isValidElement(trigger))
        trigger = { desktop: trigger };

    trigger.desktop ??= <Button
        variant="ghost"
        aria-label="Switch language"
        className={trigger.className}
    >
        <Icon icon="material-symbols:language" className="h-4 w-4" />
    </Button>;

    trigger.mobile ??= <Button
        variant="ghost"
        aria-label="Switch language"
        className={trigger.className}
    >
        <Icon icon="material-symbols:language" className="h-4 w-4" />
    </Button>;

    const items = Object.entries(RESOURCES).map(([code, locale]) => ({ code, label: locale.translation.language }));

    return (
        <>
            {/* Desktop: dropdown */}
            <div className={cn(
                "hidden md:flex",
                props.className
            )}>
                <DropdownMenu>
                    <DropdownMenuTrigger render={trigger.desktop} />
                    <DropdownMenuContent align="end">
                        {items.map(({ code, label }) => (
                            <DropdownMenuItem
                                key={code}
                                onClick={() => i18n.changeLanguage(code)}
                                className={i18n.language === code ? 'font-semibold' : ''}
                            >
                                {label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: drawer */}
            <div className="md:hidden flex">
                <Drawer>
                    <DrawerTrigger asChild>
                        {trigger.mobile}
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>{t('nav.language')}</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex flex-col gap-1 px-4 pb-6">
                            {items.map(({ code, label }) => (
                                <Button
                                    key={code}
                                    variant={i18n.language === code ? 'secondary' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => i18n.changeLanguage(code)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </>
    );
}
