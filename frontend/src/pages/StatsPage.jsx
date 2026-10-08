import { useEffect, useState } from 'react'
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { statsApi, achievementsApi } from '../api/api'
import useT from '../hooks/useT'
import { useAuth } from '../context/AuthContext'
import AchievementCard from '../components/Achievement/AchievementCard'
import AchievementToast from '../components/Achievement/AchievementToast'

const RU_MONTHS_GEN = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const EN_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDayLabel(iso, lang) {
    if (!iso) return ''
    const [, m, d] = iso.split('-').map(Number)
    if (!m || !d) return iso
    if (lang === 'en') return `${EN_MONTHS[m - 1]} ${d}`
    return `${d} ${RU_MONTHS_GEN[m - 1]}`
}

export default function StatsPage() {
    const t = useT()
    const { user } = useAuth()
    const lang = user?.locale?.language || 'ru'

    const [tab, setTab] = useState('overview')
    const [period, setPeriod] = useState('month')

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const [achievements, setAchievements] = useState([])
    const [achLoading, setAchLoading] = useState(false)
    const [toastQueue] = useState([])

    useEffect(() => {
        if (tab !== 'overview') return
        setLoading(true)
        statsApi.overview(period)
            .then(({ data }) => setData(data))
            .catch(err => console.error('Stats load error:', err))
            .finally(() => setLoading(false))
    }, [period, tab])

    useEffect(() => {
        if (tab !== 'achievements') return
        setAchLoading(true)
        achievementsApi.list()
            .then(({ data }) => setAchievements(data || []))
            .catch(err => console.error('Achievements load error:', err))
            .finally(() => setAchLoading(false))
    }, [tab])

    const periods = [
        { key: 'day',   label: t.periodDay || 'Today' },
        { key: 'week',  label: t.periodWeek || 'Week' },
        { key: 'month', label: t.periodMonth || 'Month' },
        { key: 'year',  label: t.periodYear || 'Year' },
    ]

    const pct = (n) => data && data.total > 0 ? Math.round((n / data.total) * 100) : 0
    const unlockedCount = achievements.filter(a => a.unlocked).length

    const dailyData = data?.daily?.map(d => ({
        date: formatDayLabel(d.date, lang),
        Создано: d.created,
        Закрыто: d.done,
    })) || []

    const statusData = (data?.byStatus || [])
        .filter(s => s.count > 0)
        .map(s => ({
            name: s.title,
            value: s.count,
            accent: `var(--accent-${s.accentCode || 'gray'})`,
            category: s.categoryCode,
        }))

    const CATEGORY_HEX = {
        ACTIVE:    '#4c9aff',
        FROZEN:    '#ffab00',
        DONE:      '#36b37e',
        EXPIRED:   '#ff5630',
        CANCELLED: '#97a0af',
        ARCHIVED:  '#6b778c',
    }

    const tagData = (data?.topTags || []).map(t => ({
        name: t.title,
        Задач: t.count,
    }))

    return (
        <div className="stats">
            <div className="stats__head">
                <h2 className="stats__title">{t.statsTitle || 'Statistics'}</h2>
            </div>

            <div className="stats__tabs">
                <button
                    className={`stats__tab ${tab === 'overview' ? 'stats__tab--active' : ''}`}
                    onClick={() => setTab('overview')}
                >Обзор</button>
                <button
                    className={`stats__tab ${tab === 'achievements' ? 'stats__tab--active' : ''}`}
                    onClick={() => setTab('achievements')}
                >
                    Ачивки
                    {achievements.length > 0 && (
                        <span className="stats__tab-badge">
                            {unlockedCount}/{achievements.length}
                        </span>
                    )}
                </button>
            </div>

            {tab === 'overview' && (
                <>
                    <div className="stats__periods" style={{ marginBottom: 20 }}>
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

                    {loading && <div className="loading">{t.loading}</div>}
                    {!loading && !data && <div className="loading">{t.nothingFound}</div>}

                    {!loading && data && (
                        <>
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
                                    {data.done} / {data.total} ({pct(data.done)}%)
                                </div>
                            </div>

                            <div className="stats__chart-card">
                                <div className="stats__chart-title">Динамика</div>
                                {dailyData.length === 0 ? (
                                    <div className="stats__chart-empty">Нет данных за период</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="var(--text-muted)"
                                                fontSize={11}
                                                interval="preserveStartEnd"
                                                minTickGap={24}
                                            />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 8,
                                                    color: 'var(--text)',
                                                }}
                                            />
                                            <Line type="monotone" dataKey="Создано" stroke="#4c9aff" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="Закрыто" stroke="#36b37e" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            <div className="stats__charts-row">
                                <div className="stats__chart-card">
                                    <div className="stats__chart-title">По статусам</div>
                                    {statusData.length === 0 ? (
                                        <div className="stats__chart-empty">Нет данных</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={90}
                                                    innerRadius={50}
                                                    paddingAngle={2}
                                                >
                                                    {statusData.map((s, i) => (
                                                        <Cell key={i} fill={CATEGORY_HEX[s.category] || '#97a0af'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--surface)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 8,
                                                        color: 'var(--text)',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                <div className="stats__chart-card">
                                    <div className="stats__chart-title">Топ тегов</div>
                                    {tagData.length === 0 ? (
                                        <div className="stats__chart-empty">Нет данных</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={tagData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                                                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={100} />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--surface)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 8,
                                                        color: 'var(--text)',
                                                    }}
                                                />
                                                <Bar dataKey="Задач" fill="var(--accent, #4c9aff)" radius={[0, 6, 6, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {tab === 'achievements' && (
                <>
                    {achLoading && <div className="loading">{t.loading}</div>}
                    {!achLoading && achievements.length === 0 && (
                        <div className="achievements__empty">Пока нет достижений</div>
                    )}
                    {!achLoading && achievements.length > 0 && (
                        <div className="achievements__grid">
                            {achievements.map(a => (
                                <AchievementCard key={a.id} achievement={a} />
                            ))}
                        </div>
                    )}
                </>
            )}

            <AchievementToast queue={toastQueue} onDismiss={() => {}} />
        </div>
    )
}