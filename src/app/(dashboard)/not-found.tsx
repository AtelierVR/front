import { NotFound as BasicNotFound } from '@/app/not-found';
import { SiteHeader, SiteHeaderProps } from '@/components/site-header';

export default function NotFoundPage() {
    return NotFound({});
}

export function NotFound(props: SiteHeaderProps) {
    return <>
        <SiteHeader
            {...props}
        />
        <BasicNotFound
            className='flex-1'
            clear={true}
        />
    </>
}