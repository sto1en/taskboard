import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { observer } from 'mobx-react-lite'
import { selectTasksRevision } from '../store/slices/tasksSlice'
import { invalidateStats } from '../store/slices/statsSlice'
import { useUiStore } from '../store/useUiStore'
import { calendarApi, boardsApi, statsApi, tasksApi } from '../api/api'
import useT from '../hooks/useT'
import useHotkeys from '../hooks/useHotkeys'
import useConfirmDelete from '../hooks/useConfirmDelete'
import { useAuth } from '../context/AuthContext'
import DayTasksModal from '../components/calendar/DayTasksModal'
import TaskFormModal from '../components/task/TaskFormModal'
import TaskDetailModal from '../components/task/TaskDetailModal'
import AttachmentsModal from '../components/task/AttachmentsModal'
import ConfirmModal from '../components/common/ConfirmModal'
import DayLoadBar from '../components/calendar/DayLoadBar'

const MAX_VISIBLE_TASKS = 3

function isDoneCategory(cat) {
    return cat === 'DONE' || cat === 'ARCHIVED' || cat === 'CANCELLED'
}

function categoryColor(cat) {
    switch (cat) {
        case 'ACTIVE':    return 'var(--accent-blue, #4c9aff)'
        case 'DONE':      return 'var(--accent-green, #36b37e)'
        case 'ARCHIVED':  return 'var(--accent-green, #36b37e)'
        case 'CANCELLED': return 'var(--accent-gray, #97a0af)'
        case 'EXPIRED':   return 'var(--accent-red, #ff5630)'
        case 'FROZEN':    return 'var(--accent-amber, #ffc400)'
        default:          return 'var(--accent-gray, #97a0af)'
    }
}

