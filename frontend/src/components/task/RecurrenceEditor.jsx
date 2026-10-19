import { useEffect, useMemo, useRef, useState } from 'react'
import { recurrenceApi } from '../../api/api'

const UNITS = [
    { code: 'd', label: 'дней' },
    { code: 'w', label: 'недель' },
    { code: 'M', label: 'месяцев' },
    { code: 'y', label: 'лет' },
]

const MAX_COPIES = 100

const WEEKDAYS = [
    { n: 1, label: 'Пн' },
    { n: 2, label: 'Вт' },
    { n: 3, label: 'Ср' },
    { n: 4, label: 'Чт' },
    { n: 5, label: 'Пт' },
    { n: 6, label: 'Сб' },
    { n: 7, label: 'Вс' },
]

const PRESETS = [
    { code: 'daily', label: 'Каждый день' },
    { code: 'weekly', label: 'Каждую неделю' },
    { code: 'monthly', label: 'Каждый месяц' },
    { code: 'yearly', label: 'Каждый год' },
    { code: 'custom', label: 'Другое' },
]

/** Единицы, которые больше не поддерживаются — конвертируем в дни. */
const DEPRECATED_UNITS = new Set(['m', 'h'])

function parseRule(rule) {
    if (!rule) return { n: 1, unit: 'd', mode: 'daily', weekdays: [] }

    if (rule.startsWith('weekly:')) {
        const weekdays = rule.slice(7)
            .split(',')
            .map(v => parseInt(v, 10))
            .filter(v => v >= 1 && v <= 7)
        return { n: 1, unit: 'w', mode: 'weekly', weekdays: weekdays.length ? weekdays : [1] }
    }

    if (rule.startsWith('every:')) {
        const arg = rule.slice(6)
        const unit = arg.charAt(arg.length - 1)
        const n = parseInt(arg.slice(0, -1), 10)
        // если единица устаревшая — принудительно день
        if (DEPRECATED_UNITS.has(unit)) {
            return { n: Math.max(1, isNaN(n) ? 1 : n), unit: 'd', mode: 'custom', weekdays: [] }
        }
        if (!UNITS.some(u => u.code === unit)) {
            return { n: 1, unit: 'd', mode: 'daily', weekdays: [] }
        }
        const safeN = isNaN(n) ? 1 : n
        const mode = safeN === 1
            ? ({ d: 'daily', w: 'weekly', M: 'monthly', y: 'yearly' }[unit] || 'custom')
            : 'custom'
        return { n: safeN, unit, mode, weekdays: [] }
    }

    // 'hourly:*' и 'daily/weekly/...' — нормализуем
    if (rule.startsWith('hourly')) {
        // бывшие часовые повторения — переводим в 1 день
        return { n: 1, unit: 'd', mode: 'daily', weekdays: [] }
    }
    if (rule === 'daily')   return { n: 1, unit: 'd', mode: 'daily', weekdays: [] }
    if (rule === 'weekly')  return { n: 1, unit: 'w', mode: 'weekly', weekdays: [1] }
    if (rule === 'monthly') return { n: 1, unit: 'M', mode: 'monthly', weekdays: [] }
    if (rule === 'yearly')  return { n: 1, unit: 'y', mode: 'yearly', weekdays: [] }
    return { n: 1, unit: 'd', mode: 'daily', weekdays: [] }
}

function todayLocalIso() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function fmtDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function fmtPreview(iso) {
    if (!iso) return ''
    return `${fmtDate(iso)} ${fmtTime(iso)}`
}

