'use client';

import { type ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModalDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Title string or custom header element. When a string + headerEnd, renders as title row with side element. */
    header: string | ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    /** Element rendered next to the title (only when header is a string). */
    headerEnd?: ReactNode;
}

export function ModalDrawer({ open, onOpenChange, header, children, footer, headerEnd }: ModalDrawerProps) {
    const isMobile = useIsMobile();

    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-3xl lg:max-w-4xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="flex-row items-center gap-4 pr-10">
                        {typeof header === 'string' ? (
                            <>
                                <DialogTitle className="text-lg">{header}</DialogTitle>
                                {headerEnd}
                            </>
                        ) : header}
                    </DialogHeader>
                    {children}
                    {footer && <DialogFooter>{footer}</DialogFooter>}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="flex-row items-center gap-4">
                    {typeof header === 'string' ? (
                        <>
                            <DrawerTitle className="text-lg">{header}</DrawerTitle>
                            {headerEnd}
                        </>
                    ) : header}
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-2">
                    {children}
                </div>
                {footer && <DrawerFooter>{footer}</DrawerFooter>}
            </DrawerContent>
        </Drawer>
    );
}
