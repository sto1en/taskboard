import { useState, useEffect, useRef } from 'react'
import { boardsApi, attachmentsApi } from '../../api/api'
import Modal from '../Modal/Modal'
import { resolveUrl } from '../../utils/format'

const ACCENTS = [
    { code: 'blue',   label: 'Синий' },
    { code: 'purple', label: 'Фиолетовый' },
    { code: 'green',  label: 'Зелёный' },
    { code: 'orange', label: 'Оранжевый' },
    { code: 'red',    label: 'Красный' },
    { code: 'pink',   label: 'Розовый' },
    { code: 'gray',   label: 'Серый' },
]

export default function CreateBoardModal({ open, onClose, onCreated }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [accent, setAccent] = useState('blue')
    const [coverId, setCoverId] = useState(null)
    const [coverPreview, setCoverPreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (open) {
            setTitle('')
            setDescription('')
            setAccent('blue')
            setCoverId(null)
            setCoverPreview(null)
            setError(null)
        }
    }, [open])

    const uploadCover = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data } = await attachmentsApi.upload(file)
            setCoverId(data.id)
            setCoverPreview(resolveUrl(data.url))
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки обложки')
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
            const { data } = await boardsApi.create({
                title: title.trim(),
                description: description.trim(),
                accentCode: accent,
            })
            if (coverId) {
                const { data: updated } = await boardsApi.update(data.id, { coverAttachmentId: coverId })
                onCreated(updated)
            } else {
                onCreated(data)
            }
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка создания доски')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Новая доска"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Отмена
                    </button>
                    <button
                        type="submit"
                        form="create-board-form"
                        className="btn btn-primary"
                        disabled={loading || uploading || !title.trim()}
                    >
                        {loading ? 'Создание...' : 'Создать'}
                    </button>
                </>
            }
        >
            <form id="create-board-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
                <div className="modal__field">
                    <label className="modal__label">Название</label>
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Например, «Фотография»"
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
                        placeholder="Необязательно"
                        maxLength={2000}
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">Обложка (необязательно)</label>
                    {coverPreview ? (
                        <div className="cover-upload__preview">
                            <img
                                src={coverPreview}
                                alt=""
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
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
                        {ACCENTS.map(a => (
                            <button
                                key={a.code}
                                type="button"
                                title={a.label}
                                data-accent={a.code}
                                className={`color-picker__item ${accent === a.code ? 'color-picker__item--active' : ''}`}
                                onClick={() => setAccent(a.code)}
                            />
                        ))}
                    </div>
                </div>

                {error && <div className="modal__error">{error}</div>}
            </form>
        </Modal>
    )
}