export default function RecurrenceEditor({ taskId, initial, onChange, disabled = false }) {
    const parsed = parseRule(initial?.rule)

    const [enabled, setEnabled] = useState(!!initial)
    const [mode, setMode] = useState(parsed.mode)
    const [n, setN] = useState(parsed.n)
    const [unit, setUnit] = useState(parsed.unit)
    const [weekdays, setWeekdays] = useState(parsed.weekdays)

    const [startDate, setStartDate] = useState(
        initial?.startAt
            ? initial.startAt.slice(0, 10)
            : todayLocalIso()
    )
    const [startTime, setStartTime] = useState(
        initial?.startAt
            ? initial.startAt.slice(11, 16)
            : `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    )

    const [count, setCount] = useState(initial?.endCount || 10)
    const [error, setError] = useState(null)

    const [preview, setPreview] = useState([])
    const [loadingPreview, setLoadingPreview] = useState(false)

    // Первый прогон эффекта — это инициализация формы, а не правка пользователя.
    // Без этого TaskDetailModal сразу считал задачу «изменённой» и спрашивал
    // подтверждение при любом закрытии.
    const initializedRef = useRef(false)

    const finalRule = useMemo(() => {
        if (mode === 'daily') return 'daily'
        if (mode === 'weekly') {
            const days = [...new Set(weekdays)].sort((a, b) => a - b)
            return days.length ? `weekly:${days.join(',')}` : 'weekly'
        }
        if (mode === 'monthly') return 'monthly'
        if (mode === 'yearly') return 'yearly'
        return `every:${Math.max(1, n)}${unit}`
    }, [mode, weekdays, n, unit])

    const startAtIso = useMemo(() => {
        if (!startDate) return null
        const t = startTime && startTime.length === 5 ? `${startTime}:00` : '00:00:00'
        return `${startDate}T${t}`
    }, [startDate, startTime])

    useEffect(() => {
        if (!enabled) {
            onChange(null)
            setError(null)
            return
        }
        if (!count || count < 1) {
            setError('Укажите количество копий')
            onChange(null)
            return
        }
        if (count > MAX_COPIES) {
            setError(`Максимум ${MAX_COPIES} копий`)
            onChange(null)
            return
        }
        setError(null)
        if (!initializedRef.current) {
            initializedRef.current = true
            // Пропускаем только стартовую нормализацию уже сохранённого
            // правила. Если повторения не было, включение тумблера — это
            // действие пользователя, его нельзя терять.
            if (initial) return
        }
        onChange({
            rule: finalRule,
            timeOfDay: null,
            startAt: startAtIso,
            endMode: 'count',
            endUntil: null,
            endCount: Number(count),
        })
        // eslint-disable-next-line
    }, [enabled, finalRule, startAtIso, count])

    useEffect(() => {
        if (!enabled || !startAtIso) {
            setPreview([])
            return
        }
        setLoadingPreview(true)
        const timer = setTimeout(() => {
            recurrenceApi.preview({
                rule: finalRule,
                startAt: startAtIso,
                endMode: 'count',
                endCount: Number(count) || 1,
            })
                .then(({ data }) => setPreview(data || []))
                .catch(() => setPreview([]))
                .finally(() => setLoadingPreview(false))
        }, 250)
        return () => clearTimeout(timer)
        // eslint-disable-next-line
    }, [enabled, finalRule, startAtIso, count])

    return (
        <div className="recurrence-editor">
            <div className="toggle-row">
                <span className="toggle-row__label">🔁 Повторять задачу</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={disabled}
                    className={`toggle ${enabled ? 'toggle--on' : ''}`}
                    onClick={() => setEnabled(v => !v)}
                >
                    <span className="toggle__thumb" />
                </button>
            </div>

            {enabled && (
                <div className="recurrence-editor__body">

                    <div className="modal__row">
                        <div className="modal__field">
                            <label className="modal__label">Начать с даты</label>
                            <input
                                className="input"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                        <div className="modal__field">
                            <label className="modal__label">Время начала</label>
                            <input
                                className="input"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Как повторять</label>
                        <div className="recurrence-editor__presets">
                            {PRESETS.map(p => (
                                <button
                                    key={p.code}
                                    type="button"
                                    className={`recurrence-editor__preset ${mode === p.code ? 'recurrence-editor__preset--active' : ''}`}
                                    onClick={() => {
                                        setMode(p.code)
                                        if (p.code === 'weekly' && weekdays.length === 0) {
                                            setWeekdays([1])
                                        }
                                    }}
                                    disabled={disabled}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {mode === 'weekly' && (
                        <div className="modal__field">
                            <label className="modal__label">Дни недели</label>
                            <div className="recurrence-editor__weekdays">
                                {WEEKDAYS.map(day => {
                                    const on = weekdays.includes(day.n)
                                    return (
                                        <button
                                            key={day.n}
                                            type="button"
                                            className={`recurrence-editor__weekday ${on ? 'recurrence-editor__weekday--on' : ''}`}
                                            onClick={() => setWeekdays(prev => {
                                                if (prev.includes(day.n)) {
                                                    const next = prev.filter(x => x !== day.n)
                                                    return next.length ? next : prev
                                                }
                                                return [...prev, day.n]
                                            })}
                                            disabled={disabled}
                                        >
                                            {day.label}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="recurrence-editor__hint">
                                Например, только по средам и пятницам.
                            </div>
                        </div>
                    )}

                    {mode === 'custom' && (
                        <div className="modal__row">
                            <div className="modal__field">
                                <label className="modal__label">Каждые</label>
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={n}
                                    onChange={(e) => setN(Math.max(1, Number(e.target.value) || 1))}
                                    disabled={disabled}
                                />
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">Единица</label>
                                <select
                                    className="input"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    disabled={disabled}
                                >
                                    {UNITS.map(u => (
                                        <option key={u.code} value={u.code}>{u.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="modal__field">
                        <label className="modal__label">
                            Сколько копий создать (макс. {MAX_COPIES})
                        </label>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            max={MAX_COPIES}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value) || 1)}
                            disabled={disabled}
                        />
                    </div>

                    {error && (
                        <div className="modal__error">{error}</div>
                    )}

                    <div className="recurrence-editor__preview">
                        <div className="recurrence-editor__preview-title">
                            Будет создано {Math.min(Number(count) || 0, MAX_COPIES)} копий:
                        </div>
                        {loadingPreview && <div className="recurrence-editor__preview-empty">…</div>}
                        {!loadingPreview && preview.length === 0 && (
                            <div className="recurrence-editor__preview-empty">Нет данных</div>
                        )}
                        {!loadingPreview && preview.length > 0 && (
                            <div className="recurrence-editor__preview-list">
                                {preview.slice(0, 10).map((iso, i) => (
                                    <span key={i} className="recurrence-editor__preview-item">
                                        {fmtPreview(iso)}
                                    </span>
                                ))}
                                {preview.length > 10 && (
                                    <span className="recurrence-editor__preview-item recurrence-editor__preview-item--more">
                                        + ещё {preview.length - 10}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}