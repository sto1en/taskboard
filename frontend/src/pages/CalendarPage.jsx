const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Демонстрационные задачи с дедлайнами. Позже — загрузка из API.
const DEMO_TASKS = [
    { id: 1,  title: 'Improve Hide empty lane',      deadline: '2026-09-20' },
    { id: 2,  title: 'Comment permissions',          deadline: '2026-09-22' },
    { id: 3,  title: 'Export to CSV',                deadline: '2026-09-25' },
    { id: 4,  title: 'View top filter redesign',     deadline: '2026-09-28' },
    { id: 5,  title: 'Owner filter autofill',        deadline: '2026-10-01' },
    { id: 6,  title: 'Add and open',                 deadline: '2026-10-03' },
    { id: 7,  title: 'Refactor auth module',         deadline: '2026-09-19' },
    { id: 8,  title: 'Fix sidebar scroll',           deadline: '2026-09-21' },
]

export default function CalendarPage() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    const firstDay = new Date(year, month, 1)
    const startWeekday = (firstDay.getDay() + 6) % 7   // Пн = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Группируем задачи по дню месяца
    const tasksByDay = {}
    DEMO_TASKS.forEach(t => {
        const d = new Date(t.deadline)
        if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate()
            ;(tasksByDay[day] ||= []).push(t)
        }
    })

    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return (
        <div className="calendar">
            <h2 className="calendar__title">
                {MONTHS[month]} {year}
            </h2>

            <div className="calendar__grid">
                {WEEKDAYS.map(w => (
                    <div key={w} className="calendar__weekday">{w}</div>
                ))}

                {cells.map((day, i) => (
                    <div
                        key={i}
                        className={`calendar__cell ${day ? '' : 'calendar__cell--empty'} ${
                            day === today.getDate() ? 'calendar__cell--today' : ''
                        }`}
                    >
                        {day && (
                            <>
                                <div className="calendar__daynum">{day}</div>
                                <div className="calendar__tasks">
                                    {(tasksByDay[day] || []).map(t => (
                                        <div key={t.id} className="calendar__task" title={t.title}>
                                            {t.title}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}