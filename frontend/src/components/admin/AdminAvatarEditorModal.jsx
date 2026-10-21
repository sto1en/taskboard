import { useState, useEffect, useRef } from 'react'
import Modal from '../modal/Modal'
import AvatarArt from '../layout/AvatarArt'
import { adminApi } from '../../api/api'
import { resolveUrl } from '../../utils/format'
import CategoryMultiSelect from './CategoryMultiSelect'

export default function AdminAvatarEditorModal({
                                                   open, onClose, avatar, categories, onSaved,
                                               }) {
    const isEdit = !!avatar

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [emoji, setEmoji] = useState('')
    const [price, setPrice] = useState(0)
    const [oldPrice, setOldPrice] = useState('')
    const [sortOrder, setSortOrder] = useState(0)
    const [categoryIds, setCategoryIds] = useState([])
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [clearImage, setClearImage] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!open) return
        if (avatar) {
            setTitle(avatar.title || '')
            setDescription(avatar.description || '')
            setEmoji(avatar.emoji || '')
            setPrice(avatar.price || 0)
            setOldPrice(avatar.oldPrice != null ? String(avatar.oldPrice) : '')
            setSortOrder(avatar.sortOrder || 0)
            setCategoryIds((avatar.categories || []).map(c => c.id))
            setPreview(avatar.imageUrl ? resolveUrl(avatar.imageUrl) : null)
        } else {
            setTitle('')
            setDescription('')
            setEmoji('')
            setPrice(0)
            setOldPrice('')
            setSortOrder(0)
            setCategoryIds([])
            setPreview(null)
        }
        setFile(null)
        setClearImage(false)
        setError(null)
    }, [open, avatar])

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
            fd.append('emoji', emoji.trim())
            fd.append('price', String(Number(price) || 0))
            if (oldPrice !== '') fd.append('oldPrice', String(Number(oldPrice) || 0))
            fd.append('sortOrder', String(Number(sortOrder) || 0))
            categoryIds.forEach(id => fd.append('categoryIds', String(id)))
            if (file) fd.append('file', file)
            if (clearImage) fd.append('clearImage', 'true')

            if (isEdit) {
                await adminApi.updateAvatar(avatar.id, fd)
            } else {
                await adminApi.createAvatar(fd)
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
        if (!avatar) return
        if (!confirm(`Удалить аватарку «${avatar.title}»?`)) return
        setSaving(true)
        try {
            await adminApi.deleteAvatar(avatar.id)
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
            title={isEdit ? `Редактировать: ${avatar.title}` : 'Новая аватарка'}
            footer={
                <>
                    {isEdit && (
                        <button className="btn btn-icon btn-icon--danger" onClick={remove} disabled={saving}>
                            🗑
                        </button>
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
                        <img src={preview} alt="" onError={() => setPreview(null)} />
                    ) : avatar ? (
                        <div className="admin-avatar-editor__preview-art">
                            <AvatarArt
                                avatar={clearImage ? { ...avatar, imageUrl: null } : avatar}
                            />
                        </div>
                    ) : (
                        <div className="admin-avatar-editor__preview-empty">нет фото</div>
                    )}
                    <div className="admin-avatar-editor__preview-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? 'Заменить' : 'Загрузить фото'}
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

                    <div className="modal__row modal__row--price">
                        <div className="modal__field">
                            <label className="modal__label">
                                Обычная цена
                                <span className="modal__label-hint">зачёркнутая, если есть скидка</span>
                            </label>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                value={oldPrice}
                                onChange={(e) => setOldPrice(e.target.value)}
                                placeholder="напр. 200"
                            />
                        </div>
                        <div className="modal__field">
                            <label className="modal__label">
                                Цена со скидкой
                                <span className="modal__label-hint">актуальная</span>
                            </label>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="напр. 100"
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
                        <label className="modal__label">Типы (можно выбрать несколько)</label>
                        <CategoryMultiSelect
                            categories={categories}
                            selectedIds={categoryIds}
                            onChange={setCategoryIds}
                        />
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Эмодзи (если это эмодзи-аватарка)</label>
                        <input
                            className="input"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                            maxLength={8}
                            placeholder="напр. 🐱"
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