import type { Props } from './types'
import { useOtpCode } from './useOtpCode'
import './style.css'

export const InputOtpCode = ({
    disabled,
    error,
    inputCount,
    isAutoFocus = true,
    name,
    value,
    webOtpEnabled,
    onChange,
    onPasteWebOtp,
    onErrorWebOtp,
    onRestartWebOtp,
}: Props) => {
    const {
        autopasteMode,
        inputs,
        labelByIdx,
        valueInner,
        webOtpAttributes,
        handleFocus,
        handleInput,
        handleKeyDown,
    } = useOtpCode({
        disabled,
        error,
        inputCount,
        isAutoFocus,
        value,
        webOtpEnabled,
        onChange,
        onPasteWebOtp,
        onErrorWebOtp,
        onRestartWebOtp,
    })

    return (
        <>
            {/*
                web otp включается явным образом только на android;
                на ios это скрытое поле не нужно, так как для автозаполения используются 5 отдельных одноциферных полей
            */}
            {autopasteMode === 'web-otp' && (
                <input
                    {...webOtpAttributes}
                    type="hidden"
                    aria-hidden="true"
                />
            )}
            <div
                data-testid="input-otp-wrapper"
                className="wrapper"
                role="group"
                {...error
                    ? {
                        'aria-describedby': `${name}-error`,
                        'aria-invalid': 'true',
                    }
                    : {}
                }
            >
                {inputs.current.map((_, index) => (
                    <input
                        data-testid={`input-otp-${index}`}
                        aria-label={labelByIdx[index]}
                        aria-required="true"
                        autoComplete={
                            autopasteMode === 'ios-native'
                                ? 'one-time-code'
                                : 'off'
                        }
                        className="input"
                        data-index={index}
                        // Для a11y лучше не дизейблить поля, так как элемент пропадает из a11y tree focus navigation
                        readOnly={disabled}
                        inputMode="numeric"
                        type="tel"
                        key={index}
                        name={`${name}${index}`}
                        pattern="^[0-9]$"
                        ref={inputs.current[index]}
                        value={valueInner[index]}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                    />
                ))}
            </div>
        </>
    )
}