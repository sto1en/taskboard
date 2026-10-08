import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { calendarApi, boardsApi, statsApi, tasksApi } from '../api/api'
import useT from '../hooks/useT'
import useHotkeys from '../hooks/useHotkeys'
import useConfirmDelete from '../hooks/useConfirmDelete'
import { useAuth } from '../context/AuthContext'
import DayTasksModal from '../components/Calendar/DayTasksModal'
import CreateTaskModal from '../components/Task/CreateTaskModal'
import TaskDetailModal from '../components/Task/TaskDetailModal'
import AttachmentsModal from '../components/Task/AttachmentsModal'
import ConfirmModal from '../components/common/ConfirmModal'
import DayLoadBar from '../components/Calendar/DayLoadBar'

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

export default function CalendarPage() {
    const t = useT()
    const nav = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user, updateUser } = useAuth()
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

        Promise.all([
            calendarApi.get(from, to),
            statsApi.dailyLoad(from, to),
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

                window.dispatchEvent(new Event('tree:refresh'))
            })
            .catch(err => console.error('Calendar load error:', err))
            .finally(() => {
                if (!silent) setLoading(false)
            })
    }

    // eslint-disable-next-line
    useEffect(() => reloadCalendar(), [year, month])

    useEffect(() => {
        const onRefresh = () => reloadCalendar({ silent: true })
        window.addEventListener('tasks:refresh', onRefresh)
        return () => window.removeEventListener('tasks:refresh', onRefresh)
        // eslint-disable-next-line
    }, [year, month])

    useEffect(() => {
        const handler = (e) => {
            if (e.detail !== 'calendar-day') return
            const hovered = hoveredDayRef.current
            if (!hovered) return
            if (document.querySelector('.modal-overlay')) return
            setCreateDate(dateToIso(hovered))
        }
        window.addEventListener('hotkey:new', handler)
        return () => window.removeEventListener('hotkey:new', handler)
        // eslint-disable-next-line
    }, [year, month])

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
            window.dispatchEvent(new Event('tree:refresh'))
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
            window.dispatchEvent(new Event('tree:refresh'))
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
            window.dispatchEvent(new Event('tree:refresh'))
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
        // Delete — удалить
        {
            combo: 'delete',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !!hoveredTaskId && !modalProps.open,
            handler: handleCalendarDeleteWithConfirm,
        },
        // Backspace — перенести в отменённые
        {
            combo: 'backspace',
            allowInInput: false,
            when: () => !openDay && !openTaskId && !createDate && !!hoveredTaskId && !modalProps.open,
            handler: handleCalendarToggleCancel,
        },
    ])

    const dayTasksForModal = openDay
        ? (tasksByDay[Number(openDay.split('-')[2])] || [])
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
                        const dayTasksRaw = day ? (tasksByDay[day] || []) : []

                        const active = dayTasksRaw.filter(x => !isDoneCategory(x.statusCategoryCode))
                        const done = dayTasksRaw.filter(x => isDoneCategory(x.statusCategoryCode))
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

            <CreateTaskModal
                open={!!createDate}
                onClose={() => setCreateDate(null)}
                onCreated={handleCreated}
                boards={boards}
                presetDeadline={createDate}
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
}