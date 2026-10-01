import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardsApi, projectsApi } from '../api/api'
import BoardToolbar from '../components/Board/BoardToolbar'
import ProjectsGrid from '../components/Project/ProjectsGrid'

export default function BoardDetailPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const [board, setBoard] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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

    const handleDeleteBoard = async (boardId) => {
        try {
            await boardsApi.delete(boardId)
            nav('/boards')
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    const handleDeleteProject = async (projectId) => {
        try {
            await projectsApi.delete(projectId)
            setProjects(prev => prev.filter(p => p.id !== projectId))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    if (loading) return <div className="loading">Загрузка...</div>
    if (error) return <div className="error">{error}</div>
    if (!board) return <div>Доска не найдена</div>

    const accentStyle = {
        '--accent': `var(--accent-${board.accentCode || 'blue'})`,
    }

    return (
        <div className="board-detail" style={accentStyle}>
            <BoardToolbar
                board={board}
                onUpdate={setBoard}
                onDelete={handleDeleteBoard}
                onBack={() => nav('/boards')}
            />

            <div className="board-detail__scroll">
                <div className="projects-section">
                    <div className="projects-section__head">
                        <h3 className="projects-section__title">Проекты</h3>
                        <span className="projects-section__count">
                            {projects.length} {plural(projects.length, ['проект', 'проекта', 'проектов'])}
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

function plural(n, forms) {
    const mod10 = n % 10, mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}