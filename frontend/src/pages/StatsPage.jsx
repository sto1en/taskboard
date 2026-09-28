import { useEffect, useState } from 'react'
import { statsApi } from '../api/api'

const PERIODS = [
    { key: 'day',   label: 'Сегодня' },
    { key: 'week',  label: 'Неделя'  },
    { key: 'month', label: 'Месяц'   },
    { key: 'year',  label: 'Год'     },
]

export default function StatsPage() {
    const [period, setPeriod] = useState('month')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        statsApi.get(period)
            .then(({ data }) => setData(data))
            .catch(err => console.error('Stats load error:', err))
            .finally(() => setLoading(false))
    }, [period])

    if (loading) return <div className="loading">Загрузка...</div>
    if (!data) return <div className="loading">Нет данных</div>

    const total = data.total || 0
    const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0

    return (
        <div className="stats">
            <div className="stats__head">
                <h2 className="stats__title">Статистика</h2>
                <div className="stats__periods">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            className={`stats__period ${p.key === period ? 'stats__period--active' : ''}`}
                            onClick={() => setPeriod(p.key)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="stats__cards">
                <div className="stat-card">
                    <div className="stat-card__label">Всего задач</div>
                    <div className="stat-card__value">{data.total}</div>
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
                    {data.done} из {data.total} задач выполнено ({pct(data.done)}%)
                </div>
            </div>
        </div>
    )
}