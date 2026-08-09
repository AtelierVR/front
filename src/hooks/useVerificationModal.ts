'use client';

import { useState, useRef } from 'react';
import type { ApiError } from '@/types/envelope';
import type { VerificationMethod } from '@/lib/api/users';

interface UseVerificationModalReturn {
    showVerificationModal: boolean;
    verificationMethods: VerificationMethod[];
    verificationResolveRef: React.MutableRefObject<((code: string | null) => void) | null>;
    handleVerificationRequired: (error: ApiError, methods: VerificationMethod[]) => Promise<string | null>;
    handleVerificationClose: () => void;
    setShowVerificationModal: (open: boolean) => void;
}

export function useVerificationModal(
    onClose?: () => void,
): UseVerificationModalReturn {
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationMethods, setVerificationMethods] = useState<VerificationMethod[]>([]);
    const verificationResolveRef = useRef<((code: string | null) => void) | null>(null);

    const handleVerificationRequired = async (
        _error: ApiError,
        methods: VerificationMethod[],
    ): Promise<string | null> => {
        setVerificationMethods(methods);
        setShowVerificationModal(true);
        return new Promise((resolve) => {
            verificationResolveRef.current = resolve;
        });
    };

    const handleVerificationClose = () => {
        setShowVerificationModal(false);
        verificationResolveRef.current?.(null);
        verificationResolveRef.current = null;
        onClose?.();
    };

    return {
        showVerificationModal,
        verificationMethods,
        verificationResolveRef,
        handleVerificationRequired,
        handleVerificationClose,
        setShowVerificationModal,
    };
}
