import { useEffect, useState } from 'react'
import { calendarApi } from '../api/api'

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function CalendarPage() {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [tasksByDay, setTasksByDay] = useState({})
    const [loading, setLoading] = useState(true)

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

    const prevMonth = () => setMonth(m => m === 0 ? (setYear(y => y - 1), 11) : m - 1)
    const nextMonth = () => setMonth(m => m === 11 ? (setYear(y => y + 1), 0) : m + 1)

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
                                        {(tasksByDay[day] || []).map(t => (
                                            <div
                                                key={t.id}
                                                className={`calendar__task ${t.isOverdue ? 'calendar__task--overdue' : ''}`}
                                                title={`${t.title}${t.projectTitle ? ' · ' + t.projectTitle : ''}`}
                                            >
                                                {t.title}
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