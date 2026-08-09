'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { useApi } from '@/lib/api/context';
import { setupTotp, enableTotp, disableTotp } from '@/lib/api/auth';
import { useTranslation } from 'react-i18next';
import { notify } from '@/components/ui/notify';

interface TwoFAPartProps {}

export function TwoFAPart(_props: TwoFAPartProps) {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [setupOpen, setSetupOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'scan' | 'verify'>('scan');
    const [tab, setTab] = useState<'qr' | 'manual'>('qr');
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setEnabled(currentUser.twofa_enabled || false);
        }
    }, [currentUser]);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleEnable = async () => {
        setLoading(true);
        try {
            const res = await setupTotp();
            setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(res.qr_code_url)}`);
            setSecret(res.secret);
            setStep('scan');
            setTab('qr');
            setSetupOpen(true);
        } catch (err: any) {
            notify(err?.message ?? t('settings.security.two_factor.failed_setup'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!code || code.length < 6) return;
        setLoading(true);
        try {
            await enableTotp(secret, code);
            setVerified(true);
            setTimeout(() => {
                notify(t('settings.security.two_factor.enabled_success'), { type: 'success' });
                setEnabled(true);
                setSetupOpen(false);
                setCode('');
            }, 800);
        } catch (err: any) {
            notify(err?.message ?? t('settings.security.two_factor.failed_enable'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        try {
            await disableTotp();
            notify(t('settings.security.two_factor.disabled_success'), { type: 'success' });
            setEnabled(false);
        } catch (err: any) {
            notify(err?.message ?? t('settings.security.two_factor.failed_disable'), { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <section id="twofa" className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{t('settings.security.two_factor.title')}</h2>
                <Badge variant={enabled ? 'default' : 'secondary'}>
                    <Icon icon="material-symbols:shield-rounded" className="size-3 mr-1" />
                    {enabled
                        ? t('settings.security.two_factor.enabled')
                        : t('settings.security.two_factor.disabled')}
                </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
                {enabled
                    ? t('settings.security.two_factor.enabled_description')
                    : t('settings.security.two_factor.disabled_description')}
            </p>

            <div className="pt-1">
                {enabled ? (
                    <Button
                        onClick={handleDisable}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                    >
                        <Icon icon="material-symbols:delete-rounded" className="size-4 mr-1.5" />
                        {loading ? t('settings.security.two_factor.disabling') : t('settings.security.two_factor.disable')}
                    </Button>
                ) : (
                    <Button onClick={handleEnable} disabled={loading} variant="outline" size="sm">
                        <Icon icon="material-symbols:shield-rounded" className="size-4 mr-1.5" />
                        {loading ? t('settings.security.two_factor.setting_up') : t('settings.security.two_factor.enable')}
                    </Button>
                )}
            </div>

            {/* Setup dialog */}
            <ModalDrawer
                open={setupOpen}
                onOpenChange={(open) => { if (!open) { setSetupOpen(false); setCode(''); setStep('scan'); } }}
                header={step === 'scan' ? t('settings.security.two_factor.setup_title') : t('settings.security.two_factor.verify_title')}
                footer={
                    step === 'verify' ? (
                        <div className="flex w-full justify-end gap-2">
                            <Button onClick={() => setStep('scan')} variant="ghost">
                                {t('common.back')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full justify-end gap-2">
                            <Button onClick={() => setStep('verify')}>
                                {t('common.next')}
                            </Button>
                            <Button onClick={() => { setSetupOpen(false); setCode(''); }} variant="ghost">
                                {t('common.cancel')}
                            </Button>
                        </div>
                    )
                }
            >
                {step === 'scan' ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t('settings.security.two_factor.setup_description')}
                        </p>

                        {/* Tabs: QR Code / Manual */}
                        <div className="flex gap-1 bg-muted rounded-lg p-1">
                            <button
                                onClick={() => setTab('qr')}
                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'qr' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Icon icon="material-symbols:qr-code-rounded" className="size-4 mr-1.5 inline" />
                                QR Code
                            </button>
                            <button
                                onClick={() => setTab('manual')}
                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Icon icon="material-symbols:keyboard-rounded" className="size-4 mr-1.5 inline" />
                                Manual
                            </button>
                        </div>

                        {tab === 'qr' && qrCode && (
                            <div className="flex justify-center py-2">
                                <div className="bg-white rounded-lg border border-border">
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 p-2" />
                                </div>
                            </div>
                        )}

                        {tab === 'manual' && (
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    {t('settings.security.two_factor.manual_code')}
                                </p>
                                <code className="inline-block px-3 py-1.5 rounded bg-muted text-sm font-mono break-all">
                                    {secret}
                                </code>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        {verified ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <Icon icon="material-symbols:check-circle-rounded" className="size-10 text-green-500" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {t('settings.security.two_factor.verified')}
                                </span>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground text-center">
                                    {t('settings.security.two_factor.verify_description')}
                                </p>
                                <label className="text-sm font-medium">
                                    {t('settings.security.two_factor.verification_code')}
                                </label>
                                <InputOTP
                                    maxLength={6}
                                    value={code}
                                    onChange={setCode}
                                    onComplete={handleVerify}
                                    autoFocus
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </>
                        )}
                    </div>
                )}
            </ModalDrawer>
        </section>
    );
}
