export {}

declare global {
    interface OTPCredential extends Credential {
        code: string;
    }

    interface Window {
        otp?: OTPCredential | null
    }
}