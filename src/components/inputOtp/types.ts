import type React from 'react'

export type Props = {
    name: React.InputHTMLAttributes<HTMLInputElement>['name'];
    disabled?: React.InputHTMLAttributes<HTMLInputElement>['disabled'];

    error?: string;
    inputCount: number;
    isAutoFocus?: boolean;
    value: string;
    webOtpEnabled?: boolean;
    onChange: (value: string) => void;
    onPasteWebOtp?: (value: string) => void;
    onErrorWebOtp?: (errorText: string) => void;
    /** Колбэк, который получает функцию перезапуска WebOTP */
    onRestartWebOtp?: (restart: () => void) => void;
}
