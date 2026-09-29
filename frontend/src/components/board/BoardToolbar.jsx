import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditBoardModal from './EditBoardModal'

export default function BoardToolbar({ board, onUpdate, onDelete }) {
    const nav = useNavigate()
    const [showEdit, setShowEdit] = useState(false)

    const handleDelete = () => {
        if (!confirm(`Удалить доску "${board.title}"? Все проекты и задачи будут удалены.`)) return
        if (onDelete) onDelete(board.id)
    }

    return (
        <>
            <div className="board-toolbar">
                <span className="board-toolbar__title-text">{board.title}</span>

                <div className="board-toolbar__spacer" />

                <button
                    className="board-toolbar__btn board-toolbar__btn--edit"
                    onClick={() => setShowEdit(true)}
                    data-tooltip="Редактировать доску"
                >
                    ✎
                </button>

                <button
                    className="board-toolbar__btn board-toolbar__btn--settings"
                    onClick={() => nav(`/boards/${board.id}/settings`)}
                    data-tooltip="Настройки доски"
                >
                    ⚙
                </button>

                <button
                    className="board-toolbar__btn board-toolbar__btn--danger"
                    onClick={handleDelete}
                    data-tooltip="Удалить доску"
                >
                    🗑
                </button>
            </div>

            <EditBoardModal
                open={showEdit}
                onClose={() => setShowEdit(false)}
                board={board}
                onUpdated={(updated) => {
                    onUpdate && onUpdate(updated)
                    setShowEdit(false)
                }}
            />
        </>
    )
}