import type { Metadata } from 'next';
import PrivacyClient from './_client';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How we collect, process and protect your personal data.',
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
