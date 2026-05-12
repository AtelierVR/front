

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const PixelBlast = dynamic(() => import('@/components/ui/pixel-blast'), { ssr: false });

export default function Background() {
    let { resolvedTheme } = useTheme();

    return <PixelBlast
        color={resolvedTheme === 'dark' ? '#ccccff' : '#141452'}
        pixelSize={4}
        patternDensity={0.9}
        edgeFade={0.3}
        speed={0.3}
        transparent
    />;
}