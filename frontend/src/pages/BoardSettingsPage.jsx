import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardsApi, statusesApi, tagsApi } from '../api/api'
import StatusEditor from '../components/Board/StatusEditor'
import TagEditor from '../components/Board/TagEditor'
import BoardMembersEditor from '../components/Board/BoardMembersEditor'
import useT from '../hooks/useT'

export default function BoardSettingsPage() {
    const { boardId } = useParams()
    const nav = useNavigate()
    const t = useT()
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
            .catch(err => setError(err.response?.data?.message || 'Error'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (boardId) load()
        // eslint-disable-next-line
    }, [boardId])

    if (loading) return <div className="loading">Loading...</div>
    if (error) return <div className="error">{error}</div>
    if (!board) return <div>Board not found</div>

    return (
        <div className="board-settings">
            <div className="board-detail__head">
                <button className="btn btn-ghost" onClick={() => nav(`/boards/${boardId}`)}>←</button>
                <h2 className="board-detail__title">{t.boardSettingsTitle(board.title)}</h2>
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">Участники</h3>
                <BoardMembersEditor
                    boardId={Number(boardId)}
                    ownerRole={board.ownerRole}
                />
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">{t.taskStatuses}</h3>
                <StatusEditor
                    boardId={Number(boardId)}
                    scope="task"
                    statuses={taskStatuses}
                    onReload={load}
                />
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">{t.projectStatuses}</h3>
                <StatusEditor
                    boardId={Number(boardId)}
                    scope="project"
                    statuses={projectStatuses}
                    onReload={load}
                />
            </div>

            <div className="board-settings__section">
                <h3 className="board-settings__title">{t.tagsTitle}</h3>
                <TagEditor
                    boardId={Number(boardId)}
                    tags={tags}
                    onReload={load}
                />
            </div>
        </div>
    )
}