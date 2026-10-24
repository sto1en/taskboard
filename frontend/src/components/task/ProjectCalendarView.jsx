import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { calendarApi, tasksApi } from '../../api/api'
import useT from '../../hooks/useT'
import { isDone as checkIsDone, isCancelled as checkIsCancelled } from '../../utils/sortTasks'

const MAX_DOTS = 5

function pad2(n) {
    return String(n).padStart(2, '0')
}

function isoDate(year, month, day) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

function categoryColor(task) {
    if (checkIsCancelled(task)) return 'var(--accent-gray, #97a0af)'
    if (checkIsDone(task)) return 'var(--success, #36b37e)'
    if (task.isOverdue) return 'var(--danger, #ff5630)'
    switch (task.statusCategoryCode) {
        case 'ACTIVE':   return 'var(--accent-blue, #4c9aff)'
        case 'EXPIRED':  return 'var(--danger, #ff5630)'
        case 'FROZEN':   return 'var(--accent-amber, #ffc400)'
        default:         return 'var(--accent-gray, #97a0af)'
    }
}

// Активные сверху, выполненные — внизу; внутри группы по приоритету.
function sortDayTasks(tasks) {
    return [...tasks].sort((a, b) => {
        const da = checkIsDone(a) || checkIsCancelled(a) ? 1 : 0
        const db = checkIsDone(b) || checkIsCancelled(b) ? 1 : 0
        if (da !== db) return da - db
        const pa = Number(a.priority) || 0
        const pb = Number(b.priority) || 0
        if (pa !== pb) return pb - pa
        return a.id - b.id
    })
}

// Тот же порог «тепловой карты», что в большом календаре (CalendarPage),
// чтобы ячейка светилась по одинаковым правилам в обоих видах.
export function heatLevelByDoneCount(doneCount) {
    if (doneCount <= 0) return 0
    if (doneCount <= 1) return 1
    if (doneCount <= 3) return 2
    if (doneCount <= 5) return 3
    return 4
}

function isCompletedTask(task) {
    return task.statusCategoryCode === 'DONE' || task.statusCategoryCode === 'ARCHIVED'
}

/**
 * Календарный вид проекта: слева компактный месячный календарь,
 * справа — задачи, сгруппированные по дням (а не по статусам).
 */
