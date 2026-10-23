const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}

/** Смещение в днях → «Пн · нед. 1» (относительный календарь шаблона). */
export function formatSlot(offset) {
    if (offset == null || offset === '') return 'без дня'
    const value = Number(offset)
    if (!Number.isFinite(value) || value < 0) return 'без дня'
    return `${WEEKDAYS_SHORT[value % 7]} · нед. ${Math.floor(value / 7) + 1}`
}

/** «24:00» (полночь) показываем как 00:00. */
export function formatTime(value) {
    if (!value) return ''
    return String(value).slice(0, 5) === '24:00' ? '00:00' : String(value).slice(0, 5)
}
