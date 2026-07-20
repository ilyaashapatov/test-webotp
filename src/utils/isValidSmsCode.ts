export const isValidSmsCode = (value: string, length: number) => {
    if (value && (typeof value === 'string' || typeof value === 'number')) {
        return value.trim().length === length
    }

    return false
}