export default observer(function CalendarPage() {
    const t = useT()
    const nav = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user, updateUser } = useAuth()
    const dispatch = useDispatch()
    const ui = useUiStore()
    const tasksRevision = useSelector(selectTasksRevision)
    const today = new Date()

    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [tasksByDay, setTasksByDay] = useState({})
    const [loadByDay, setLoadByDay] = useState({})
    const [loading, setLoading] = useState(true)

    const [boards, setBoards] = useState([])

    const [coopFilter, setCoopFilter] = useState('all') // 'all' | 'coop' | 'own'

    const [openDay, setOpenDay] = useState(null)
    const [createDate, setCreateDate] = useState(null)
    const [openTaskId, setOpenTaskId] = useState(null)
    const [attachmentsToView, setAttachmentsToView] = useState(null)
    const [attachmentsTaskId, setAttachmentsTaskId] = useState(null)

    const [draggingTaskId, setDraggingTaskId] = useState(null)
    const [hoverDay, setHoverDay] = useState(null)

    const hoveredDayRef = useRef(null)
    const [hoveredTaskId, setHoveredTaskId] = useState(null)

    const doneStatusIdRef = useRef(null)
    const activeStatusIdRef = useRef(null)
    const cancelledStatusIdRef = useRef(null)

    const MONTHS = [
        t.monthJanuary || 'January', t.monthFebruary || 'February',
        t.monthMarch || 'March', t.monthApril || 'April', t.monthMay || 'May',
        t.monthJune || 'June', t.monthJuly || 'July', t.monthAugust || 'August',
        t.monthSeptember || 'September', t.monthOctober || 'October',
        t.monthNovember || 'November', t.monthDecember || 'December',
    ]
    const WEEKDAYS = [
        t.weekdayMon || 'Mon', t.weekdayTue || 'Tue', t.weekdayWed || 'Wed',
        t.weekdayThu || 'Thu', t.weekdayFri || 'Fri', t.weekdaySat || 'Sat',
        t.weekdaySun || 'Sun',
    ]

    const YEARS = useMemo(() => {
        const arr = []
        const base = today.getFullYear()
        for (let y = base - 5; y <= base + 5; y++) arr.push(y)
        return arr
    }, [today])

    useEffect(() => {
        boardsApi.list().then(({ data }) => setBoards(data)).catch(() => setBoards([]))
    }, [])

    useEffect(() => {
        const dateParam = searchParams.get('date')
        if (!dateParam) return
        const d = new Date(dateParam)
        if (isNaN(d.getTime())) return
        setYear(d.getFullYear())
        setMonth(d.getMonth())
        setOpenDay(dateParam)
        // eslint-disable-next-line
    }, [])

    const reloadCalendar = ({ silent = false } = {}) => {
        const from = new Date(year, month, 1).toISOString().slice(0, 10)
        const to = new Date(year, month + 1, 0).toISOString().slice(0, 10)

        if (!silent) setLoading(true)

        const coopParam = coopFilter === 'all' ? undefined : coopFilter === 'coop'

        Promise.all([
            calendarApi.get(from, to),
            statsApi.dailyLoad(from, to, coopParam),
        ])
            .then(([calRes, loadRes]) => {
                const map = {}
                calRes.data.days.forEach(d => {
                    const day = Number(d.date.split('-')[2])
                    map[day] = d.tasks
                })
                setTasksByDay(map)

                const loadMap = {}
                ;(loadRes.data || []).forEach(l => {
                    const day = Number(l.date.split('-')[2])
                    loadMap[day] = l.level
                })
                setLoadByDay(loadMap)

                dispatch(invalidateStats())
            })
            .catch(err => console.error('Calendar load error:', err))
            .finally(() => {
                if (!silent) setLoading(false)
            })
    }

    // eslint-disable-next-line
    useEffect(() => reloadCalendar(), [year, month, coopFilter])

    // Реакция на инвалидацию задач (раньше: слушатель события 'tasks:refresh').
    // Первое значение revision пропускаем — начальную загрузку делает эффект
    // по [year, month, coopFilter] выше.
    const firstRevisionRef = useRef(true)
    useEffect(() => {
        if (firstRevisionRef.current) {
            firstRevisionRef.current = false
            return
        }
        reloadCalendar({ silent: true })
        // eslint-disable-next-line
    }, [tasksRevision])

    // Горячая клавиша N: на странице календаря → задача на «наведённый» день.
    // Раньше: подписка на 'hotkey:new' (detail === 'calendar-day').
    // Событие бралось из замыкания с [year, month]; здесь те же зависимости,
    // чтобы dateToIso считался по актуальному месяцу.
    useEffect(() => {
        if (ui.consumeCreate() !== 'calendar-day') return
        const hovered = hoveredDayRef.current
        if (!hovered) return
        if (document.querySelector('.modal-overlay')) return
        setCreateDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(hovered).padStart(2, '0')}`)
    }, [year, month, ui])

    const firstDay = new Date(year, month, 1)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells = useMemo(() => {
        const arr = []
        for (let i = 0; i < startWeekday; i++) arr.push(null)
        for (let d = 1; d <= daysInMonth; d++) arr.push(d)
        while (arr.length % 7 !== 0) arr.push(null)
        return arr
    }, [startWeekday, daysInMonth])

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0) }
        else setMonth(m => m + 1)
    }

    const dateToIso = (day) => {
        const m = String(month + 1).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        return `${year}-${m}-${d}`
    }

    const handleDayClick = (day) => setOpenDay(dateToIso(day))
    const handleTaskClick = (e, task) => { e.stopPropagation(); setOpenTaskId(task.id) }
    const handleAddTask = (dateIso) => setCreateDate(dateIso)
    const handleCreated = () => { setCreateDate(null); reloadCalendar({ silent: true }) }

    const handleOpenAttachments = (taskId, attachments) => {
        setAttachmentsTaskId(taskId)
        setAttachmentsToView(attachments)
    }

    const closeDayModal = () => {
        setOpenDay(null)
        const p = new URLSearchParams(searchParams)
        p.delete('date'); p.delete('from')
        setSearchParams(p, { replace: true })
    }
    const backFromDayModal = () => {
        const from = searchParams.get('from')
        setOpenDay(null)
        const p = new URLSearchParams(searchParams)
        p.delete('date'); p.delete('from')
        setSearchParams(p, { replace: true })
        if (from) nav(from)
    }

    const onDragStartTask = (e, task) => {
        setDraggingTaskId(task.id)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(task.id))
    }
    const onDragEndTask = () => {
        setDraggingTaskId(null)
        setHoverDay(null)
    }
    const onDragOverDay = (e, day) => {
        if (!draggingTaskId) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setHoverDay(day)
    }
    const onDragLeaveDay = (e, day) => {
        if (hoverDay === day) setHoverDay(null)
    }
    const onDropDay = async (e, day) => {
        e.preventDefault()
        const taskId = draggingTaskId || Number(e.dataTransfer.getData('text/plain'))
        setDraggingTaskId(null)
        setHoverDay(null)
        if (!taskId) return
        try {
            const iso = dateToIso(day)
            await tasksApi.moveDate(taskId, iso)
            reloadCalendar({ silent: true })
        } catch (err) {
            console.error('Move date failed:', err)
            alert(err.response?.data?.message || 'Не удалось перенести задачу')
        }
    }

    const markDoneLocally = (taskId) => {
        setTasksByDay(prev => {
            const next = {}
            for (const [day, list] of Object.entries(prev)) {
                next[day] = list.map(x =>
                    x.id === taskId
                        ? { ...x, statusCode: 'DONE', statusCategoryCode: 'DONE' }
                        : x
                )
            }
            return next
        })
    }

    const markCancelledLocally = (taskId) => {
        setTasksByDay(prev => {
            const next = {}
            for (const [day, list] of Object.entries(prev)) {
                next[day] = list.map(x =>
                    x.id === taskId
                        ? { ...x, statusCode: 'CANCELLED', statusCategoryCode: 'CANCELLED' }
                        : x
                )
            }
            return next
        })
    }

    const findTaskInCalendar = (taskId) => {
        for (const list of Object.values(tasksByDay)) {
            const found = list.find(x => x.id === taskId)
            if (found) return found
        }
        return null
    }

    const loadStatusIdsForProject = async (projectId) => {
        try {
            const { data: k } = await tasksApi.kanban(projectId)
            const cols = k.columns || []
            if (!doneStatusIdRef.current) {
                doneStatusIdRef.current = cols.find(c => c.categoryCode === 'DONE')?.statusId || null
            }
            if (!activeStatusIdRef.current) {
                activeStatusIdRef.current = cols.find(c => c.categoryCode === 'ACTIVE')?.statusId || null
            }
            if (!cancelledStatusIdRef.current) {
                cancelledStatusIdRef.current = cols.find(c => c.categoryCode === 'CANCELLED')?.statusId || null
            }
        } catch {}
    }

    const handleCalendarToggleDone = async () => {
        if (!hoveredTaskId) return
        const task = findTaskInCalendar(hoveredTaskId)
        if (!task) return
        if (isDoneCategory(task.statusCategoryCode)) return

        if (!doneStatusIdRef.current && task.projectId) {
            await loadStatusIdsForProject(task.projectId)
        }
        const targetStatusId = doneStatusIdRef.current
        if (!targetStatusId) return

        markDoneLocally(task.id)
        try {
            await tasksApi.update(task.id, { statusId: targetStatusId })
            dispatch(invalidateStats())
        } catch (err) {
            console.error('Toggle done failed:', err)
            reloadCalendar({ silent: true })
        }
    }

    const handleCalendarToggleCancel = async () => {
        if (!hoveredTaskId) return
        const task = findTaskInCalendar(hoveredTaskId)
        if (!task) return

        const isCancelled = task.statusCategoryCode === 'CANCELLED'
        const targetCategory = isCancelled ? 'ACTIVE' : 'CANCELLED'

        if (!task.projectId) return
        await loadStatusIdsForProject(task.projectId)

        const targetStatusId = targetCategory === 'CANCELLED'
            ? cancelledStatusIdRef.current
            : activeStatusIdRef.current

        if (!targetStatusId) {
            alert('Нет подходящего статуса (Отменено или В процессе)')
            return
        }

        if (targetCategory === 'CANCELLED') {
            markCancelledLocally(task.id)
        } else {
            reloadCalendar({ silent: true })
        }

        try {
            await tasksApi.update(task.id, { statusId: targetStatusId })
            dispatch(invalidateStats())
        } catch (err) {
            console.error('Toggle cancel failed:', err)
            reloadCalendar({ silent: true })
        }
    }

    const doDeleteTask = async (task) => {
        if (!task) return
        setTasksByDay(prev => {
            const next = {}
            for (const [day, list] of Object.entries(prev)) {
                next[day] = list.filter(x => x.id !== task.id)
            }
            return next
        })
        setHoveredTaskId(null)

        try {
            await tasksApi.delete(task.id)
            dispatch(invalidateStats())
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось удалить')
            reloadCalendar({ silent: true })
        }
    }

    const handleCalendarDeleteWithConfirm = () => {
        if (!hoveredTaskId) return
        const task = findTaskInCalendar(hoveredTaskId)
        if (!task) return
        requestDelete({
            kind: 'task',
            title: task.title,
            onConfirm: () => doDeleteTask(task),
        })
    }

    const handleCalendarOpen = () => {
        if (hoveredTaskId) setOpenTaskId(hoveredTaskId)
    }

    useHotkeys([
        {
            combo: 'arrowright',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !modalProps.open,
            handler: nextMonth,
        },
        {
            combo: 'arrowleft',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !modalProps.open,
            handler: prevMonth,
        },
        {
            combo: 'space',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !!hoveredTaskId && !modalProps.open,
            handler: (e) => { e.preventDefault(); handleCalendarToggleDone() },
        },
        {
            combo: 'e',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !!hoveredTaskId && !modalProps.open,
            handler: handleCalendarOpen,
        },
        {
            combo: 'delete',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !!hoveredTaskId && !modalProps.open,
            handler: handleCalendarDeleteWithConfirm,
        },
        {
            combo: 'backspace',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !!hoveredTaskId && !modalProps.open,
            handler: handleCalendarToggleCancel,
        },
    ])

    const matchesCoopFilter = (task) => {
        if (coopFilter === 'all') return true
        if (coopFilter === 'coop') return !!task.coop
        return !task.coop
    }

    const dayTasksForModal = openDay
        ? (tasksByDay[Number(openDay.split('-')[2])] || []).filter(matchesCoopFilter)
        : []

    return (
        <div className="calendar">
            <div className="calendar__head">
                <button className="calendar__nav-btn" onClick={prevMonth} aria-label="Предыдущий месяц">‹</button>

                <div className="calendar__selectors">
                    <div className="calendar__select-wrap">
                        <select
                            className="calendar__select"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            aria-label="Месяц"
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <span className="calendar__select-caret">▾</span>
                    </div>
                    <div className="calendar__select-wrap">
                        <select
                            className="calendar__select"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            aria-label="Год"
                        >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span className="calendar__select-caret">▾</span>
                    </div>
                </div>

                <button className="calendar__nav-btn" onClick={nextMonth} aria-label="Следующий месяц">›</button>
            </div>

            <div className="calendar__coop-tabs">
                {[
                    ['all', 'Все'],
                    ['coop', 'Кооп'],
                    ['own', 'Собственные'],
                ].map(([code, label]) => (
                    <button
                        key={code}
                        type="button"
                        className={`calendar__coop-tab ${coopFilter === code ? 'calendar__coop-tab--active' : ''}`}
                        onClick={() => setCoopFilter(code)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="calendar__loading">{t.loading}</div>
            ) : (
                <div className="calendar__grid">
                    {WEEKDAYS.map((w, i) => (
                        <div
                            key={w}
                            className={`calendar__weekday ${i >= 5 ? 'calendar__weekday--weekend' : ''}`}
                        >
                            {w}
                        </div>
                    ))}

                    {cells.map((day, i) => {
                        const isToday = day === today.getDate()
                            && month === today.getMonth()
                            && year === today.getFullYear()
                        const isWeekend = (i % 7) >= 5
                        const dayTasksRaw = day
                            ? (tasksByDay[day] || []).filter(matchesCoopFilter)
                            : []

                        const active = dayTasksRaw.filter(x => !isDoneCategory(x.statusCategoryCode))
                        const done = dayTasksRaw.filter(x => isDoneCategory(x.statusCategoryCode))
                        const doneCount = dayTasksRaw.filter(x =>
                            x.statusCategoryCode === 'DONE' || x.statusCategoryCode === 'ARCHIVED'
                        ).length
                        const heatLevel = doneCount === 0
                            ? 0
                            : doneCount <= 1
                                ? 1
                                : doneCount <= 3
                                    ? 2
                                    : doneCount <= 5
                                        ? 3
                                        : 4
                        const dayTasks = [...active, ...done]

                        const visible = dayTasks.slice(0, MAX_VISIBLE_TASKS)
                        const rest = dayTasks.length - visible.length
                        const isHover = hoverDay === day && draggingTaskId

                        return (
                            <div
                                key={i}
                                className={[
                                    'calendar__cell',
                                    !day ? 'calendar__cell--empty' : '',
                                    isToday ? 'calendar__cell--today' : '',
                                    isWeekend && day ? 'calendar__cell--weekend' : '',
                                    day ? `calendar__cell--heat-${heatLevel}` : '',
                                    isHover ? 'calendar__cell--drop-over' : '',
                                ].filter(Boolean).join(' ')}
                                onClick={day ? () => handleDayClick(day) : undefined}
                                onMouseEnter={day ? () => { hoveredDayRef.current = day } : undefined}
                                onMouseLeave={day ? () => {
                                    if (hoveredDayRef.current === day) hoveredDayRef.current = null
                                } : undefined}
                                onDragOver={day ? (e) => onDragOverDay(e, day) : undefined}
                                onDragLeave={day ? (e) => onDragLeaveDay(e, day) : undefined}
                                onDrop={day ? (e) => onDropDay(e, day) : undefined}
                                style={day ? { cursor: 'pointer' } : undefined}
                            >
                                {day && (
                                    <>
                                        <div className="calendar__cell-head">
                                            <div className="calendar__daynum">{day}</div>
                                            <DayLoadBar level={loadByDay[day]} />
                                        </div>
                                        <div className="calendar__tasks">
                                            {visible.map(task => {
                                                const isDone = isDoneCategory(task.statusCategoryCode)
                                                const color = categoryColor(task.statusCategoryCode)
                                                return (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        draggable
                                                        onDragStart={(e) => onDragStartTask(e, task)}
                                                        onDragEnd={onDragEndTask}
                                                        onMouseEnter={(e) => {
                                                            e.stopPropagation()
                                                            setHoveredTaskId(task.id)
                                                        }}
                                                        onMouseLeave={() => setHoveredTaskId(null)}
                                                        className={[
                                                            'calendar__task',
                                                            task.isOverdue && !isDone ? 'calendar__task--overdue' : '',
                                                            draggingTaskId === task.id ? 'calendar__task--dragging' : '',
                                                            isDone ? 'calendar__task--done' : '',
                                                        ].filter(Boolean).join(' ')}
                                                        style={{ '--task-accent': color }}
                                                        title={`${task.title}${task.projectTitle ? ' · ' + task.projectTitle : ''}`}
                                                        onClick={(e) => handleTaskClick(e, task)}
                                                    >
                                                        <span className="calendar__task-dot" />
                                                        <span className="calendar__task-title">
                                                            {task.title}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                            {rest > 0 && (
                                                <div className="calendar__more">+{rest} ещё</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {!loading && (
                <div className="calendar__heat-legend">
                    <span className="calendar__heat-legend-label">Выполнено за день:</span>
                    <span className="calendar__heat-legend-less">меньше</span>
                    {[0, 1, 2, 3, 4].map(level => (
                        <span
                            key={level}
                            className={`calendar__heat-legend-cell calendar__heat-legend-cell--${level}`}
                            title={level === 0 ? 'нет задач' : `${level === 1 ? '1' : level === 2 ? '2–3' : level === 3 ? '4–5' : '6+'} задач`}
                        />
                    ))}
                    <span className="calendar__heat-legend-more">больше</span>
                </div>
            )}

            <DayTasksModal
                open={!!openDay}
                date={openDay}
                tasks={dayTasksForModal}
                onClose={closeDayModal}
                onBack={backFromDayModal}
                onTaskMoved={() => reloadCalendar({ silent: true })}
                onOpenTask={(id) => { setOpenDay(null); setOpenTaskId(id) }}
                onOpenAttachments={handleOpenAttachments}
                onAddTask={handleAddTask}
            />

            {/* Единая модалка создания задачи — режим календаря */}
            <TaskFormModal
                open={!!createDate}
                onClose={() => setCreateDate(null)}
                onCreated={handleCreated}
                boards={boards}
                presetDeadline={createDate}
                mode="calendar"
            />

            <TaskDetailModal
                open={!!openTaskId}
                onClose={() => setOpenTaskId(null)}
                taskId={openTaskId}
                onOpenTask={setOpenTaskId}
                onUpdated={() => reloadCalendar({ silent: true })}
            />

            <AttachmentsModal
                open={!!attachmentsToView}
                attachments={attachmentsToView || []}
                taskId={attachmentsTaskId}
                onClose={() => { setAttachmentsToView(null); setAttachmentsTaskId(null) }}
                onUpdated={() => reloadCalendar({ silent: true })}
            />

            <ConfirmModal {...modalProps} />
        </div>
    )
})