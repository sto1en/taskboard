import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardsApi, boardMembersApi, statusesApi, tagsApi } from '../api/api'
import StatusEditor from '../components/board/StatusEditor'
import TagEditor from '../components/board/TagEditor'
import BoardMembersEditor from '../components/board/BoardMembersEditor'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import useT from '../hooks/useT'

export default function BoardSettingsPage() {
    const { boardId } = useParams()
    const nav = useNavigate()
    const t = useT()
    const { user } = useAuth()
    const [board, setBoard] = useState(null)
    const [taskStatuses, setTaskStatuses] = useState([])
    const [projectStatuses, setProjectStatuses] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showLeave, setShowLeave] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const [leaveError, setLeaveError] = useState(null)

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

    const canLeave = board.ownerRole !== 'owner'

    const leaveBoard = async () => {
        if (!user?.id || leaving) return
        setLeaving(true)
        setLeaveError(null)
        try {
            await boardMembersApi.remove(boardId, user.id)
            setShowLeave(false)
            nav('/boards', { replace: true })
        } catch (err) {
            setLeaveError(err.response?.data?.message || 'Не удалось покинуть доску')
            setShowLeave(false)
        } finally {
            setLeaving(false)
        }
    }

    return (
        <div className="board-settings">
            <div className="board-detail__head">
                <button className="btn btn-ghost" onClick={() => nav(`/boards/${boardId}`)}>←</button>
                <h2 className="board-detail__title">{t.boardSettingsTitle(board.title)}</h2>
            </div>

            {leaveError && <div className="profile-msg profile-msg--error">{leaveError}</div>}

            <div className="board-settings__section">
                <h3 className="board-settings__title">Участники</h3>
                <BoardMembersEditor
                    boardId={Number(boardId)}
                    ownerRole={board.ownerRole}
                />
                {canLeave && (
                    <div className="board-settings__leave">
                        <button
                            type="button"
                            className="btn btn-ghost board-settings__leave-btn"
                            onClick={() => setShowLeave(true)}
                        >
                            Покинуть доску
                        </button>
                        <span className="board-settings__leave-hint">
                            Вы потеряете доступ ко всем проектам и задачам этой доски.
                        </span>
                    </div>
                )}
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

            <ConfirmModal
                open={showLeave}
                title="Покинуть доску?"
                text={`Вы потеряете доступ к доске «${board.title}» и всем её проектам. Вернуться сможет только владелец, добавив вас снова.`}
                confirmLabel="Покинуть"
                cancelLabel="Отмена"
                danger
                loading={leaving}
                onConfirm={leaveBoard}
                onClose={() => !leaving && setShowLeave(false)}
            />
        </div>
    )
}