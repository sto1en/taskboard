import { useMemo, useState } from 'react'

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const VIEWS = [
    { code: 'day', label: 'День' },
    { code: 'week', label: 'Неделя' },
    { code: 'month', label: 'Месяц' },
    { code: 'year', label: 'Год' },
]
const WEEKS_PER_MONTH = 4
const TOTAL_WEEKS = 12 * WEEKS_PER_MONTH

/**
 * Базовые часы дня: задача без явного времени встаёт в один из этих слотов.
 * 24 → полночь (00:00).
 */
export const DAY_HOURS = ['09:00', '12:00', '15:00', '18:00', '21:00', '24:00']

const clampWeek = (week) => Math.max(0, Math.min(TOTAL_WEEKS - 1, week))
const slotOffset = (week, weekday) => week * 7 + weekday

/** '24:00' — это 00:00 следующего дня, для сортировки/отображения. */
function hourKey(value) {
    if (!value) return null
    const [h, m] = String(value).split(':').map(Number)
    if (!Number.isFinite(h)) return null
    return { h: h === 24 ? 24 : h, m: Number.isFinite(m) ? m : 0 }
}

function hourLabel(value) {
    const key = hourKey(value)
    if (!key) return ''
    return key.h === 24 ? '00:00' : `${String(key.h).padStart(2, '0')}:${String(key.m).padStart(2, '0')}`
}

/** Ближайший базовый час: пустая задача встаёт в первый слот (09:00). */
function nearestHour(value) {
    const key = hourKey(value)
    if (!key) return DAY_HOURS[0]
    let best = DAY_HOURS[0]
    let bestDelta = Number.POSITIVE_INFINITY
    for (const hour of DAY_HOURS) {
        const candidate = hourKey(hour)
        const delta = Math.abs(candidate.h * 60 + candidate.m - (key.h * 60 + key.m))
        if (delta < bestDelta) {
            best = hour
            bestDelta = delta
        }
    }
    return best
}

function monthOfWeek(week) {
    return Math.floor(week / WEEKS_PER_MONTH) + 1
}

function weekInMonth(week) {
    return (week % WEEKS_PER_MONTH) + 1
}

/**
 * Календарь шаблона без привязки к числам.
 * Шаблон живёт в относительном времени: месяц → 4 недели → 7 дней.
 * Задачи хранятся как смещение в днях (0 = понедельник первой недели).
 */
