import { useEffect, useMemo, useState } from 'react'
import { recurrenceApi } from '../../api/api'

const UNITS = [
    { code: 'm', label: 'минут' },
    { code: 'h', label: 'часов' },
    { code: 'd', label: 'дней' },
    { code: 'w', label: 'недель' },
    { code: 'M', label: 'месяцев' },
    { code: 'y', label: 'лет' },
]

const MAX_COPIES = 100

function parseRule(rule) {
    if (!rule) return { n: 1, unit: 'd' }
    if (rule.startsWith('every:')) {
        const arg = rule.slice(6)
        const unit = arg.charAt(arg.length - 1)
        const n = parseInt(arg.slice(0, -1), 10)
        return { n: isNaN(n) ? 1 : n, unit }
    }
    if (rule.startsWith('hourly')) {
        const arg = rule.split(':')[1]
        const n = parseInt(arg || '1', 10)
        return { n: isNaN(n) ? 1 : n, unit: 'h' }
    }
    if (rule === 'daily')   return { n: 1, unit: 'd' }
    if (rule === 'weekly')  return { n: 1, unit: 'w' }
    if (rule === 'monthly') return { n: 1, unit: 'M' }
    if (rule === 'yearly')  return { n: 1, unit: 'y' }
    return { n: 1, unit: 'd' }
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
    const [n, setN] = useState(parsed.n)
    const [unit, setUnit] = useState(parsed.unit)

    const [startDate, setStartDate] = useState(
        initial?.startAt
            ? initial.startAt.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
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

    const finalRule = useMemo(() => `every:${Math.max(1, n)}${unit}`, [n, unit])

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