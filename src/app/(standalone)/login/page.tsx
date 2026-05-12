'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/features/auth/LoginForm';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
