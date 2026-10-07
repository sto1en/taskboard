import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardsApi, projectsApi } from '../api/api'
import BoardToolbar from '../components/Board/BoardToolbar'
import ProjectsGrid from '../components/Project/ProjectsGrid'
import useT from '../hooks/useT'

export default function BoardDetailPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const t = useT()
    const [board, setBoard] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const reloadProjects = useCallback(() => {
        if (!id) return
        projectsApi.listByBoard(id)
            .then(({ data }) => setProjects(data))
            .catch(() => {})
    }, [id])

    useEffect(() => {
        if (!id) return

        setLoading(true)
        setError(null)

        Promise.all([
            boardsApi.get(id),
            projectsApi.listByBoard(id),
        ])
            .then(([boardRes, projectsRes]) => {
                setBoard(boardRes.data)
                setProjects(projectsRes.data)
            })
            .catch((err) => {
                console.error('Board load error:', err)
                setError(err.response?.data?.message || 'Ошибка загрузки')
            })
            .finally(() => setLoading(false))
    }, [id])

    // Обновляем проекты при изменениях в трее / при перетаскивании
    useEffect(() => {
        const onRefresh = () => reloadProjects()
        window.addEventListener('projects:refresh', onRefresh)
        window.addEventListener('sidebar:refresh', onRefresh)
        return () => {
            window.removeEventListener('projects:refresh', onRefresh)
            window.removeEventListener('sidebar:refresh', onRefresh)
        }
    }, [reloadProjects])

    const handleDeleteBoard = async (boardId) => {
        try {
            await boardsApi.delete(boardId)
            window.dispatchEvent(new Event('sidebar:refresh'))
            nav('/boards')
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    const handleDeleteProject = async (projectId) => {
        try {
            await projectsApi.delete(projectId)
            setProjects(prev => prev.filter(p => p.id !== projectId))
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    if (loading) return <div className="loading">Loading...</div>
    if (error) return <div className="error">{error}</div>
    if (!board) return <div>Board not found</div>

    return (
        <div className="board-detail">
            <BoardToolbar
                board={board}
                onUpdate={setBoard}
                onDelete={handleDeleteBoard}
            />

            <div className="board-detail__scroll">
                <div className="projects-section">
                    <div className="projects-section__head">
                        <h3 className="projects-section__title">{t.projectsSection}</h3>
                        <span className="projects-section__count">
                            {t.projectsCount(projects.length)}
                        </span>
                    </div>

                    <ProjectsGrid
                        projects={projects}
                        boardId={board.id}
                        onProjectCreated={(newProject) => setProjects(prev => [...prev, newProject])}
                        onProjectUpdated={(updated) => setProjects(prev =>
                            prev.map(p => p.id === updated.id ? updated : p)
                        )}
                        onProjectDeleted={handleDeleteProject}
                    />
                </div>
            </div>
        </div>
    )
}