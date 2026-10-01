import { useState, useRef, useEffect } from 'react'
import { boardsApi, attachmentsApi } from '../../api/api'
import Modal from '../Modal/Modal'
import { resolveUrl } from '../../utils/format'

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray']

export default function EditBoardModal({ open, onClose, board, onUpdated }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [accent, setAccent] = useState('blue')
    const [coverId, setCoverId] = useState(null)
    const [coverPreview, setCoverPreview] = useState(null)
    const [clearCover, setClearCover] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (open && board) {
            setTitle(board.title || '')
            setDescription(board.description || '')
            setAccent(board.accentCode || 'blue')
            setCoverId(board.coverAttachmentId || null)
            setCoverPreview(resolveUrl(board.coverUrl))
            setClearCover(false)
            setError(null)
        }
    }, [open, board])

    const uploadCover = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data } = await attachmentsApi.upload(file)
            setCoverId(data.id)
            setCoverPreview(resolveUrl(data.url))
            setClearCover(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveCover = () => {
        setCoverId(null)
        setCoverPreview(null)
        setClearCover(true)
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
            const payload = {
                title: title.trim(),
                description: description.trim(),
                accentCode: accent,
            }

            if (clearCover) {
                payload.clearCover = true
                payload.coverAttachmentId = null
            } else if (coverId) {
                payload.coverAttachmentId = coverId
            }

            const { data } = await boardsApi.update(board.id, payload)
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
                        form="edit-board-modal-form"
                        className="btn btn-primary"
                        disabled={loading || uploading || !title.trim()}
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </>
            }
        >
            <form id="edit-board-modal-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
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
                                onClick={handleRemoveCover}
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