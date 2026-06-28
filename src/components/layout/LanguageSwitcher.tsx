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
import { useLanguage } from '@/hooks/useLanguage';
import React, { useCallback } from 'react';
import Image from 'next/image';

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

    const handleSelect = useCallback((code: string) => {
        i18n.changeLanguage(code);
    }, [i18n]);

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

    const languages = useLanguage();

    const items = languages.map(({ code, name, flag: flagUrl }) => ({ code, label: name, flagUrl }));

    return (
        <div className={props.className}>
            {/* Desktop: dropdown */}
            <div className="hidden md:flex w-full">
                <DropdownMenu>
                    <DropdownMenuTrigger render={trigger.desktop} />
                    <DropdownMenuContent align="end">
                        {items.map(({ code, label, flagUrl }) => (
                            <DropdownMenuItem
                                key={code}
                                onClick={() => handleSelect(code)}
                                className={i18n.language === code ? 'font-semibold' : ''}
                            >
                                {flagUrl && <Image
                                    src={flagUrl}
                                    alt={code}
                                    width={16}
                                    height={16}
                                    className="h-4 w-4 rounded-sm object-cover mr-2"
                                />}
                                {label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: drawer */}
            <div className="md:hidden flex w-full">
                <Drawer>
                    <DrawerTrigger asChild>
                        {trigger.mobile}
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>{t('nav.language')}</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex flex-col gap-1 px-4 pb-6">
                            {items.map(({ code, label, flagUrl }) => (
                                <Button
                                    key={code}
                                    variant={i18n.language === code ? 'secondary' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleSelect(code)}
                                >
                                    {flagUrl && (
                                        <Image
                                            src={flagUrl}
                                            alt={code}
                                            width={16}
                                            height={16}
                                            className="h-4 w-4 rounded-sm object-cover mr-2"
                                        />
                                    )}
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    );
}
