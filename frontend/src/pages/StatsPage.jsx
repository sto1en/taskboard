const PERIODS = [
    { key: 'day',   label: 'Сегодня' },
    { key: 'week',  label: 'Неделя'  },
    { key: 'month', label: 'Месяц'   },
    { key: 'year',  label: 'Год'     },
]

// Демонстрационные данные. Позже — fetch('/api/stats?period=...')
const DEMO_STATS = {
    day:   { done: 2,  active: 5,  archived: 1 },
    week:  { done: 9,  active: 14, archived: 3 },
    month: { done: 32, active: 18, archived: 7 },
    year:  { done: 210, active: 25, archived: 42 },
}

export default function StatsPage() {
    // Показываем статистику за месяц по умолчанию.
    const period = 'month'
    const data = DEMO_STATS[period]

    const total = data.done + data.active + data.archived
    const pct = (n) => total ? Math.round((n / total) * 100) : 0

    return (
        <div className="stats">
            <div className="stats__head">
                <h2 className="stats__title">Статистика</h2>

                <div className="stats__periods">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            className={`stats__period ${p.key === period ? 'stats__period--active' : ''}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="stats__cards">
                <div className="stat-card">
                    <div className="stat-card__label">Всего задач</div>
                    <div className="stat-card__value">{total}</div>
                </div>
                <div className="stat-card stat-card--done">
                    <div className="stat-card__label">Выполнено</div>
                    <div className="stat-card__value">{data.done}</div>
                    <div className="stat-card__pct">{pct(data.done)}%</div>
                </div>
                <div className="stat-card stat-card--active">
                    <div className="stat-card__label">Активные</div>
                    <div className="stat-card__value">{data.active}</div>
                    <div className="stat-card__pct">{pct(data.active)}%</div>
                </div>
                <div className="stat-card stat-card--archived">
                    <div className="stat-card__label">Архив</div>
                    <div className="stat-card__value">{data.archived}</div>
                    <div className="stat-card__pct">{pct(data.archived)}%</div>
                </div>
            </div>

            <div className="stats__progress">
                <div className="stats__progress-label">Прогресс выполнения</div>
                <div className="stats__progress-bar">
                    <div
                        className="stats__progress-fill"
                        style={{ width: `${pct(data.done)}%` }}
                    />
                </div>
                <div className="stats__progress-text">
                    {data.done} из {total} задач выполнено ({pct(data.done)}%)
                </div>
            </div>
        </div>
    )
}