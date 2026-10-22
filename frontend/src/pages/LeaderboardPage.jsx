import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { leaderboardApi } from '../api/api'
import AvatarWithFrame from '../components/layout/AvatarWithFrame'

const numberFmt = new Intl.NumberFormat('ru-RU')

function avatarOf(user) {
    return {
        code: user.avatarCode,
        emoji: user.avatarEmoji,
        imageUrl: user.avatarImageUrl || user.avatarUrl,
    }
}

export default function LeaderboardPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeCode, setActiveCode] = useState(null)

    useEffect(() => {
        let alive = true
        leaderboardApi.get()
            .then(({ data }) => {
                if (!alive) return
                setData(data)
                setActiveCode(data.categories?.[0]?.code || null)
            })
            .catch(err => {
                if (alive) setError(err.response?.data?.message || 'Не удалось загрузить лидерборд')
            })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [])

    const active = useMemo(
        () => data?.categories?.find(c => c.code === activeCode) || data?.categories?.[0] || null,
        [data, activeCode],
    )

    if (loading) return <div className="loading">Загрузка…</div>

    if (error || !data) {
        return (
            <div className="error-page">
                <h1>Лидерборд недоступен</h1>
                <p>{error || 'Попробуйте позже'}</p>
            </div>
        )
    }

    const top = active?.entries?.slice(0, 3) || []
    const rest = active?.entries?.slice(3) || []

    return (
        <div className="leaderboard-page">
            <nav className="section-subnav" aria-label="Статистика и лидерборд">
                <Link to="/stats" className="section-subnav__item">
                    📊 Статистика
                </Link>
                <Link to="/leaderboard" className="section-subnav__item section-subnav__item--active">
                    🏆 Лидерборд
                </Link>
            </nav>

            <header className="leaderboard-page__head">
                <div>
                    <h1 className="leaderboard-page__title">🏆 Лидерборд</h1>
                    <p className="leaderboard-page__sub">
                        Все пользователи TaskBoard и их статистика. Выберите категорию — рейтинг
                        пересчитается. {data.totalUsers} участников.
                    </p>
                </div>
            </header>

            <div className="leaderboard-tabs" role="tablist" aria-label="Категории лидерборда">
                {data.categories.map(c => (
                    <button
                        key={c.code}
                        type="button"
                        role="tab"
                        aria-selected={c.code === active?.code}
                        className={`leaderboard-tab ${c.code === active?.code ? 'leaderboard-tab--active' : ''}`}
                        onClick={() => setActiveCode(c.code)}
                    >
                        <span className="leaderboard-tab__icon">{c.icon}</span>
                        <span>{c.title}</span>
                    </button>
                ))}
            </div>

            {active && (
                <>
                    <div className="leaderboard-category-note">
                        <span className="leaderboard-category-note__icon">{active.icon}</span>
                        <span>{active.description}</span>
                    </div>

                    {top.length > 0 && (
                        <div className="leaderboard-podium">
                            {top.map((entry, i) => (
                                <Link
                                    key={entry.user.userId}
                                    to={`/users/${entry.user.userId}`}
                                    className={`leaderboard-podium__card leaderboard-podium__card--${i + 1} ${entry.me ? 'leaderboard-podium__card--me' : ''}`}
                                >
                                    <span className="leaderboard-podium__medal">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                    </span>
                                    <AvatarWithFrame
                                        avatar={avatarOf(entry.user)}
                                        frame={{ cssClass: entry.user.frameCssClass }}
                                        displayName={entry.user.displayName}
                                        username={entry.user.username}
                                        size={56}
                                    />
                                    <span className="leaderboard-podium__name">
                                        {entry.user.displayName || entry.user.username}
                                        {entry.me && <span className="leaderboard-podium__you">вы</span>}
                                    </span>
                                    <span className="leaderboard-podium__username">@{entry.user.username}</span>
                                    <span className="leaderboard-podium__value">
                                        {numberFmt.format(entry.value)}
                                        <small>{active.unit}</small>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="leaderboard-table">
                        <div className="leaderboard-table__head">
                            <span>#</span>
                            <span>Пользователь</span>
                            <span className="leaderboard-table__value-head">{active.title}</span>
                        </div>
                        {rest.map(entry => (
                            <Link
                                key={entry.user.userId}
                                to={`/users/${entry.user.userId}`}
                                className={`leaderboard-row ${entry.me ? 'leaderboard-row--me' : ''}`}
                            >
                                <span className="leaderboard-row__rank">{entry.rank}</span>
                                <span className="leaderboard-row__user">
                                    <AvatarWithFrame
                                        avatar={avatarOf(entry.user)}
                                        frame={{ cssClass: entry.user.frameCssClass }}
                                        displayName={entry.user.displayName}
                                        username={entry.user.username}
                                        size={34}
                                    />
                                    <span className="leaderboard-row__names">
                                        <span className="leaderboard-row__name">
                                            {entry.user.displayName || entry.user.username}
                                            {entry.me && <span className="leaderboard-row__you">вы</span>}
                                        </span>
                                        <span className="leaderboard-row__username">@{entry.user.username}</span>
                                    </span>
                                </span>
                                <span className="leaderboard-row__value">
                                    {numberFmt.format(entry.value)}
                                    <small>{active.unit}</small>
                                </span>
                            </Link>
                        ))}
                        {active.entries?.length === 0 && (
                            <div className="leaderboard-empty">Пока нет данных</div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
