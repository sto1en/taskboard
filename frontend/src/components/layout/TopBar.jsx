import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchApi } from '../../api/api'

export default function TopBar() {
    const nav = useNavigate()
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState(null)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        const onClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        window.addEventListener('mousedown', onClick)
        return () => window.removeEventListener('mousedown', onClick)
    }, [])

    useEffect(() => {
        const q = query.trim()
        if (q.length < 2) {
            setResults(null)
            setOpen(false)
            return
        }

        setLoading(true)
        const timer = setTimeout(() => {
            searchApi.global(q)
                .then(({ data }) => {
                    setResults(data)
                    setOpen(true)
                })
                .catch(() => setResults(null))
                .finally(() => setLoading(false))
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const go = (path) => {
        nav(path)
        setQuery('')
        setResults(null)
        setOpen(false)
    }

    const displayName = user?.profile?.displayName || user?.username || 'User'
    const initial = displayName.charAt(0).toUpperCase()

    const hasResults = results && (
        results.boards.length > 0 ||
        results.projects.length > 0 ||
        results.tasks.length > 0 ||
        results.tags.length > 0
    )

    return (
        <header className="topbar">
            <div className="topbar__search-wrap" ref={wrapperRef}>
                <input
                    className="topbar__search"
                    placeholder="Поиск по доскам, проектам, задачам, тегам..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results && setOpen(true)}
                />

                {open && (
                    <div className="topbar__results">
                        {loading && <div className="topbar__loading">Поиск...</div>}

                        {!loading && !hasResults && query.trim().length >= 2 && (
                            <div className="topbar__empty">Ничего не найдено</div>
                        )}

                        {!loading && results && (
                            <>
                                {results.boards.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">Доски</div>
                                        {results.boards.map(b => (
                                            <div
                                                key={`b-${b.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/boards/${b.id}`)}
                                            >
                                                <div className="topbar__item-title">{b.title}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {results.projects.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">Проекты</div>
                                        {results.projects.map(p => (
                                            <div
                                                key={`p-${p.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/boards/${p.boardId}/projects/${p.id}`)}
                                            >
                                                <div className="topbar__item-title">{p.title}</div>
                                                {p.subtitle && (
                                                    <div className="topbar__item-sub">{p.subtitle}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {results.tasks.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">Задачи</div>
                                        {results.tasks.map(t => (
                                            <div
                                                key={`t-${t.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/boards/${t.boardId}/projects/${t.projectId}?task=${t.id}`)}
                                            >
                                                <div className="topbar__item-title">{t.title}</div>
                                                {t.subtitle && (
                                                    <div className="topbar__item-sub">{t.subtitle}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {results.tags.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">Теги</div>
                                        {results.tags.map(t => (
                                            <div
                                                key={`tag-${t.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/boards/${t.boardId}/settings`)}
                                            >
                                                <div className="topbar__item-title">{t.title}</div>
                                                {t.subtitle && (
                                                    <div className="topbar__item-sub">{t.subtitle}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="topbar__spacer" />

            <div className="topbar__avatar" title={displayName}>{initial}</div>
        </header>
    )
}