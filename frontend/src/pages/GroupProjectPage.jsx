import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { groupApi } from '../api/api'
import ProjectKanbanPage from './ProjectKanbanPage'

/**
 * Рабочее пространство группового проекта.
 *
 * Сначала получаем boardId из /api/group/projects/{id} (доступ по
 * project_members), затем рендерим обычный канбан проекта. Данные доски
 * (название, другие проекты, участники) не запрашиваются.
 */
export default function GroupProjectPage() {
    const { projectId } = useParams()
    const nav = useNavigate()

    const [workspace, setWorkspace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let alive = true
        groupApi.get(projectId)
            .then(({ data }) => { if (alive) setWorkspace(data) })
            .catch(err => {
                if (alive) setError(err.response?.data?.message || 'Проект не найден')
            })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [projectId])

    if (loading) return <div className="loading">Загрузка…</div>

    if (error || !workspace) {
        return (
            <div className="error-page">
                <h1>Нет доступа</h1>
                <p>{error || 'Проект не найден'}</p>
                <button type="button" className="btn btn-primary" onClick={() => nav('/group')}>
                    К групповым проектам
                </button>
            </div>
        )
    }

    return (
        <ProjectKanbanPage
            boardId={workspace.boardId}
            projectId={workspace.project.id}
            groupMode
        />
    )
}
