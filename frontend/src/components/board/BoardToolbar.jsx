import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { boardsApi } from '../../api/api'
import InlineEdit from '../common/InlineEdit'
import ConfirmModal from '../common/ConfirmModal'
import EditBoardModal from './EditBoardModal'
import useT from '../../hooks/useT'

export default function BoardToolbar({ board, onUpdate, onDelete }) {
    const nav = useNavigate()
    const t = useT()
    const [showEdit, setShowEdit] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [localBoard, setLocalBoard] = useState(board)

    if (board !== localBoard && board?.id === localBoard?.id) {
        setLocalBoard(board)
    }

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = async () => {
        setDeleting(true)
        try {
            if (onDelete) await onDelete(localBoard.id)
            setShowDeleteConfirm(false)
        } finally {
            setDeleting(false)
        }
    }

    const saveTitle = async (newTitle) => {
        const { data } = await boardsApi.update(localBoard.id, { title: newTitle })
        setLocalBoard(data)
        onUpdate && onUpdate(data)
    }

    const saveDescription = async (newDesc) => {
        const { data } = await boardsApi.update(localBoard.id, { description: newDesc })
        setLocalBoard(data)
        onUpdate && onUpdate(data)
    }

    return (
        <>
            <div className="board-toolbar">
                <div className="board-toolbar__title-wrap">
                    <InlineEdit
                        value={localBoard.title}
                        className="board-toolbar__title board-toolbar__title-text"
                        inputClassName="input board-toolbar__title-input"
                        onSave={saveTitle}
                        title={t.editBoard}
                    />
                    <InlineEdit
                        value={localBoard.description || ''}
                        multiline
                        className="board-toolbar__subtitle"
                        inputClassName="input board-toolbar__subtitle-input"
                        placeholder={t.editBoard}
                        onSave={saveDescription}
                        title={t.editBoard}
                    />
                </div>

                <div className="board-toolbar__spacer" />

                <button
                    className="board-toolbar__btn board-toolbar__btn--edit"
                    onClick={() => setShowEdit(true)}
                    data-tooltip={t.editBoard}
                >
                    ✎
                </button>

                <button
                    className="board-toolbar__btn board-toolbar__btn--settings"
                    onClick={() => nav(`/boards/${localBoard.id}/settings`)}
                    data-tooltip={t.boardSettings}
                >
                    ⚙
                </button>

                <button
                    className="board-toolbar__btn board-toolbar__btn--danger"
                    onClick={handleDeleteClick}
                    data-tooltip={t.deleteBoard}
                >
                    🗑
                </button>
            </div>

            <EditBoardModal
                open={showEdit}
                onClose={() => setShowEdit(false)}
                board={localBoard}
                onUpdated={(updated) => {
                    setLocalBoard(updated)
                    onUpdate && onUpdate(updated)
                    setShowEdit(false)
                }}
            />

            <ConfirmModal
                open={showDeleteConfirm}
                title={t.confirmDeleteBoardTitle}
                text={t.confirmDeleteBoardText(localBoard.title)}
                confirmLabel={t.yesDelete}
                cancelLabel={t.cancel}
                danger
                loading={deleting}
                onConfirm={handleDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </>
    )
}