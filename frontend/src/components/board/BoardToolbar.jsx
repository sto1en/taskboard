import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { boardsApi, attachmentsApi } from '../../api/api'
import InlineEdit from '../common/InlineEdit'
import ConfirmModal from '../common/ConfirmModal'
import EditBoardModal from './EditBoardModal'
import AttachmentPreview from '../task/AttachmentPreview'
import useT from '../../hooks/useT'
import useConfirmDelete from '../../hooks/useConfirmDelete'
import { useAuth } from '../../context/AuthContext'
import { resolveUrl } from '../../utils/format'

export default function BoardToolbar({ board, onUpdate, onDelete }) {
    const nav = useNavigate()
    const t = useT()
    const { user, updateUser } = useAuth()
    const [showEdit, setShowEdit] = useState(false)
    const [localBoard, setLocalBoard] = useState(board)
    const [coverBroken, setCoverBroken] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    if (board !== localBoard && board?.id === localBoard?.id) {
        setLocalBoard(board)
    }

    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

    const handleDeleteClick = () => {
        requestDelete({
            kind: 'board',
            title: localBoard.title,
            onConfirm: async () => {
                if (onDelete) await onDelete(localBoard.id)
            },
        })
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

    const accent = localBoard.accentCode || 'blue'
    const coverUrl = resolveUrl(localBoard.coverUrl)
    const hasCover = !!coverUrl && !coverBroken
    const initial = (localBoard.title || '?').trim().charAt(0).toUpperCase()

    // === Загрузка обложки ===
    const handleUploadClick = (e) => {
        e.stopPropagation()
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setError(null)

        // Проверка, что это картинка
        if (!file.type || !file.type.startsWith('image/')) {
            const type = file.type || 'неизвестный тип'
            const name = file.name || 'файл'
            setError(`Файл «${name}» имеет тип «${type}». Можно загрузить только изображение (image/png, image/jpeg, image/gif, image/webp).`)
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setUploading(true)
        try {
            const { data: attachment } = await attachmentsApi.upload(file)
            const { data: updated } = await boardsApi.update(localBoard.id, {
                coverAttachmentId: attachment.id,
            })
            setLocalBoard(updated)
            setCoverBroken(false)
            onUpdate && onUpdate(updated)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось загрузить обложку')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const openPreview = (e) => {
        e.stopPropagation()
        if (!hasCover) return
        setPreviewOpen(true)
    }

    // Объект для превью — как у вложений задачи
    const previewAttachment = hasCover
        ? {
            url: coverUrl,
            originalName: localBoard.title || 'Обложка',
            mimeCode: 'image/*',
        }
        : null

    return (
        <>
            <div className="board-toolbar">
                <div
                    className={`board-toolbar__cover board-toolbar__cover--${accent} ${hasCover ? 'board-toolbar__cover--interactive' : ''}`}
                >
                    {hasCover ? (
                        <img
                            src={coverUrl}
                            alt={localBoard.title}
                            className="board-toolbar__cover-img"
                            onError={() => setCoverBroken(true)}
                        />
                    ) : (
                        <div className="board-toolbar__cover-letter">{initial}</div>
                    )}

                    {/* Кнопки появляются при наведении */}
                    <div className="board-toolbar__cover-actions">
                        {hasCover && (
                            <button
                                type="button"
                                className="board-toolbar__cover-btn"
                                onClick={openPreview}
                                title="Открыть обложку"
                            >
                                🔍
                            </button>
                        )}
                        <button
                            type="button"
                            className="board-toolbar__cover-btn"
                            onClick={handleUploadClick}
                            disabled={uploading}
                            title="Загрузить обложку"
                        >
                            {uploading ? '…' : '📷'}
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                <div className="board-toolbar__title-wrap">
                    <button
                        type="button"
                        className="board-toolbar__up"
                        onClick={() => nav('/boards')}
                        title="На уровень вверх — ко всем доскам"
                    >
                        ↑ Все доски
                    </button>
                    <div className="board-toolbar__eyebrow">Доска</div>
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
                        placeholder="Добавить описание..."
                        onSave={saveDescription}
                        title={t.editBoard}
                    />

                    {error && (
                        <div
                            className="board-toolbar__error"
                            onClick={() => setError(null)}
                            title="Нажмите, чтобы скрыть"
                        >
                            {error}
                        </div>
                    )}
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

            {previewOpen && previewAttachment && (
                <AttachmentPreview
                    attachment={previewAttachment}
                    onClose={() => setPreviewOpen(false)}
                />
            )}

            <ConfirmModal {...modalProps} />
        </>
    )
}