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

    const [endMode, setEndMode] = useState(initial?.endMode || 'never')
    const [endUntil, setEndUntil] = useState(initial?.endUntil?.slice(0, 10) || '')
    const [endCount, setEndCount] = useState(initial?.endCount || 10)

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
            return
        }
        onChange({
            rule: finalRule,
            timeOfDay: null,
            startAt: startAtIso,
            endMode,
            endUntil: endMode === 'until' && endUntil ? `${endUntil}T23:59:59` : null,
            endCount: endMode === 'count' ? Number(endCount) || 1 : null,
        })
        // eslint-disable-next-line
    }, [enabled, finalRule, startAtIso, endMode, endUntil, endCount])

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
                endMode,
                endUntil: endMode === 'until' && endUntil ? `${endUntil}T23:59:59` : null,
                endCount: endMode === 'count' ? Number(endCount) || 1 : null,
            })
                .then(({ data }) => setPreview(data || []))
                .catch(() => setPreview([]))
                .finally(() => setLoadingPreview(false))
        }, 250)
        return () => clearTimeout(timer)
        // eslint-disable-next-line
    }, [enabled, finalRule, startAtIso, endMode, endUntil, endCount])

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
                        <label className="modal__label">Конец повторений</label>
                        <div className="recurrence-editor__radios">
                            <label className="recurrence-editor__radio">
                                <input
                                    type="radio"
                                    name="endMode"
                                    checked={endMode === 'never'}
                                    onChange={() => setEndMode('never')}
                                    disabled={disabled}
                                />
                                <span>Никогда</span>
                            </label>
                            <label className="recurrence-editor__radio">
                                <input
                                    type="radio"
                                    name="endMode"
                                    checked={endMode === 'until'}
                                    onChange={() => setEndMode('until')}
                                    disabled={disabled}
                                />
                                <span>До даты</span>
                            </label>
                            <label className="recurrence-editor__radio">
                                <input
                                    type="radio"
                                    name="endMode"
                                    checked={endMode === 'count'}
                                    onChange={() => setEndMode('count')}
                                    disabled={disabled}
                                />
                                <span>После N раз</span>
                            </label>
                        </div>

                        {endMode === 'until' && (
                            <input
                                className="input"
                                type="date"
                                value={endUntil}
                                onChange={(e) => setEndUntil(e.target.value)}
                                disabled={disabled}
                                style={{ marginTop: 8 }}
                            />
                        )}

                        {endMode === 'count' && (
                            <input
                                className="input"
                                type="number"
                                min="1"
                                max="9999"
                                value={endCount}
                                onChange={(e) => setEndCount(Math.max(1, Number(e.target.value) || 1))}
                                disabled={disabled}
                                style={{ marginTop: 8 }}
                            />
                        )}
                    </div>

                    <div className="recurrence-editor__preview">
                        <div className="recurrence-editor__preview-title">
                            Ближайшие вхождения:
                        </div>
                        {loadingPreview && <div className="recurrence-editor__preview-empty">…</div>}
                        {!loadingPreview && preview.length === 0 && (
                            <div className="recurrence-editor__preview-empty">Нет данных</div>
                        )}
                        {!loadingPreview && preview.length > 0 && (
                            <div className="recurrence-editor__preview-list">
                                {preview.map((iso, i) => (
                                    <span key={i} className="recurrence-editor__preview-item">
                                        {fmtPreview(iso)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="recurrence-editor__danger"
                        onClick={() => setEnabled(false)}
                        disabled={disabled}
                    >
                        Убрать повторение
                    </button>
                </div>
            )}
        </div>
    )
}