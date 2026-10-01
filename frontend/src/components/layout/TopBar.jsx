import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchApi } from '../../api/api'
import useT from '../../hooks/useT'

export default function TopBar() {
    const nav = useNavigate()
    const { user } = useAuth()
    const t = useT()
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
            searchApi.suggestions(q)
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

    const openFullSearch = () => {
        const q = query.trim()
        if (!q) return
        go(`/search?q=${encodeURIComponent(q)}`)
    }

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            openFullSearch()
        }
        if (e.key === 'Escape') {
            setOpen(false)
            e.target.blur()
        }
    }

    const displayName = user?.profile?.displayName || user?.username || 'User'
    const initial = displayName.charAt(0).toUpperCase()

    const total = results?.totalCount || 0
    const hasResults = results && total > 0

    return (
        <header className="topbar">
            <div className="topbar__search-wrap" ref={wrapperRef}>
                <input
                    className="topbar__search"
                    placeholder={t.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results && setOpen(true)}
                    onKeyDown={onKeyDown}
                />

                {open && (
                    <div className="topbar__results">
                        {loading && <div className="topbar__loading">{t.searchLoading}</div>}

                        {!loading && !hasResults && query.trim().length >= 2 && (
                            <div className="topbar__empty">{t.searchEmpty}</div>
                        )}

                        {!loading && results && (
                            <>
                                {results.boards?.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">{t.groupBoards}</div>
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

                                {results.projects?.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">{t.groupProjects}</div>
                                        {results.projects.map(p => (
                                            <div
                                                key={`p-${p.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/boards/${p.boardId}/projects/${p.projectId}`)}
                                            >
                                                <div className="topbar__item-title">{p.title}</div>
                                                {p.subtitle && (
                                                    <div className="topbar__item-sub">{p.subtitle}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {results.tasks?.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">{t.groupTasks}</div>
                                        {results.tasks.map(task => (
                                            <div
                                                key={`t-${task.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
                                            >
                                                <div className="topbar__item-title">{task.title}</div>
                                                {task.subtitle && (
                                                    <div className="topbar__item-sub">{task.subtitle}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {results.tags?.length > 0 && (
                                    <div className="topbar__group">
                                        <div className="topbar__group-title">{t.groupTags}</div>
                                        {results.tags.map(tag => (
                                            <div
                                                key={`tag-${tag.id}`}
                                                className="topbar__item"
                                                onClick={() => go(`/search?tagIds=${tag.id}`)}
                                            >
                                                <div className="topbar__item-title">{tag.title}</div>
                                                {tag.subtitle && (
                                                    <div className="topbar__item-sub">{tag.subtitle}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {hasResults && (
                                    <button
                                        type="button"
                                        className="topbar__show-all"
                                        onClick={openFullSearch}
                                    >
                                        {t.showAllResults || 'Show all results'} →
                                    </button>
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