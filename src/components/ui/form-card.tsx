import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormCardProps extends React.ComponentProps<'div'> {
    title: string;
    description?: string;
    footer?: ReactNode;
    children: ReactNode;
}

export function FormCard({ title, description, footer, children, className, ...props }: FormCardProps) {
    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card className="shadow-lg">
                <CardHeader className="pb-6 text-center">
                    <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                    {description && (
                        <CardDescription className="text-muted-foreground/80">{description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
            {footer}
        </div>
    );
}
