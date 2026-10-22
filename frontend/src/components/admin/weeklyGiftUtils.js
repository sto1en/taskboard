/** Вспомогательные функции для админки подарков недели. */

export const GIFT_TYPES = [
    { code: 'TREE', label: 'Деревья', icon: '🌳' },
    { code: 'FRAME', label: 'Рамки', icon: '🖼' },
    { code: 'AVATAR', label: 'Аватарки', icon: '🙂' },
    { code: 'ACCENT', label: 'Акценты', icon: '🎨' },
]

export function isoDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/** Ближайший понедельник (если сегодня понедельник — следующий). */
export function nextMonday() {
    const d = new Date()
    const diff = (8 - d.getDay()) % 7 || 7
    d.setDate(d.getDate() + diff)
    return isoDate(d)
}

/** Понедельник недели, в которую попадает дата. */
export function mondayOf(iso) {
    if (!iso) return ''
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return isoDate(d)
}

export function addDays(iso, days) {
    if (!iso) return ''
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    d.setDate(d.getDate() + days)
    return isoDate(d)
}

export function formatRange(start, end) {
    const fmt = (iso) => {
        if (!iso) return ''
        const d = new Date(`${iso}T00:00:00`)
        return Number.isNaN(d.getTime())
            ? iso
            : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return `${fmt(start)} — ${fmt(end)}`
}

export function formatWeekday(iso) {
    if (!iso) return ''
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ru-RU', { weekday: 'short' })
}

export function pluralize(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}
