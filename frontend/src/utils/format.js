// src/utils/format.js

export function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}

export function formatDeadline(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
    return hasTime
        ? d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
}

export function splitDeadline(value) {
    if (!value) return { date: '', time: '', hasTime: false }
    if (value.includes('T')) {
        const [date, time] = value.split('T')
        const timeShort = time.slice(0, 5)
        const hasTime = timeShort !== '00:00'
        return { date, time: timeShort, hasTime }
    }
    return { date: value, time: '', hasTime: false }
}

export function buildDeadline(date, time, hasTime) {
    if (!date) return null
    if (hasTime && time) return `${date}T${time}:00`
    return `${date}T00:00:00`
}

export function resolveUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url
    }
    return `/uploads/${url}`
}