import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { guidesApi } from '../api/api'
import ApplyPlanModal from '../components/templates/ApplyPlanModal'
import Modal from '../components/modal/Modal'

const PERIOD_LABEL = { WEEK: 'Неделя', MONTH: 'Месяц', CUSTOM: 'Свой период' }
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function todayIso() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseIso(iso) {
    return new Date(`${iso}T12:00:00`)
}

function toIso(date) {
    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(iso, days) {
    const d = parseIso(iso)
    d.setDate(d.getDate() + days)
    return toIso(d)
}

function startOfWeekMonday(date) {
    const d = new Date(date)
    const day = d.getDay() === 0 ? 7 : d.getDay()
    d.setDate(d.getDate() - (day - 1))
    return d
}

function formatShort(iso) {
    return parseIso(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatLong(iso) {
    return parseIso(iso).toLocaleDateString('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

function Stars({ value = 0 }) {
    if (!value) return null
    return (
        <span className="guide-stars" title={`Приоритет ${value}`}>
            {'★'.repeat(Math.min(5, value))}
        </span>
    )
}

export default function GuideDetailPage() {
    const { id } = useParams()
    const [guide, setGuide] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [startDate, setStartDate] = useState(todayIso())
    const [mode, setMode] = useState('week')
    const [selected, setSelected] = useState(null)
    const [applyOpen, setApplyOpen] = useState(false)
    const [checked, setChecked] = useState({})

    useEffect(() => {
        setLoading(true)
        guidesApi.get(id)
            .then(({ data }) => {
                setGuide(data)
                setMode(data.periodType === 'MONTH' ? 'month' : 'week')
            })
            .catch((err) => setError(err.response?.data?.message || 'Не удалось открыть гайд'))
            .finally(() => setLoading(false))
    }, [id])

    const tasks = guide?.tasks || []

    const byDate = useMemo(() => {
        const map = {}
        for (const task of tasks) {
            const date = addDays(startDate, task.dayOffset || 0)
            if (!map[date]) map[date] = []
            map[date].push(task)
        }
        return map
    }, [tasks, startDate])

    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(startDate, i)),
        [startDate]
    )

    const monthDays = useMemo(() => {
        const base = parseIso(startDate)
        const first = new Date(base.getFullYear(), base.getMonth(), 1, 12)
        const gridStart = startOfWeekMonday(first)
        return Array.from({ length: 42 }, (_, i) => addDays(toIso(gridStart), i))
    }, [startDate])

    const monthIndex = parseIso(startDate).getMonth()

    const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0)
    const subtaskTotal = tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0)
    const daySpan = tasks.reduce((max, t) => Math.max(max, t.dayOffset || 0), 0) + 1

    const handleApply = async (payload) => {
        const { data } = await guidesApi.apply(guide.id, payload)
        return data
    }

    const openTask = (task) => {
        setSelected(task)
        setChecked({})
    }

    const toggleCheck = (index) => {
        setChecked(prev => ({ ...prev, [index]: !prev[index] }))
    }

    if (loading) return <div className="loading">Открываем гайд…</div>
    if (error) return <div className="error">{error}</div>
    if (!guide) return null

    const selectedDeadline = selected ? addDays(startDate, selected.dayOffset || 0) : null

    return (
        <div className="guide-detail">
            <div className="guide-detail__top">
                <Link to="/guides" className="btn btn-ghost btn-sm">← Ко всем гайдам</Link>
                <div className="guide-detail__badges">
                    <span className="guide-badge">{PERIOD_LABEL[guide.periodType] || 'Гайд'}</span>
                    {guide.isSystem
                        ? <span className="guide-badge guide-badge--system">встроенный</span>
                        : <span className="guide-badge guide-badge--mine">мой</span>}
                </div>
            </div>

            <header className={`guide-detail__hero guide-detail__hero--${guide.accent || 'blue'}`}>
                <div className="guide-detail__emoji">{guide.emoji || '📅'}</div>
                <div className="guide-detail__hero-text">
                    <h1 className="guide-detail__title">{guide.title}</h1>
                    {guide.subtitle && <p className="guide-detail__subtitle">{guide.subtitle}</p>}
                    {guide.description && <p className="guide-detail__desc">{guide.description}</p>}
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setApplyOpen(true)}>
                    Применить на доску
                </button>
            </header>

            <section className="guide-detail__stats">
                <div className="guide-stat">
                    <span className="guide-stat__value">{tasks.length}</span>
                    <span className="guide-stat__label">задач</span>
                </div>
                <div className="guide-stat">
                    <span className="guide-stat__value">{daySpan}</span>
                    <span className="guide-stat__label">дней</span>
                </div>
                <div className="guide-stat">
                    <span className="guide-stat__value">{subtaskTotal}</span>
                    <span className="guide-stat__label">подзадач</span>
                </div>
                <div className="guide-stat">
                    <span className="guide-stat__value">
                        {totalMinutes >= 60 ? `${Math.round(totalMinutes / 60)} ч` : `${totalMinutes} мин`}
                    </span>
                    <span className="guide-stat__label">оценка времени</span>
                </div>
            </section>

            <div className="guide-detail__toolbar">
                <label className="guide-detail__date">
                    <span>Старт гайда</span>
                    <input
                        type="date"
                        className="input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value || todayIso())}
                    />
                </label>

                <div className="guide-view-switch">
                    <button
                        type="button"
                        className={mode === 'week' ? 'active' : ''}
                        onClick={() => setMode('week')}
                    >Неделя</button>
                    <button
                        type="button"
                        className={mode === 'month' ? 'active' : ''}
                        onClick={() => setMode('month')}
                    >Месяц</button>
                    <button
                        type="button"
                        className={mode === 'list' ? 'active' : ''}
                        onClick={() => setMode('list')}
                    >Список</button>
                </div>
            </div>

            {tasks.length === 0 && (
                <div className="guides-empty">
                    <div className="guides-empty__icon">📭</div>
                    <h3>В гайде пока нет задач</h3>
                    <p>Откройте раздел «Гайды» и отредактируйте этот сценарий.</p>
                </div>
            )}

            {tasks.length > 0 && mode === 'week' && (
                <div className="guide-calendar guide-calendar--week">
                    {weekDays.map((day, index) => {
                        const dayTasks = byDate[day] || []
                        return (
                            <div className="guide-day" key={day}>
                                <div className="guide-day__head">
                                    <span className="guide-day__weekday">{WEEKDAYS[index % 7]}</span>
                                    <span className="guide-day__date">{formatShort(day)}</span>
                                    <span className="guide-day__offset">день {index}</span>
                                </div>
                                <div className="guide-day__body">
                                    {dayTasks.map(task => (
                                        <button
                                            type="button"
                                            key={task.id}
                                            className="guide-task"
                                            onClick={() => openTask(task)}
                                        >
                                            <span className="guide-task__title">{task.title}</span>
                                            <span className="guide-task__meta">
                                                <Stars value={task.priority} />
                                                {task.subtasks?.length > 0 && (
                                                    <span>☑ {task.subtasks.length}</span>
                                                )}
                                                {task.estimatedMinutes ? (
                                                    <span>~{task.estimatedMinutes} мин</span>
                                                ) : null}
                                            </span>
                                        </button>
                                    ))}
                                    {dayTasks.length === 0 && (
                                        <div className="guide-day__empty">свободно</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {tasks.length > 0 && mode === 'month' && (
                <div className="guide-calendar guide-calendar--month">
                    <div className="guide-month__weekdays">
                        {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="guide-month__grid">
                        {monthDays.map(day => {
                            const dayTasks = byDate[day] || []
                            const date = parseIso(day)
                            const outside = date.getMonth() !== monthIndex
                            return (
                                <div className={`guide-month__cell ${outside ? 'guide-month__cell--outside' : ''}`} key={day}>
                                    <div className="guide-month__date">
                                        {date.getDate()}
                                        {day === startDate && <span className="guide-month__start">старт</span>}
                                    </div>
                                    <div className="guide-month__tasks">
                                        {dayTasks.slice(0, 3).map(task => (
                                            <button
                                                type="button"
                                                key={task.id}
                                                className="guide-task guide-task--compact"
                                                onClick={() => openTask(task)}
                                            >
                                                {task.title}
                                            </button>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <div className="guide-month__more">+{dayTasks.length - 3}</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {tasks.length > 0 && mode === 'list' && (
                <div className="guide-list">
                    {tasks.map(task => {
                        const deadline = addDays(startDate, task.dayOffset || 0)
                        return (
                            <button
                                type="button"
                                className="guide-list__row"
                                key={task.id}
                                onClick={() => openTask(task)}
                            >
                                <span className="guide-list__day">День {task.dayOffset || 0}</span>
                                <span className="guide-list__body">
                                    <span className="guide-list__title">{task.title}</span>
                                    {task.description && (
                                        <span className="guide-list__desc">{task.description}</span>
                                    )}
                                </span>
                                <span className="guide-list__meta">
                                    <Stars value={task.priority} />
                                    <span>{formatShort(deadline)}</span>
                                    {task.subtasks?.length > 0 && <span>☑ {task.subtasks.length}</span>}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.title || ''}
                footer={
                    <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                        Закрыть
                    </button>
                }
            >
                {selected && (
                    <div className="guide-task-detail">
                        <div className="guide-task-detail__meta">
                            <span className="guide-badge">День {selected.dayOffset || 0}</span>
                            <span>📅 {formatLong(selectedDeadline)}</span>
                            {selected.estimatedMinutes ? <span>⏱ {selected.estimatedMinutes} мин</span> : null}
                            <Stars value={selected.priority} />
                        </div>

                        {selected.description ? (
                            <p className="guide-task-detail__desc">{selected.description}</p>
                        ) : (
                            <p className="guide-task-detail__desc guide-task-detail__desc--empty">
                                Без описания — при применении на доску задача создастся с пустым описанием.
                            </p>
                        )}

                        {selected.subtasks?.length > 0 && (
                            <div className="guide-task-detail__subtasks">
                                <div className="guide-task-detail__subtitle">Подзадачи</div>
                                <ul>
                                    {selected.subtasks.map((sub, i) => (
                                        <li key={`${sub}-${i}`}>
                                            <label className="check">
                                                <input
                                                    type="checkbox"
                                                    checked={!!checked[i]}
                                                    onChange={() => toggleCheck(i)}
                                                />
                                                <span>{sub}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ApplyPlanModal
                open={applyOpen}
                onClose={() => setApplyOpen(false)}
                title={`Применить «${guide.title}»`}
                plan={tasks}
                defaultProjectTitle={guide.title}
                defaultProjectDescription={guide.description}
                onApply={handleApply}
            />
        </div>
    )
}
