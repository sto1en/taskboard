import { useEffect, useState } from 'react'
import { statsApi } from '../api/api'
import useT from '../hooks/useT'

export default function StatsPage() {
    const t = useT()
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

    if (loading) return <div className="loading">{t.loading}</div>
    if (!data) return <div className="loading">{t.nothingFound}</div>

    const periods = [
        { key: 'day',   label: t.periodDay || 'Today' },
        { key: 'week',  label: t.periodWeek || 'Week' },
        { key: 'month', label: t.periodMonth || 'Month' },
        { key: 'year',  label: t.periodYear || 'Year' },
    ]

    const total = data.total || 0
    const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0

    return (
        <div className="stats">
            <div className="stats__head">
                <h2 className="stats__title">{t.statsTitle || 'Statistics'}</h2>
                <div className="stats__periods">
                    {periods.map(p => (
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
                    <div className="stat-card__label">{t.statsTotal || 'Total tasks'}</div>
                    <div className="stat-card__value">{data.total}</div>
                </div>
                <div className="stat-card stat-card--done">
                    <div className="stat-card__label">{t.statsDone || 'Done'}</div>
                    <div className="stat-card__value">{data.done}</div>
                    <div className="stat-card__pct">{pct(data.done)}%</div>
                </div>
                <div className="stat-card stat-card--active">
                    <div className="stat-card__label">{t.statsActive || 'Active'}</div>
                    <div className="stat-card__value">{data.active}</div>
                    <div className="stat-card__pct">{pct(data.active)}%</div>
                </div>
                <div className="stat-card stat-card--archived">
                    <div className="stat-card__label">{t.statsArchived || 'Archived'}</div>
                    <div className="stat-card__value">{data.archived}</div>
                    <div className="stat-card__pct">{pct(data.archived)}%</div>
                </div>
            </div>

            <div className="stats__progress">
                <div className="stats__progress-label">{t.statsProgress || 'Completion progress'}</div>
                <div className="stats__progress-bar">
                    <div
                        className="stats__progress-fill"
                        style={{ width: `${pct(data.done)}%` }}
                    />
                </div>
                <div className="stats__progress-text">
                    {t.statsProgressText
                        ? t.statsProgressText(data.done, data.total, pct(data.done))
                        : `${data.done} / ${data.total} (${pct(data.done)}%)`}
                </div>
            </div>
        </div>
    )
}