export default function ProjectCalendarView({
    projectId,
    activeStatuses,
    onOpenTask,
    onAddTask,
    onToggleDone,
    onTaskMoved,
    refreshToken = 0,
}) {
    const t = useT()
    const lang = useSelector((state) => state.auth.user?.locale?.language) || 'ru'

    const today = useMemo(() => new Date(), [])
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [tasksByDate, setTasksByDate] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(() => isoDate(
        today.getFullYear(), today.getMonth(), today.getDate()
    ))
    const [dragOverDate, setDragOverDate] = useState(null)
    const [draggingTaskId, setDraggingTaskId] = useState(null)

    const groupRefs = useRef({})
    const scrollRef = useRef(null)
    const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

    const MONTHS = [
        t.monthJanuary, t.monthFebruary, t.monthMarch, t.monthApril,
        t.monthMay, t.monthJune, t.monthJuly, t.monthAugust,
        t.monthSeptember, t.monthOctober, t.monthNovember, t.monthDecember,
    ]
    const WEEKDAYS = [
        t.weekdayMon, t.weekdayTue, t.weekdayWed, t.weekdayThu,
        t.weekdayFri, t.weekdaySat, t.weekdaySun,
    ]

    const loadCalendar = useCallback(({ silent = false } = {}) => {
        if (!projectId) return
        const from = isoDate(year, month, 1)
        const to = isoDate(year, month, new Date(year, month + 1, 0).getDate())

        if (!silent) setLoading(true)

        calendarApi.get(from, to, projectId)
            .then(({ data }) => {
                const map = {}
                ;(data?.days || []).forEach((d) => {
                    map[d.date] = d.tasks || []
                })
                setTasksByDate(map)
            })
            .catch((err) => console.error('Project calendar load error:', err))
            .finally(() => {
                if (!silent) setLoading(false)
            })
    }, [year, month, projectId])

    useEffect(() => {
        loadCalendar()
    }, [loadCalendar])

    // Внешние изменения (создание/редактирование/перенос задачи) —
    // тихо перечитываем месяц, без мигания лоадера.
    const loadRef = useRef(loadCalendar)
    useEffect(() => {
        loadRef.current = loadCalendar
    }, [loadCalendar])

    const firstRefreshRef = useRef(true)
    useEffect(() => {
        if (firstRefreshRef.current) {
            firstRefreshRef.current = false
            return
        }
        loadRef.current({ silent: true })
    }, [refreshToken])

    const matchesFilters = useCallback((task) => {
        if (!activeStatuses || activeStatuses.length === 0) return true
        return activeStatuses.includes(task.statusId)
    }, [activeStatuses])

    const dayTasks = useCallback((iso) => (
        (tasksByDate[iso] || []).filter(matchesFilters)
    ), [tasksByDate, matchesFilters])

    const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells = useMemo(() => {
        const arr = []
        for (let i = 0; i < startWeekday; i++) arr.push(null)
        for (let d = 1; d <= daysInMonth; d++) arr.push(d)
        while (arr.length % 7 !== 0) arr.push(null)
        return arr
    }, [startWeekday, daysInMonth])

    const prevMonth = () => {
        setSelectedDate(null)
        if (month === 0) { setYear((y) => y - 1); setMonth(11) }
        else setMonth((m) => m - 1)
    }
    const nextMonth = () => {
        setSelectedDate(null)
        if (month === 11) { setYear((y) => y + 1); setMonth(0) }
        else setMonth((m) => m + 1)
    }
    const goToday = () => {
        setYear(today.getFullYear())
        setMonth(today.getMonth())
        setSelectedDate(todayIso)
    }

    const agendaGroups = useMemo(() => {
        const groups = []
        for (let d = 1; d <= daysInMonth; d++) {
            const iso = isoDate(year, month, d)
            const list = (tasksByDate[iso] || []).filter(matchesFilters)
            if (list.length > 0 || iso === selectedDate) {
                groups.push({ iso, day: d, tasks: sortDayTasks(list) })
            }
        }
        return groups
    }, [year, month, daysInMonth, tasksByDate, matchesFilters, selectedDate])

    // Прокрутка правой колонки к выбранному дню.
    useEffect(() => {
        if (!selectedDate) return
        const el = groupRefs.current[selectedDate]
        const sc = scrollRef.current
        if (!el || !sc) return
        sc.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' })
    }, [selectedDate, loading])

    const handleDayClick = (day) => {
        setSelectedDate(isoDate(year, month, day))
    }

    const handleDragStart = (e, task) => {
        setDraggingTaskId(task.id)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(task.id))
    }

    const handleDragEnd = () => {
        setDraggingTaskId(null)
        setDragOverDate(null)
    }

    const handleDrop = async (e, iso) => {
        e.preventDefault()
        const taskId = draggingTaskId || Number(e.dataTransfer.getData('text/plain'))
        setDraggingTaskId(null)
        setDragOverDate(null)
        if (!taskId) return

        // Перенос внутри того же дня — не дёргаем сервер.
        const alreadyHere = (tasksByDate[iso] || []).some((x) => x.id === taskId)
        if (alreadyHere) return

        try {
            await tasksApi.moveDate(taskId, iso)
            setSelectedDate(iso)
            onTaskMoved && onTaskMoved()
        } catch (err) {
            console.error('Move date failed:', err)
            alert(err.response?.data?.message || 'Не удалось перенести задачу')
        }
    }

    const dateLabel = (day) => {
        const date = new Date(year, month, day)
        return new Intl.DateTimeFormat(lang, {
            day: 'numeric',
            month: 'long',
        }).format(date)
    }

    const weekdayLabel = (day) => new Intl.DateTimeFormat(lang, {
        weekday: 'long',
    }).format(new Date(year, month, day))

    return (
        <div className="pcal">
            <section className="pcal__month">
                <div className="pcal__month-head">
                    <button
                        type="button"
                        className="pcal__nav"
                        onClick={prevMonth}
                        aria-label="Предыдущий месяц"
                    >‹</button>

                    <div className="pcal__month-title">
                        <span className="pcal__month-name">{MONTHS[month]}</span>
                        <span className="pcal__month-year">{year}</span>
                    </div>

                    <button
                        type="button"
                        className="pcal__today"
                        onClick={goToday}
                    >{t.projectCalendarToday}</button>

                    <button
                        type="button"
                        className="pcal__nav"
                        onClick={nextMonth}
                        aria-label="Следующий месяц"
                    >›</button>
                </div>

                <div className="pcal__weekdays">
                    {WEEKDAYS.map((w, i) => (
                        <span
                            key={w}
                            className={`pcal__weekday ${i >= 5 ? 'pcal__weekday--weekend' : ''}`}
                        >{w}</span>
                    ))}
                </div>

                {loading ? (
                    <div className="pcal__loading">{t.loading}</div>
                ) : (
                    <div className="pcal__grid">
                        {cells.map((day, i) => {
                            if (!day) {
                                return <div key={`empty-${i}`} className="pcal__cell pcal__cell--empty" />
                            }

                            const iso = isoDate(year, month, day)
                            const list = dayTasks(iso)
                            const dots = list.slice(0, MAX_DOTS)
                            const rest = list.length - dots.length
                            const isToday = iso === todayIso
                            const isSelected = iso === selectedDate
                            const isWeekend = (i % 7) >= 5
                            const heatLevel = heatLevelByDoneCount(
                                list.filter(isCompletedTask).length
                            )

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    className={[
                                        'pcal__cell',
                                        isWeekend ? 'pcal__cell--weekend' : '',
                                        isToday ? 'pcal__cell--today' : '',
                                        isSelected ? 'pcal__cell--selected' : '',
                                        `pcal__cell--heat-${heatLevel}`,
                                        dragOverDate === iso ? 'pcal__cell--drop' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => handleDayClick(day)}
                                    onDragOver={(e) => {
                                        if (!draggingTaskId) return
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = 'move'
                                        if (dragOverDate !== iso) setDragOverDate(iso)
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverDate === iso) setDragOverDate(null)
                                    }}
                                    onDrop={(e) => handleDrop(e, iso)}
                                    title={
                                        list.length
                                            ? `${dateLabel(day)} · ${list.length}`
                                            : dateLabel(day)
                                    }
                                >
                                    <span className="pcal__cell-head">
                                        <span className="pcal__daynum">{day}</span>
                                    </span>
                                    <span className="pcal__dots">
                                        {dots.map((task) => (
                                            <span
                                                key={task.id}
                                                className="pcal__dot"
                                                style={{ background: categoryColor(task) }}
                                            />
                                        ))}
                                        {rest > 0 && (
                                            <span className="pcal__rest">+{rest}</span>
                                        )}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </section>

            <section className="pcal__agenda">
                <div className="pcal__agenda-scroll" ref={scrollRef}>
                    {loading ? (
                        <div className="pcal__loading">{t.loading}</div>
                    ) : agendaGroups.length === 0 ? (
                        <div className="pcal__empty">{t.projectCalendarEmpty}</div>
                    ) : (
                        agendaGroups.map(({ iso, day, tasks }) => {
                            return (
                                <div
                                    key={iso}
                                    className={`pcal-day ${iso === selectedDate ? 'pcal-day--selected' : ''}`}
                                    ref={(el) => {
                                        if (el) groupRefs.current[iso] = el
                                        else delete groupRefs.current[iso]
                                    }}
                                >
                                    <div className="pcal-day__head">
                                        <span className="pcal-day__date">{dateLabel(day)}</span>
                                        <span className="pcal-day__weekday">{weekdayLabel(day)}</span>
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="pcal-day__empty">{t.projectCalendarNoTasks}</div>
                                    ) : (
                                        <div className="pcal-day__tasks">
                                            {tasks.map((task) => {
                                                const done = checkIsDone(task)
                                                const cancelled = checkIsCancelled(task)
                                                return (
                                                    <div
                                                        key={task.id}
                                                        className={[
                                                            'pcal-task',
                                                            done ? 'pcal-task--done' : '',
                                                            cancelled ? 'pcal-task--cancelled' : '',
                                                            task.isOverdue && !done ? 'pcal-task--overdue' : '',
                                                            draggingTaskId === task.id ? 'pcal-task--dragging' : '',
                                                        ].filter(Boolean).join(' ')}
                                                        style={{ '--task-accent': categoryColor(task) }}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => onOpenTask && onOpenTask(task.id)}
                                                        title={task.statusTitle || task.title}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={`pcal-task__check ${done ? 'pcal-task__check--done' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onToggleDone && onToggleDone(task.id, done)
                                                            }}
                                                            aria-label={done ? 'Вернуть в работу' : 'Выполнить'}
                                                        />
                                                        <span className="pcal-task__title">{task.title}</span>
                                                        {task.attachmentNames?.length > 0 && (
                                                            <span className="pcal-task__attach">📎</span>
                                                        )}
                                                        {task.statusTitle && (
                                                            <span className="pcal-task__status">{task.statusTitle}</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="pcal-day__add"
                                        onClick={() => onAddTask && onAddTask(iso)}
                                    >{t.projectCalendarAdd}</button>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>
        </div>
    )
}
