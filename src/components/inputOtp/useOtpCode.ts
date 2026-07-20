import { useRef, useCallback, useEffect, useState, createRef } from 'react'
import type { RefObject } from 'react'
import type React from 'react';

import { useWebOtp } from '../../hooks/useWebOtp'
import { bowserInstance } from '../../utils/browser'

type Props = {
    disabled?: boolean;
    error?: string;
    inputCount: number;
    isAutoFocus?: boolean;
    value: string;
    webOtpEnabled?: boolean;
    onChange: (value: string) => void;
    onErrorWebOtp?: (errorText: string) => void;
    onPasteWebOtp?: (value: string) => void;
    /** Колбэк, который получает функцию перезапуска WebOTP */
    onRestartWebOtp?: (restart: () => void) => void;
}

export const useOtpCode = ({
    disabled,
    error,
    inputCount,
    isAutoFocus = true,
    value,
    webOtpEnabled,
    onChange,
    onErrorWebOtp,
    onPasteWebOtp,
    onRestartWebOtp,
}: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [valueInner, setValueInner] = useState(Array.from({ length: inputCount }).map(() => ''))
    const prevValueInner = useRef(Array.from({ length: inputCount }).map(() => ''))
    const focusTimeout = useRef(null)
    const inputs = useRef<Array<RefObject<HTMLInputElement>>>(Array.from({ length: inputCount }).map(createRef<HTMLInputElement>))

    const innerToOuter = (inner: Array<string>) => inner.join('')
    const isNumeric = useCallback((v: string) => ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(v), [])

    const {
        webOtpAttributes,
        restartWebOtp,
    } = useWebOtp({
        // fieldValue: innerToOuter(valueInner),
        // isLoading: disabled,
        webOtpEnabled,
        handleSuccess: (otp) => {
            console.info(
                `[InputCode] handleSuccess: код "${otp}" (len=${otp?.length}, ожидается=${valueInner.length})`,
            )
            // Функциональное обновление — предотвращает замыкание на устаревший valueInner
            if (otp.length !== valueInner.length) {
                console.warn(`[InputCode] Invalid length of OTP, must be  ${valueInner.length}`)
            }
            setValueInner(valueInner.map((_, idx) => otp[idx] || ''))
            onPasteWebOtp?.(otp)
        },
        handleError: (errorText) => {
            onErrorWebOtp?.(errorText)
        },
    })

    const osName = (bowserInstance.getOSName() || '').toLowerCase()
    let autopasteMode: 'ios-native' | 'web-otp'
    if (['android'].includes(osName)) {
        autopasteMode = 'web-otp'
    } else if (['ios'].includes(osName)) {
        autopasteMode = 'ios-native'
    }

    const labelByIdx: Record<number, string> = {
        0: 'Первая цифра',
        1: 'Вторая цифра',
        2: 'Третья цифра',
        3: 'Четвёртая цифра',
        4: 'Пятая цифра',
        5: 'Шестая цифра',
        6: 'Седьмая цифра',
        7: 'Восьмая цифра',
        8: 'Девятая цифра',
        9: 'Десятая цифра',
    }

    const setFocus = useCallback((index: number) => {
        inputs.current[index].current?.focus()
    }, [])

    const updateChar = useCallback((targetIdx: number, enteredNumber: string) => {
        if (targetIdx < 0 || targetIdx >= valueInner.length) {
            return
        }

        setValueInner(valueInner.map((number, idx) => idx === targetIdx ? enteredNumber : number))
    }, [valueInner])

    const updateIndex = useCallback((targetIdx: number) => {
        if (targetIdx < 0 || targetIdx >= valueInner.length) {
            return
        }

        setCurrentIndex(targetIdx)
        setFocus(targetIdx)
    }, [setFocus, valueInner.length])

    const handleInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const { value: inputValue } = event.target

        // Многосимвольная вставка (paste / QuickType bar / autofill)
        if (inputValue.length > 1) {
            // Отбираем только цифры и ограничиваем длиной полей
            const digits = inputValue.replace(/\D/g, '').slice(0, valueInner.length)
            console.info(
                `[InputCode] Многосимвольная вставка: "${inputValue}" → цифры: "${digits}" (len=${digits.length}, ожидается=${valueInner.length})`,
                `event.target: autocomplete=${event.target.autocomplete}, type=${event.target.type}`,
            )
            if (digits.length > 0) {
                setValueInner((prev) => prev.map((_, idx) => digits[idx] || ''))
                // Курсор на следующую позицию после вставленного
                const nextIndex = Math.min(digits.length, valueInner.length - 1)
                setCurrentIndex(nextIndex)
                setFocus(nextIndex)
            }
            return
        }

        if (isNumeric(inputValue)) {
            // Ввод числа в текущий слот независимо от того, занят он или нет
            updateChar(currentIndex, inputValue)
            updateIndex(currentIndex + 1)
        } else {
            event.preventDefault()
        }
    }, [currentIndex, isNumeric, updateChar, updateIndex, setFocus, valueInner])

    const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        updateIndex(Number(event.currentTarget.getAttribute('data-index')))
    }, [updateIndex])

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = event
        if (key === 'Backspace') {
            /**
             * Стирание символа
             * Если на поле ошибка, то очищаем всё поле
             * Если слот занят, то очищаем значение в этом слоте
             * Если слот пустой, то стираем предыдущее значение и перемещаем индекс влево
             */
            if (error) {
                onChange('')
            } else if (valueInner[currentIndex]) {
                updateChar(currentIndex, '')
            } else {
                updateChar(currentIndex - 1, '')
                updateIndex(currentIndex - 1)
            }
        } else if (key === 'ArrowLeft') {
            updateIndex(currentIndex - 1)
        } else if (key === 'ArrowRight') {
            updateIndex(currentIndex + 1)
        }
    }, [currentIndex, updateChar, updateIndex, valueInner, error, onChange])

    /**
     * Изменение внутреннего значения обрабатывается только в этом месте
     * для централизованного прокидывания наружу
     */
    useEffect(() => {
        if (innerToOuter(valueInner) !== innerToOuter(prevValueInner.current)) {
            onChange(innerToOuter(valueInner))
        }

        prevValueInner.current = valueInner.map((v) => v)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueInner])

    /**
     * Значение СМС-кода может измениться извне
     */
    useEffect(() => {
        // Значение очистили снаружи, установка фокуса на первое поле
        if (value.length === 0 && !disabled) {
            setFocus(0)
        }
        // Значение изменили/очистили снаружи, пересчёт внутреннего значения
        if (value.length !== valueInner.length) {
            setValueInner(valueInner.map((_, idx) => value[idx] || ''))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, disabled])

    /**
     * При появлении ошибки (бэк) установка фокуса в нужное поле
     */
    useEffect(() => {
        if (error) {
            if (innerToOuter(valueInner).length === inputCount) {
                // Если СМС-код введён полностью, то фокус на последнее поле
                focusTimeout.current = setTimeout(() => {
                    setFocus(inputCount - 1)
                }, 0)
            } else if (innerToOuter(valueInner).length === 0) {
                // Если поле пустое, то фокус на первое поле
                focusTimeout.current = setTimeout(() => {
                    setFocus(0)
                }, 0)
            }
        }

        return () => {
            clearTimeout(focusTimeout.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    useEffect(() => {
        if (isAutoFocus) {
            setFocus(currentIndex)
        }

        if (onRestartWebOtp && restartWebOtp) {
            onRestartWebOtp(restartWebOtp)
        }
    }, [])

    return {
        autopasteMode,
        inputs,
        labelByIdx,
        valueInner,
        webOtpAttributes,
        handleFocus,
        handleInput,
        handleKeyDown,
    }
}