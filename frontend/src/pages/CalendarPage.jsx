import { useEffect, useState } from 'react'
import { calendarApi } from '../api/api'
import useT from '../hooks/useT'

export default function CalendarPage() {
    const t = useT()
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [tasksByDay, setTasksByDay] = useState({})
    const [loading, setLoading] = useState(true)

    const MONTHS = [
        t.monthJanuary || 'January',
        t.monthFebruary || 'February',
        t.monthMarch || 'March',
        t.monthApril || 'April',
        t.monthMay || 'May',
        t.monthJune || 'June',
        t.monthJuly || 'July',
        t.monthAugust || 'August',
        t.monthSeptember || 'September',
        t.monthOctober || 'October',
        t.monthNovember || 'November',
        t.monthDecember || 'December',
    ]
    const WEEKDAYS = [
        t.weekdayMon || 'Mon',
        t.weekdayTue || 'Tue',
        t.weekdayWed || 'Wed',
        t.weekdayThu || 'Thu',
        t.weekdayFri || 'Fri',
        t.weekdaySat || 'Sat',
        t.weekdaySun || 'Sun',
    ]

    useEffect(() => {
        const from = new Date(year, month, 1).toISOString().slice(0, 10)
        const to = new Date(year, month + 1, 0).toISOString().slice(0, 10)

        setLoading(true)
        calendarApi.get(from, to)
            .then(({ data }) => {
                const map = {}
                data.days.forEach(d => {
                    const day = Number(d.date.split('-')[2])
                    map[day] = d.tasks
                })
                setTasksByDay(map)
            })
            .catch(err => console.error('Calendar load error:', err))
            .finally(() => setLoading(false))
    }, [year, month])

    const firstDay = new Date(year, month, 1)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const prevMonth = () => {
        if (month === 0) {
            setYear(y => y - 1)
            setMonth(11)
        } else {
            setMonth(m => m - 1)
        }
    }

    const nextMonth = () => {
        if (month === 11) {
            setYear(y => y + 1)
            setMonth(0)
        } else {
            setMonth(m => m + 1)
        }
    }

    return (
        <div className="calendar">
            <div className="calendar__head">
                <button className="btn btn-ghost" onClick={prevMonth}>←</button>
                <h2 className="calendar__title">{MONTHS[month]} {year}</h2>
                <button className="btn btn-ghost" onClick={nextMonth}>→</button>
            </div>

            <div className="calendar__grid">
                {WEEKDAYS.map(w => <div key={w} className="calendar__weekday">{w}</div>)}

                {cells.map((day, i) => {
                    const isToday = day === today.getDate()
                        && month === today.getMonth()
                        && year === today.getFullYear()
                    return (
                        <div key={i} className={`calendar__cell ${day ? '' : 'calendar__cell--empty'} ${isToday ? 'calendar__cell--today' : ''}`}>
                            {day && (
                                <>
                                    <div className="calendar__daynum">{day}</div>
                                    <div className="calendar__tasks">
                                        {(tasksByDay[day] || []).map(task => (
                                            <div
                                                key={task.id}
                                                className={`calendar__task ${task.isOverdue ? 'calendar__task--overdue' : ''}`}
                                                title={`${task.title}${task.projectTitle ? ' · ' + task.projectTitle : ''}`}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}