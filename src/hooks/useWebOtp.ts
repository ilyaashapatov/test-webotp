import { useCallback, useEffect, useRef } from 'react'
import { SbolAbortController } from '../utils/abortController'
import { isValidSmsCode } from '../utils/isValidSmsCode'

const LOG_LABELS: Record<string, string> = {
    // eslint-disable-next-line @sbol/common/no-cyrillic-outside-cms
    webotp_started: 'WebOTP: запущен запрос кода',
    // eslint-disable-next-line @sbol/common/no-cyrillic-outside-cms
    webotp_dialog_shown: 'WebOTP: диалог показан, код получен',
    // eslint-disable-next-line @sbol/common/no-cyrillic-outside-cms
    webotp_dialog_dismissed: 'WebOTP: диалог отклонён',
    // eslint-disable-next-line @sbol/common/no-cyrillic-outside-cms
    webotp_aborted: 'WebOTP: запрос прерван (уход со страницы)',
    // eslint-disable-next-line @sbol/common/no-cyrillic-outside-cms
    webotp_retry: 'WebOTP: повторный запуск',
}

/** Метрики жизненного цикла WebOTP + дебаг-лог */
const trackWebOtp = (event: string, value?: string): void => {
    console.info(LOG_LABELS[event] || `WebOTP: ${event}`, value ? `value: ${value}` : 'no_value')
}

/** Проверка поддержки WebOTP API браузером */
export const isWebOtpSupported = (): boolean =>
    'OTPCredential' in window && 'credentials' in navigator

/** Вызов WebOTP API — получение одноразового кода из SMS */
export const fetchOtpCode = async (signal?: AbortSignal): Promise<string> => {
    const otp = await navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal,
    } as CredentialRequestOptions) as OTPCredential

    console.info('[fetchOtpCode] resolved, code=', otp?.code ?? null)
    return otp.code ?? null
}

/** Проверка, что код — валидный SMS-код нужной длины */
export const isOtpCodeValid = (code: string): boolean =>
    code ? isValidSmsCode(code, 5) : false

type Props = {
    // fieldValue: string;
    // isLoading: boolean;
    webOtpEnabled: boolean;
    handleError: (errorText: string) => void;
    handleSuccess: (value: string) => void;
}

type Attributes = {
    autoComplete?: 'one-time-code';
    inputMode?: 'numeric';
    type?: 'text';
}

type ReturnType = {
    webOtpAttributes: Attributes;
    /** Повторный запуск WebOTP (например, после повторной отправки SMS) */
    restartWebOtp: () => void;
}

export const useWebOtp = ({
    webOtpEnabled,
    handleError,
    handleSuccess,
}: Props): ReturnType => {
    const abortController = useRef<SbolAbortController | null>(null)
    const webOtpAttributes = useRef<Attributes>(webOtpEnabled
        ? {
            autoComplete: 'one-time-code',
            inputMode: 'numeric',
            type: 'text',
        }
        : {})
    const abortSignalController = () => {
        if (!abortController.current) {
            const ctrl = new SbolAbortController()
            ctrl.init()
            abortController.current = ctrl
        }
        return abortController.current
    }
    const abortAndCleanup = () => {
        abortController.current?.abort()
    }
    const startListening = useCallback(() => {
        if (!webOtpEnabled || !isWebOtpSupported()) {
            return
        }
        trackWebOtp('webotp_started')
        fetchOtpCode(abortSignalController().signal())
            .then((code) => {
                trackWebOtp('webotp_dialog_shown', code)
                if (isOtpCodeValid(code)) {
                    handleSuccess(code)
                }
            })
            .catch((exception: Error) => {
                if (exception?.name !== 'AbortError') {
                    handleError(
                        typeof exception?.message === 'string'
                            ? exception.message
                            // eslint-disable-next-line @sbol/common/no-cyrillic-outside-cms
                            : 'Неизвестная ошибка',
                    )
                    trackWebOtp('webotp_dialog_dismissed')
                } else {
                    trackWebOtp('webotp_aborted')
                }
                abortAndCleanup()
            })
    }, [webOtpEnabled, handleSuccess, handleError])

    const restartWebOtp = useCallback(() => {
        abortController.current?.abort()
        abortController.current = null
        trackWebOtp('webotp_retry')
        startListening()
    }, [startListening])

    useEffect(() => {
        startListening()
        return () => abortAndCleanup()
    }, [])

    return {
        webOtpAttributes: webOtpAttributes.current,
        restartWebOtp,
    }
}