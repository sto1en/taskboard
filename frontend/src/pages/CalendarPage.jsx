import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { calendarApi, boardsApi, statsApi, tasksApi } from '../api/api'
import useT from '../hooks/useT'
import DayTasksModal from '../components/Calendar/DayTasksModal'
import CreateTaskModal from '../components/Task/CreateTaskModal'
import TaskDetailModal from '../components/Task/TaskDetailModal'
import AttachmentsModal from '../components/Task/AttachmentsModal'
import DayLoadBar from '../components/Calendar/DayLoadBar'

const MAX_VISIBLE_TASKS = 3

export default function CalendarPage() {
    const t = useT()
    const nav = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const today = new Date()

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

    // Для drag&drop
    const [draggingTaskId, setDraggingTaskId] = useState(null)
    const [hoverDay, setHoverDay] = useState(null)

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

    const reloadCalendar = () => {
        const from = new Date(year, month, 1).toISOString().slice(0, 10)
        const to = new Date(year, month + 1, 0).toISOString().slice(0, 10)
        setLoading(true)
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
            })
            .catch(err => console.error('Calendar load error:', err))
            .finally(() => setLoading(false))
    }

    // eslint-disable-next-line
    useEffect(reloadCalendar, [year, month])

    useEffect(() => {
        const onRefresh = () => reloadCalendar()
        window.addEventListener('tasks:refresh', onRefresh)
        return () => window.removeEventListener('tasks:refresh', onRefresh)
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
    const handleCreated = () => { setCreateDate(null); reloadCalendar() }

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

    // === Drag&drop задач ===
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
            reloadCalendar()
        } catch (err) {
            console.error('Move date failed:', err)
            alert(err.response?.data?.message || 'Не удалось перенести задачу')
        }
    }

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
                        const dayTasks = day ? (tasksByDay[day] || []) : []
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
                                                const color = task.statusAccentCode
                                                    ? `var(--accent-${task.statusAccentCode})`
                                                    : 'var(--accent, var(--primary))'
                                                return (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        draggable
                                                        onDragStart={(e) => onDragStartTask(e, task)}
                                                        onDragEnd={onDragEndTask}
                                                        className={`calendar__task ${task.isOverdue ? 'calendar__task--overdue' : ''} ${draggingTaskId === task.id ? 'calendar__task--dragging' : ''}`}
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
                onTaskMoved={reloadCalendar}
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
                onUpdated={reloadCalendar}
            />

            <AttachmentsModal
                open={!!attachmentsToView}
                attachments={attachmentsToView || []}
                taskId={attachmentsTaskId}
                onClose={() => { setAttachmentsToView(null); setAttachmentsTaskId(null) }}
                onUpdated={reloadCalendar}
            />
        </div>
    )
}