import { useState, useRef, useEffect } from 'react'
import { boardsApi, attachmentsApi } from '../../api/api'

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray']

export default function EditBoardSection({ board, onUpdated }) {
    const [title, setTitle] = useState(board.title || '')
    const [description, setDescription] = useState(board.description || '')
    const [accent, setAccent] = useState(board.accentCode || 'blue')
    const [coverId, setCoverId] = useState(board.coverAttachmentId || null)
    const [coverPreview, setCoverPreview] = useState(board.coverUrl || null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [msg, setMsg] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        setTitle(board.title || '')
        setDescription(board.description || '')
        setAccent(board.accentCode || 'blue')
        setCoverId(board.coverAttachmentId || null)
        setCoverPreview(board.coverUrl || null)
    }, [board])

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
        setMsg(null)
        try {
            const { data } = await boardsApi.update(board.id, {
                title: title.trim(),
                description: description.trim(),
                accentCode: accent,
                coverAttachmentId: coverId,
            })
            onUpdated(data)
            setMsg('Сохранено')
            setTimeout(() => setMsg(null), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="board-settings__section">
            <h3 className="board-settings__title">Редактировать доску</h3>

            {msg && <div className="profile-msg profile-msg--success">{msg}</div>}
            {error && <div className="profile-msg profile-msg--error">{error}</div>}

            <form onSubmit={onSubmit} className="edit-board-section">
                <div className="modal__field">
                    <label className="modal__label">Название</label>
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">Описание</label>
                    <textarea
                        className="input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={2000}
                        rows={3}
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">Обложка</label>
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
                    <label className="modal__label">Цвет обложки</label>
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

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || uploading || !title.trim()}
                >
                    {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
            </form>
        </div>
    )
}