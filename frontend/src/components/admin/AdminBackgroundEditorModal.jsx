import { useEffect, useRef, useState } from 'react'
import Modal from '../modal/Modal'
import { adminApi } from '../../api/api'
import { resolveUrl } from '../../utils/format'

export default function AdminBackgroundEditorModal({ open, onClose, background, onSaved }) {
    const isEdit = !!background

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [code, setCode] = useState('')
    const [cssClass, setCssClass] = useState('')
    const [price, setPrice] = useState(0)
    const [oldPrice, setOldPrice] = useState('')
    const [sortOrder, setSortOrder] = useState(0)
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [clearImage, setClearImage] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!open) return
        if (background) {
            setTitle(background.title || '')
            setDescription(background.description || '')
            setCode(background.code || '')
            setCssClass(background.cssClass || '')
            setPrice(background.price || 0)
            setOldPrice(background.oldPrice != null ? String(background.oldPrice) : '')
            setSortOrder(background.sortOrder || 0)
            setPreview(background.imageUrl ? resolveUrl(background.imageUrl) : null)
        } else {
            setTitle('')
            setDescription('')
            setCode('')
            setCssClass('')
            setPrice(0)
            setOldPrice('')
            setSortOrder(0)
            setPreview(null)
        }
        setFile(null)
        setClearImage(false)
        setError(null)
    }, [open, background])

    const pickFile = (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
        setClearImage(false)
    }

    const clear = () => {
        setFile(null)
        setPreview(null)
        setClearImage(true)
    }

    const submit = async () => {
        if (!title.trim()) {
            setError('Укажи название')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const fd = new FormData()
            fd.append('title', title.trim())
            fd.append('description', description.trim())
            if (!isEdit && code.trim()) fd.append('code', code.trim())
            fd.append('cssClass', cssClass.trim())
            fd.append('price', String(Number(price) || 0))
            if (oldPrice !== '') fd.append('oldPrice', String(Number(oldPrice) || 0))
            fd.append('sortOrder', String(Number(sortOrder) || 0))
            if (file) fd.append('file', file)
            if (clearImage) fd.append('clearImage', 'true')

            if (isEdit) {
                await adminApi.updateBackground(background.id, fd)
            } else {
                await adminApi.createBackground(fd)
            }
            onSaved && onSaved()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const remove = async () => {
        if (!background) return
        if (!confirm(`Удалить фон «${background.title}»?`)) return
        setSaving(true)
        try {
            await adminApi.deleteBackground(background.id)
            onSaved && onSaved()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка удаления')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? `Редактировать: ${background.title}` : 'Новый фон профиля'}
            footer={
                <>
                    {isEdit && (
                        <button className="btn btn-icon btn-icon--danger" onClick={remove} disabled={saving}>🗑</button>
                    )}
                    <div className="modal__foot-spacer" />
                    <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Отмена</button>
                    <button className="btn btn-primary" onClick={submit} disabled={saving || !title.trim()}>
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </>
            }
        >
            <div className="admin-avatar-editor">
                <div className="admin-avatar-editor__preview">
                    {preview ? (
                        <img src={preview} alt="" style={{ width: '100%', borderRadius: 12 }}/>
                    ) : (
                        <div
                            className={`admin-bg-thumb shop-bg-preview shop-bg-preview--${cssClass || code || 'aurora'}`}
                            style={{ width: 220, height: 140 }}
                        />
                    )}

                    <div className="admin-avatar-editor__preview-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? 'Заменить картинку' : 'Загрузить картинку'}
                        </button>
                        {preview && (
                            <button type="button" className="btn btn-ghost" onClick={clear}>
                                Убрать
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={pickFile}
                    />
                </div>

                <div className="admin-avatar-editor__fields">
                    <div className="modal__field">
                        <label className="modal__label">Название</label>
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            autoFocus
                        />
                    </div>

                    {!isEdit && (
                        <div className="modal__field">
                            <label className="modal__label">
                                Code
                                <span className="modal__label-hint">латиницей, можно оставить пустым</span>
                            </label>
                            <input
                                className="input"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={64}
                                placeholder="например, forest-night"
                            />
                        </div>
                    )}

                    <div className="modal__field">
                        <label className="modal__label">
                            CSS-класс градиента
                            <span className="modal__label-hint">если нет картинки</span>
                        </label>
                        <input
                            className="input"
                            value={cssClass}
                            onChange={(e) => setCssClass(e.target.value)}
                            maxLength={64}
                            placeholder="aurora / ocean / rose / ..."
                        />
                    </div>

                    <div className="modal__row modal__row--price">
                        <div className="modal__field">
                            <label className="modal__label">Обычная цена</label>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                value={oldPrice}
                                onChange={(e) => setOldPrice(e.target.value)}
                                placeholder="напр. 500"
                            />
                        </div>
                        <div className="modal__field">
                            <label className="modal__label">Цена</label>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0 — бесплатный"
                            />
                        </div>
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Порядок сортировки</label>
                        <input
                            className="input"
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        />
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Описание</label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                    </div>

                    {error && <div className="modal__error">{error}</div>}
                </div>
            </div>
        </Modal>
    )
}
