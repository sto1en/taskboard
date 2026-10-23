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

/**
 * Локальная дата в формате YYYY-MM-DD.
 * Нельзя использовать toISOString(): он переводит в UTC, и для Москвы
 * (UTC+3) в 00:00–02:59 вернул бы вчерашний день.
 */
export function todayIsoDate(now = new Date()) {
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
}

/**
 * Дедлайн из формы уходит на бэкенд как LocalDateTime без часового пояса,
 * поэтому сравнивать его с «сегодня» нужно в тех же локальных строках,
 * а не через Date/toLocaleDateString — символ за символом YYYY-MM-DD.
 * Возвращает true, если дата строго раньше сегодняшнего дня.
 */
export function isDateInPast(isoDate, now = new Date()) {
    if (!isoDate) return false
    return isoDate < todayIsoDate(now)
}

// Цена в листьях: целое число с разделителем тысяч (2500 → «2 500»).
export function formatPrice(value) {
    if (value == null) return '0'
    return Number(value).toLocaleString('ru-RU')
}

export function resolveUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }
    // Относительные пути ('/uploads/..', '/avatars/..') отдаём как есть:
    // их проксирует тот же origin (Vite-dev или nginx), поэтому абсолютный
    // http://localhost:8082 ломал бы картинки при доступе по LAN/ngrok.
    if (url.startsWith('/')) {
        return url
    }
    // Голое имя файла -> стандартный префикс загрузок.
    return `/uploads/${url}`
}