import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { searchApi, projectsApi } from '../api/api'
import useT from '../hooks/useT'
import SearchResults from '../components/Search/SearchResults'
import TaskDetailModal from '../components/Task/TaskDetailModal'

export default function ProjectSearchPage() {
    const t = useT()
    const nav = useNavigate()
    const { boardId, projectId } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState([])
    const [openTaskId, setOpenTaskId] = useState(null)

    const q = searchParams.get('q') || ''

    useEffect(() => {
        if (!projectId) return
        projectsApi.get(projectId)
            .then(({ data }) => setProject(data))
            .catch(() => setProject(null))
    }, [projectId])

    useEffect(() => {
        if (!projectId) return
        if (!q.trim()) {
            setItems([])
            return
        }
        setLoading(true)
        searchApi.inProject(projectId, q)
            .then(({ data }) => setItems(data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false))
    }, [projectId, q])

    const onChangeQuery = (value) => {
        const p = new URLSearchParams(searchParams)
        if (value) p.set('q', value)
        else p.delete('q')
        setSearchParams(p, { replace: true })
    }

    return (
        <div className="search-page search-page--project">
            <div className="search-page__head">
                <button
                    className="btn btn-ghost"
                    onClick={() => nav(`/boards/${boardId}/projects/${projectId}`)}
                >
                    ←
                </button>
                <h1 className="search-page__title">
                    {t.searchInProject || 'Search in project'}
                    {project && <span className="search-page__query"> · {project.title}</span>}
                </h1>
                <div className="search-page__spacer" />
            </div>

            <div className="search-page__input-wrap">
                <input
                    className="input search-page__input"
                    placeholder={t.searchPlaceholder}
                    value={q}
                    onChange={(e) => onChangeQuery(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="search-page__body search-page__body--single">
                <div className="search-page__main">
                    <SearchResults
                        items={items}
                        query={q}
                        loading={loading}
                        onOpenTask={(id) => setOpenTaskId(id)}
                    />
                </div>
            </div>

            <TaskDetailModal
                open={!!openTaskId}
                onClose={() => setOpenTaskId(null)}
                taskId={openTaskId}
                onOpenTask={(id) => setOpenTaskId(id)}
                onUpdated={() => {
                    if (q.trim()) {
                        searchApi.inProject(projectId, q)
                            .then(({ data }) => setItems(data))
                            .catch(() => {})
                    }
                }}
            />
        </div>
    )
}