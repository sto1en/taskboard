import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { boardsApi, attachmentsApi } from '../../api/api'
import Modal from '../Modal/Modal'

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray']

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

function EditBoardModal({ open, onClose, board, onUpdated }) {
    const [title, setTitle] = useState(board.title || '')
    const [description, setDescription] = useState(board.description || '')
    const [accent, setAccent] = useState(board.accentCode || 'blue')
    const [coverId, setCoverId] = useState(board.coverAttachmentId || null)
    const [coverPreview, setCoverPreview] = useState(board.coverUrl || null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (open) {
            setTitle(board.title || '')
            setDescription(board.description || '')
            setAccent(board.accentCode || 'blue')
            setCoverId(board.coverAttachmentId || null)
            setCoverPreview(board.coverUrl || null)
            setError(null)
        }
        // eslint-disable-next-line
    }, [open, board])

    const uploadCover = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data } = await attachmentsApi.upload(file)
            setCoverId(data.id)
            setCoverPreview(data.url)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setUploading(false)
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) {
            setError('Введите название')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const { data } = await boardsApi.update(board.id, {
                title: title.trim(),
                description: description.trim(),
                accentCode: accent,
                coverAttachmentId: coverId,
            })
            onUpdated(data)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setLoading(false)
        }
    }

    if (!board) return null

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Редактировать доску"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Отмена
                    </button>
                    <button
                        type="submit"
                        form="edit-board-form"
                        className="btn btn-primary"
                        disabled={loading || uploading || !title.trim()}
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </>
            }
        >
            <form id="edit-board-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
                <div className="modal__field">
                    <label className="modal__label">Название</label>
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                        autoFocus
                        required
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">Описание</label>
                    <textarea
                        className="input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={2000}
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">Обложка (необязательно)</label>
                    {coverPreview ? (
                        <div className="cover-upload__preview">
                            <img src={coverPreview} alt="" />
                            <button
                                type="button"
                                className="cover-upload__remove"
                                onClick={() => { setCoverId(null); setCoverPreview(null) }}
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="cover-upload__btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Загрузка...' : '📷 Загрузить фото'}
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={uploadCover}
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">Цвет обложки (если нет фото)</label>
                    <div className="color-picker">
                        {ACCENTS.map(c => (
                            <button
                                key={c}
                                type="button"
                                data-accent={c}
                                className={`color-picker__item ${accent === c ? 'color-picker__item--active' : ''}`}
                                onClick={() => setAccent(c)}
                            />
                        ))}
                    </div>
                </div>

                {error && <div className="modal__error">{error}</div>}
            </form>
        </Modal>
    )
}