export default function TemplatePlanner({
    items,
    viewState,
    onViewStateChange,
    selectedKey,
    onSelectItem,
    onAssign,
    onAddForSlot,
    onAddForSlotAtTime,
}) {
    const { view, weekIndex, dayWeekday } = viewState
    const monthIndex = Math.floor(weekIndex / WEEKS_PER_MONTH)
    const [dragOver, setDragOver] = useState(null)
    const [draggingKey, setDraggingKey] = useState(null)

    const tasksBySlot = useMemo(() => {
        const map = {}
        for (const item of items) {
            if (item.deadlineOffsetDays === '' || item.deadlineOffsetDays == null) continue
            const offset = Number(item.deadlineOffsetDays)
            if (!Number.isFinite(offset) || offset < 0) continue
            const week = Math.floor(offset / 7)
            if (week >= TOTAL_WEEKS) continue
            const weekday = offset % 7
            const key = `${week}-${weekday}`
            if (!map[key]) map[key] = []
            map[key].push(item)
        }
        return map
    }, [items])

    const tasksAt = (week, weekday) => tasksBySlot[`${week}-${weekday}`] || []

    const handleDragStart = (e, item) => {
        setDraggingKey(item.key)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', item.key)
    }

    const handleDragEnd = () => {
        setDraggingKey(null)
        setDragOver(null)
    }

    const canDrop = (e) => (
        draggingKey || (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('text/plain'))
    )

    const handleDragOver = (e, slot) => {
        if (!canDrop(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOver !== slot) setDragOver(slot)
    }

    const handleDrop = (e, week, weekday) => {
        e.preventDefault()
        const key = e.dataTransfer.getData('text/plain') || draggingKey
        setDraggingKey(null)
        setDragOver(null)
        if (!key) return
        onAssign(key, slotOffset(week, weekday))
    }

    const openMonth = (index) => {
        onViewStateChange({ weekIndex: index * WEEKS_PER_MONTH, view: 'month' })
    }

    /** Клик по дню недели в недельном виде — открыть этот день. */
    const openDay = (week, weekday) => {
        setDragOver(null)
        onViewStateChange({
            weekIndex: clampWeek(week),
            dayWeekday: weekday,
            view: 'day',
        })
    }

    /** Клик по ярлыку недели в месячном виде — открыть эту неделю. */
    const openWeek = (week) => {
        setDragOver(null)
        onViewStateChange({ weekIndex: clampWeek(week), view: 'week' })
    }

    const changeView = (nextView) => {
        setDragOver(null)
        onViewStateChange({ view: nextView })
    }

    const renderChip = (item, week, weekday, compact = false) => (
        <div
            key={item.key}
            className={[
                'tplan-chip',
                compact ? 'tplan-chip--compact' : '',
                selectedKey === item.key ? 'tplan-chip--selected' : '',
                draggingKey === item.key ? 'tplan-chip--dragging' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
                e.stopPropagation()
                onSelectItem(item.key)
            }}
            title={dayTitle(week, weekday)}
        >
            <span className="tplan-chip__dot" />
            <span className="tplan-chip__title">{item.title || 'Без названия'}</span>
            {!compact && Number(item.priority) > 0 && (
                <span className="tplan-chip__stars">
                    {'★'.repeat(Math.min(5, Number(item.priority)))}
                </span>
            )}
        </div>
    )

    const dayTitle = (week, weekday) => (
        `${WEEKDAYS_FULL[weekday]} · месяц ${monthOfWeek(week)} · неделя ${weekInMonth(week)}`
    )

    /* ---------- Неделя ---------- */

    const renderWeek = () => (
        <div className="tplan-week">
            {WEEKDAYS.map((label, weekday) => {
                const slot = `${weekIndex}-${weekday}`
                const tasks = tasksAt(weekIndex, weekday)
                return (
                    <section
                        key={weekday}
                        className={[
                            'tplan-daycol',
                            weekday >= 5 ? 'tplan-daycol--weekend' : '',
                            dragOver === slot ? 'tplan-daycol--drop' : '',
                        ].filter(Boolean).join(' ')}
                        onDragOver={(e) => handleDragOver(e, slot)}
                        onDragLeave={() => {
                            if (dragOver === slot) setDragOver(null)
                        }}
                        onDrop={(e) => handleDrop(e, weekIndex, weekday)}
                    >
                        <button
                            type="button"
                            className="tplan-daycol__head"
                            onClick={() => openDay(weekIndex, weekday)}
                            title={`Открыть день: ${dayTitle(weekIndex, weekday)}`}
                        >
                            <span className="tplan-daycol__name">{label}</span>
                            <span className="tplan-daycol__count">{tasks.length || ''}</span>
                        </button>
                        <div className="tplan-daycol__body">
                            {tasks.map((item) => renderChip(item, weekIndex, weekday))}
                            {tasks.length === 0 && (
                                <div className="tplan-daycol__empty">Перетащите задачу</div>
                            )}
                            <button
                                type="button"
                                className="tplan-daycol__add"
                                onClick={() => onAddForSlot(weekIndex, weekday)}
                            >+ задача</button>
                        </div>
                    </section>
                )
            })}
        </div>
    )

    /* ---------- Месяц ---------- */

    const renderMonth = () => (
        <div className="tplan-month">
            <div className="tplan-month__head">
                <span className="tplan-month__corner">Неделя</span>
                {WEEKDAYS.map((label, weekday) => (
                    <span
                        key={label}
                        className={weekday >= 5 ? 'tplan-month__weekend' : ''}
                    >{label}</span>
                ))}
            </div>

            {[0, 1, 2, 3].map((row) => {
                const week = monthIndex * WEEKS_PER_MONTH + row
                return (
                    <div className="tplan-month__row" key={row}>
                        <button
                            type="button"
                            className="tplan-month__week"
                            onClick={() => openWeek(week)}
                            title={`Открыть неделю: месяц ${monthOfWeek(week)} · неделя ${weekInMonth(week)}`}
                        >
                            <span>{row + 1}-я</span>
                            <small>неделя</small>
                        </button>
                        {WEEKDAYS.map((label, weekday) => {
                            const slot = `${week}-${weekday}`
                            const tasks = tasksAt(week, weekday)
                            return (
                                <div
                                    key={weekday}
                                    className={[
                                        'tplan-month__cell',
                                        weekday >= 5 ? 'tplan-month__cell--weekend' : '',
                                        dragOver === slot ? 'tplan-month__cell--drop' : '',
                                    ].filter(Boolean).join(' ')}
                                    onDragOver={(e) => handleDragOver(e, slot)}
                                    onDragLeave={() => {
                                        if (dragOver === slot) setDragOver(null)
                                    }}
                                    onDrop={(e) => handleDrop(e, week, weekday)}
                                    onClick={() => openDay(week, weekday)}
                                    title={`${dayTitle(week, weekday)} — открыть день`}
                                >
                                    {tasks.map((item) => renderChip(item, week, weekday, true))}
                                    <button
                                        type="button"
                                        className="tplan-month__add"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onAddForSlot(week, weekday)
                                        }}
                                        title="Добавить задачу"
                                    >+</button>
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )

    /* ---------- Год ---------- */

    const renderYear = () => (
        <div className="tplan-year">
            {Array.from({ length: 12 }, (_, index) => {
                const startWeek = index * WEEKS_PER_MONTH
                return (
                    <section className="tplan-year__month" key={index}>
                        <button
                            type="button"
                            className="tplan-year__title"
                            onClick={() => openMonth(index)}
                            title="Открыть месяц"
                        >
                            <span>Месяц {index + 1}</span>
                            <span className="tplan-year__open">Открыть</span>
                        </button>

                        <div className="tplan-year__weekdays">
                            {WEEKDAYS.map((label, weekday) => (
                                <span
                                    key={label}
                                    className={weekday >= 5 ? 'tplan-year__weekend' : ''}
                                >{label}</span>
                            ))}
                        </div>

                        <div className="tplan-year__grid">
                            {Array.from({ length: WEEKS_PER_MONTH }, (_, row) => {
                                const week = startWeek + row
                                return WEEKDAYS.map((label, weekday) => {
                                    const slot = `${week}-${weekday}`
                                    const tasks = tasksAt(week, weekday)
                                    return (
                                        <div
                                            key={`${row}-${weekday}`}
                                            className={[
                                                'tplan-year__cell',
                                                weekday >= 5 ? 'tplan-year__cell--weekend' : '',
                                                dragOver === slot ? 'tplan-year__cell--drop' : '',
                                            ].filter(Boolean).join(' ')}
                                            onClick={() => onViewStateChange({
                                                weekIndex: clampWeek(week),
                                                dayWeekday: weekday,
                                                view: 'day',
                                            })}
                                            onDragOver={(e) => handleDragOver(e, slot)}
                                            onDragLeave={() => {
                                                if (dragOver === slot) setDragOver(null)
                                            }}
                                            onDrop={(e) => handleDrop(e, week, weekday)}
                                            title={tasks.length
                                                ? `${dayTitle(week, weekday)}: ${tasks.map((t) => t.title || 'Без названия').join(', ')}`
                                                : dayTitle(week, weekday)}
                                        >
                                            <div className="tplan-year__dots">
                                                {tasks.slice(0, 4).map((item) => (
                                                    <span
                                                        key={item.key}
                                                        className={[
                                                            'tplan-year__dot',
                                                            selectedKey === item.key ? 'tplan-year__dot--selected' : '',
                                                        ].filter(Boolean).join(' ')}
                                                    />
                                                ))}
                                            </div>
                                            {tasks.length > 4 && (
                                                <span className="tplan-year__more">+{tasks.length - 4}</span>
                                            )}
                                        </div>
                                    )
                                })
                            })}
                        </div>
                    </section>
                )
            })}
        </div>
    )

    /* ---------- День ---------- */

    /**
     * В дне нет выбора дня недели: день уже выбран в недельном/месячном
     * виде. Вместо дней — базовые часы 09, 12, 15, 18, 21 и 24 (00:00),
     * чтобы можно было раскидать задачи по времени внутри дня.
     */
    const renderDay = () => {
        const slot = `${weekIndex}-${dayWeekday}`
        const tasks = tasksAt(weekIndex, dayWeekday)

        const byHour = {}
        for (const hour of DAY_HOURS) byHour[hour] = []
        for (const item of tasks) {
            const hour = nearestHour(item.startTime)
            if (!byHour[hour]) byHour[hour] = []
            byHour[hour].push(item)
        }

        const addAtHour = (hour) => {
            onAddForSlotAtTime?.(weekIndex, dayWeekday, hour)
        }

        return (
            <div className="tplan-dayview">
                <div className="tplan-dayview__head">
                    <div>
                        <div className="tplan-dayview__name">{WEEKDAYS_FULL[dayWeekday]}</div>
                        <div className="tplan-dayview__sub">
                            {tasks.length} {tasks.length === 1 ? 'задача' : 'задач'} · базовые часы дня
                        </div>
                    </div>
                </div>

                <div className="tplan-dayview__hours">
                    {DAY_HOURS.map((hour) => {
                        const laneSlot = `${slot}-${hour}`
                        const hoursItems = byHour[hour] || []
                        return (
                            <section
                                key={hour}
                                className={[
                                    'tplan-hour',
                                    dragOver === laneSlot ? 'tplan-hour--drop' : '',
                                ].filter(Boolean).join(' ')}
                                onDragOver={(e) => handleDragOver(e, laneSlot)}
                                onDragLeave={() => {
                                    if (dragOver === laneSlot) setDragOver(null)
                                }}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    const key = e.dataTransfer.getData('text/plain') || draggingKey
                                    setDraggingKey(null)
                                    setDragOver(null)
                                    if (key) onAssign(key, slotOffset(weekIndex, dayWeekday), hour)
                                }}
                            >
                                <div className="tplan-hour__label">
                                    <span className="tplan-hour__time">{hourLabel(hour)}</span>
                                    {hour === '24:00' && <span className="tplan-hour__note">полночь</span>}
                                </div>

                                <div className="tplan-hour__tasks">
                                    {hoursItems.length === 0 && (
                                        <div className="tplan-hour__empty">
                                            Перетащите задачу сюда
                                        </div>
                                    )}
                                    {hoursItems.map((item) => (
                                        <div
                                            key={item.key}
                                            className={[
                                                'tplan-day-task',
                                                selectedKey === item.key ? 'tplan-day-task--selected' : '',
                                                draggingKey === item.key ? 'tplan-chip--dragging' : '',
                                            ].filter(Boolean).join(' ')}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => onSelectItem(item.key)}
                                        >
                                            <span className="tplan-day-task__title">
                                                {item.title || 'Без названия'}
                                            </span>
                                            {item.description && (
                                                <span className="tplan-day-task__desc">{item.description}</span>
                                            )}
                                            <span className="tplan-day-task__meta">
                                                {Number(item.priority) > 0 && (
                                                    <span>{'★'.repeat(Math.min(5, Number(item.priority)))}</span>
                                                )}
                                                {item.estimatedMinutes ? <span>~{item.estimatedMinutes} мин</span> : null}
                                                {item.subtasks?.length ? (
                                                    <span>☑ {item.subtasks.length}</span>
                                                ) : null}
                                            </span>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="tplan-hour__add"
                                        onClick={() => addAtHour(hour)}
                                    >+ задача</button>
                                </div>
                            </section>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <section className="tplan-cal">
            <div className="tplan-cal__bar">
                <div className="tplan-cal__views" role="tablist" aria-label="Период календаря">
                    {VIEWS.map((item) => (
                        <button
                            key={item.code}
                            type="button"
                            role="tab"
                            aria-selected={view === item.code}
                            className={view === item.code ? 'active' : ''}
                            onClick={() => changeView(item.code)}
                        >{item.label}</button>
                    ))}
                </div>
            </div>

            <div className="tplan-cal__body">
                {view === 'week' && renderWeek()}
                {view === 'month' && renderMonth()}
                {view === 'year' && renderYear()}
                {view === 'day' && renderDay()}
            </div>
        </section>
    )
}
