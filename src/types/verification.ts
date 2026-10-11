/**
 * Verification (2FA) challenge types.
 *
 * Mirrors the server's `/auth/methods` registry. The `input` field is a
 * discriminated union describing what the client must collect — a code to type or
 * a WebAuthn ceremony to run — so the UI never has to hardcode method names.
 */

export type VerificationCodeCharset = 'numeric' | 'alphanumeric' | 'hex';

export interface VerificationInputCode {
    type: 'code';
    /** Number of characters expected. */
    length: number;
    /** Accepted character set. */
    charset: VerificationCodeCharset;
}

export interface VerificationInputPasskey {
    type: 'passkey';
    /** Ceremony endpoints: `${base}/options` then `${base}/verify`. */
    base: string;
}

export type VerificationInput = VerificationInputCode | VerificationInputPasskey;

export interface VerificationDetails {
    /** Whether a challenge can be sent to the user (e.g. by email). */
    sendable: boolean;
    /** Free-form method data, forwarded to the send endpoint. */
    data: Record<string, unknown>;
    /** What the client must collect to complete the challenge. */
    input: VerificationInput;
    /** Seconds to wait before allowing a resend. */
    cooldown?: number | null;
}

export interface VerificationMethod {
    type: string;
    name: string;
    description: string;
    enabled: boolean;
    details: VerificationDetails | null;
}
