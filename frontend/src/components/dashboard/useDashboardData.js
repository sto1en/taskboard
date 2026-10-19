// frontend/src/components/dashboard/useDashboardData.js

/**
 * Данные стартовой страницы.
 *
 * Один параллельный пакет запросов на весь дашборд вместо запроса из
 * каждого виджета: /stats?period=day, /stats/overview?period=week,
 * /calendar (сегодня + 6 дней), /achievements, /shop и /boards.
 *
 * Любая мутация задач/досок/проектов шлёт window-событие 'shop:invalidate'
 * (см. api.js). Здесь оно превращается в тихую перезагрузку данных, чтобы
 * «выполнено сегодня» и список задач не отставали от реальности.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
    achievementsApi,
    boardsApi,
    calendarApi,
    shopApi,
    statsApi,
} from '../../api/api'

export function toIso(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export function addDays(date, days) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

const EMPTY = {
    loading: true,
    error: null,
    today: toIso(new Date()),
    statsDay: null,
    statsWeek: null,
    days: [],
    achievements: [],
    shop: null,
    boards: [],
}

export default function useDashboardData() {
    const [state, setState] = useState(EMPTY)
    const timerRef = useRef(null)

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setState(prev => ({ ...prev, loading: true, error: null }))
        }

        const today = new Date()
        const todayIso = toIso(today)
        const from = todayIso
        const to = toIso(addDays(today, 6))

        const results = await Promise.allSettled([
            statsApi.get('day'),
            statsApi.overview('week'),
            calendarApi.get(from, to),
            achievementsApi.list(),
            shopApi.get(),
            boardsApi.list(),
        ])

        const value = (index, fallback) =>
            results[index].status === 'fulfilled'
                ? results[index].value?.data ?? fallback
                : fallback

        const failed = results.filter(r => r.status === 'rejected').length

        setState({
            loading: false,
            error: failed === results.length ? 'Не удалось загрузить данные' : null,
            today: todayIso,
            statsDay: value(0, null),
            statsWeek: value(1, null),
            days: value(2, { days: [] })?.days ?? [],
            achievements: value(3, []),
            shop: value(4, null),
            boards: value(5, []),
        })
    }, [])

    useEffect(() => {
        load()
    }, [load])

    useEffect(() => {
        const onInvalidate = () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => load({ silent: true }), 400)
        }
        window.addEventListener('shop:invalidate', onInvalidate)
        return () => {
            window.removeEventListener('shop:invalidate', onInvalidate)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [load])

    return { ...state, reload: load }
}
