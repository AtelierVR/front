import type { Metadata } from 'next';
import RulesClient from './_client';

export const metadata: Metadata = {
    title: 'Community Rules',
    description: 'Rules and standards of behaviour expected within the platform.',
};

export default function RulesPage() {
    return <RulesClient />;
}
