import type { Metadata } from 'next';
import TermsClient from './_client';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'The terms governing the use of the platform and its services.',
};

export default function TermsPage() {
    return <TermsClient />;
}
