import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardsApi, statusesApi, tagsApi } from '../api/api'
import StatusEditor from '../components/Board/StatusEditor'
import TagEditor from '../components/Board/TagEditor'

export default function BoardSettingsPage() {
    const { boardId } = useParams()
    const nav = useNavigate()
    const [board, setBoard] = useState(null)
    const [taskStatuses, setTaskStatuses] = useState([])
    const [projectStatuses, setProjectStatuses] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = () => {
        setLoading(true)
        setError(null)
        Promise.all([
            boardsApi.get(boardId),
            statusesApi.list(boardId, 'task'),
            statusesApi.list(boardId, 'project'),
            tagsApi.listByBoard(boardId),
        ])
            .then(([boardRes, taskRes, projRes, tagsRes]) => {
                setBoard(boardRes.data)
                setTaskStatuses(taskRes.data)
                setProjectStatuses(projRes.data)
                setTags(tagsRes.data)
            })
            .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (boardId) load()
        // eslint-disable-next-line
    }, [boardId])

    if (loading) return <div className="loading">Загрузка...</div>
    if (error) return <div className="error">{error}</div>
    if (!board) return <div>Доска не найдена</div>

    return (
        <div className="board-settings">
            <div className="board-detail__head">
                <button className="btn btn-ghost" onClick={() => nav(`/boards/${boardId}`)}>←</button>
                <h2 className="board-detail__title">Настройки доски «{board.title}»</h2>
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">Статусы задач</h3>
                <StatusEditor
                    boardId={Number(boardId)}
                    scope="task"
                    statuses={taskStatuses}
                    onReload={load}
                />
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">Статусы проектов</h3>
                <StatusEditor
                    boardId={Number(boardId)}
                    scope="project"
                    statuses={projectStatuses}
                    onReload={load}
                />
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">Теги</h3>
                <TagEditor
                    boardId={Number(boardId)}
                    tags={tags}
                    onReload={load}
                />
            </div>
        </div>
    )
}