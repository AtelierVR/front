'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import type { VerificationMethod } from '@/lib/api/users';
import { sendVerificationCode } from '@/lib/api/auth';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (code: string) => void;
    methods: VerificationMethod[];
    title?: string;
    username?: string;
}

export function VerificationModal({
    isOpen,
    onClose,
    onSuccess,
    methods,
    title,
}: VerificationModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<'select' | 'code'>('select');
    const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [success, setSuccess] = useState(false);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
        return () => clearInterval(id);
    }, [resendCooldown]);

    // Reset state when modal closes
    useEffect(() => {
        if (isOpen) return;
        setStep('select');
        setSelectedMethod(null);
        setVerificationCode('');
        setLoading(false);
        setError(null);
        setSuccess(false);
        setResendCooldown(0);
    }, [isOpen]);

    // If only one method, auto-select and go to code step
    useEffect(() => {
        if (!isOpen || methods.length === 0) return;
        if (methods.length === 1) {
            setSelectedMethod(methods[0]);
            setStep('code');
        } else {
            setStep('select');
            setSelectedMethod(null);
        }
    }, [isOpen, methods]);

    // Auto-send when a sendable method is selected
    useEffect(() => {
        if (step !== 'code' || !selectedMethod?.details?.sendable) return;
        sendCode(selectedMethod);
    }, [step, selectedMethod]);

    const selectMethod = (method: VerificationMethod) => {
        setSelectedMethod(method);
        setStep('code');
    };

    const sendCode = async (method: VerificationMethod) => {
        setLoading(true);
        setError(null);
        try {
            await sendVerificationCode(method.type, method.details?.data ?? {});
            setResendCooldown(method.details?.cooldown ?? 30);
        } catch (err: any) {
            setError(err?.message ?? t('settings.security.verification.failed_send'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (!selectedMethod?.details?.sendable) return;
        sendCode(selectedMethod);
    };

    const handleComplete = (code: string) => {
        if (!code) return;
        setVerificationCode(code);
        setSuccess(true);
        setTimeout(() => {
            onSuccess(code);
        }, 800);
    };

    const codeLength = selectedMethod?.details?.code?.length ?? 6;

    // Can resend: only if selected method supports sending
    const canResend = selectedMethod?.details?.sendable ?? false;

    return (
        <ModalDrawer
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            header={title || t('settings.security.verification.title')}
            footer={
                step === 'code' ? (
                    <div className="flex w-full justify-end gap-2">
                        {canResend && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResend}
                                disabled={loading || resendCooldown > 0}
                            >
                                <Icon icon="material-symbols:refresh-rounded" className="size-3.5 mr-1" />
                                {resendCooldown > 0
                                    ? t('settings.security.verification.resend_cooldown', { seconds: resendCooldown })
                                    : t('settings.security.verification.resend')}
                            </Button>
                        )}
                        {methods.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                                {t('common.back')}
                            </Button>
                        )}
                    </div>
                ) : null
            }
        >
            <div className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <Icon icon="material-symbols:error-circle-rounded" className="size-4" />
                        <AlertTitle>{t('settings.security.verification.failed')}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {step === 'select' ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.security.verification.select_method')}
                        </p>
                        <div className="space-y-2">
                            {methods.map((method) => (
                                <button
                                    key={method.type}
                                    onClick={() => selectMethod(method)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                                >
                                    <Icon
                                        icon={method.type === 'totp' ? 'material-symbols:phonelink-lock-rounded' : 'material-symbols:mail-rounded'}
                                        className="size-5 text-muted-foreground shrink-0"
                                    />
                                    <div>
                                        <div className="text-sm font-medium">{method.name}</div>
                                        <div className="text-xs text-muted-foreground">{method.description}</div>
                                    </div>
                                    <Icon icon="material-symbols:chevron-right-rounded" className="size-4 text-muted-foreground ml-auto shrink-0" />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {selectedMethod && (
                            <p className="text-sm text-muted-foreground">
                                {selectedMethod.name} — {selectedMethod.description}
                            </p>
                        )}

                        <div className="flex flex-col items-center gap-3">
                            {success ? (
                                <div className="flex flex-col items-center gap-2 py-4">
                                    <Icon icon="material-symbols:check-circle-rounded" className="size-10 text-green-500" />
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        {t('settings.security.verification.verified')}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <label className="text-sm font-medium">
                                        {t('settings.security.verification.code_label')}
                                    </label>
                                    <InputOTP
                                        maxLength={codeLength}
                                        value={verificationCode}
                                        onChange={setVerificationCode}
                                        onComplete={handleComplete}
                                        autoFocus
                                    >
                                        <InputOTPGroup>
                                            {Array.from({ length: codeLength }, (_, i) => (
                                                <InputOTPSlot key={i} index={i} />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ModalDrawer>
    );
}
