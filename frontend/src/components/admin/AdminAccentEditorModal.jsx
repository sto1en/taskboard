import { useState, useEffect, useRef } from 'react'
import Modal from '../Modal/Modal'
import { adminApi } from '../../api/api'
import { resolveUrl } from '../../utils/format'
import CategoryMultiSelect from './CategoryMultiSelect'

export default function AdminAccentEditorModal({
                                                   open, onClose, accent, categories, onSaved,
                                               }) {
    const isEdit = !!accent

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [hexColor, setHexColor] = useState('#4c9aff')
    const [hexColorSecondary, setHexColorSecondary] = useState('#a45cd6')
    const [isGradient, setIsGradient] = useState(false)
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
        if (accent) {
            setTitle(accent.title || '')
            setDescription(accent.description || '')
            setHexColor(accent.hexColor || '#4c9aff')
            setHexColorSecondary(accent.hexColorSecondary || '#a45cd6')
            setIsGradient(!!accent.isGradient)
            setPrice(accent.price || 0)
            setOldPrice(accent.oldPrice != null ? String(accent.oldPrice) : '')
            setSortOrder(accent.sortOrder || 0)
            setCategoryIds((accent.categories || []).map(c => c.id))
            setPreview(accent.imageUrl ? resolveUrl(accent.imageUrl) : null)
        } else {
            setTitle('')
            setDescription('')
            setHexColor('#4c9aff')
            setHexColorSecondary('#a45cd6')
            setIsGradient(false)
            setPrice(0)
            setOldPrice('')
            setSortOrder(0)
            setCategoryIds([])
            setPreview(null)
        }
        setFile(null)
        setClearImage(false)
        setError(null)
    }, [open, accent])

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
            fd.append('hexColor', hexColor)
            if (isGradient && hexColorSecondary) {
                fd.append('hexColorSecondary', hexColorSecondary)
            }
            fd.append('isGradient', isGradient ? 'true' : 'false')
            fd.append('price', String(Number(price) || 0))
            if (oldPrice !== '') fd.append('oldPrice', String(Number(oldPrice) || 0))
            fd.append('sortOrder', String(Number(sortOrder) || 0))
            categoryIds.forEach(id => fd.append('categoryIds', String(id)))
            if (file) fd.append('file', file)
            if (clearImage) fd.append('clearImage', 'true')

            if (isEdit) {
                await adminApi.updateAccent(accent.id, fd)
            } else {
                await adminApi.createAccent(fd)
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
        if (!accent) return
        if (!confirm(`Удалить акцент «${accent.title}»?`)) return
        setSaving(true)
        try {
            await adminApi.deleteAccent(accent.id)
            onSaved && onSaved()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка удаления')
        } finally {
            setSaving(false)
        }
    }

    const previewStyle = isGradient
        ? {
            backgroundImage: `linear-gradient(135deg, ${hexColor} 0%, ${hexColorSecondary} 100%)`,
            backgroundColor: 'transparent',
        }
        : { backgroundColor: hexColor, backgroundImage: 'none' }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? `Редактировать: ${accent.title}` : 'Новый акцент'}
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
                        <img src={preview} alt="" style={{ borderRadius: 12 }} />
                    ) : (
                        <div
                            style={{
                                width: 200,
                                height: 200,
                                borderRadius: '50%',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                                ...previewStyle,
                            }}
                        />
                    )}

                    <div className="admin-avatar-editor__preview-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? 'Заменить фото' : 'Загрузить фото (опц.)'}
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

                    <div className="modal__field">
                        <label className="modal__label">Основной цвет</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input
                                type="color"
                                value={hexColor}
                                onChange={(e) => setHexColor(e.target.value)}
                                style={{
                                    width: 60,
                                    height: 40,
                                    border: '1px solid var(--border)',
                                    borderRadius: 6,
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            />
                            <input
                                className="input"
                                value={hexColor}
                                onChange={(e) => setHexColor(e.target.value)}
                                maxLength={9}
                                style={{ maxWidth: 140 }}
                            />
                        </div>
                    </div>

                    <label className="task-detail__toggle">
                        <input
                            type="checkbox"
                            checked={isGradient}
                            onChange={(e) => setIsGradient(e.target.checked)}
                        />
                        <span>Это градиент (второй цвет)</span>
                    </label>

                    {isGradient && (
                        <div className="modal__field">
                            <label className="modal__label">Второй цвет (конец градиента)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                    type="color"
                                    value={hexColorSecondary}
                                    onChange={(e) => setHexColorSecondary(e.target.value)}
                                    style={{
                                        width: 60,
                                        height: 40,
                                        border: '1px solid var(--border)',
                                        borderRadius: 6,
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                />
                                <input
                                    className="input"
                                    value={hexColorSecondary}
                                    onChange={(e) => setHexColorSecondary(e.target.value)}
                                    maxLength={9}
                                    style={{ maxWidth: 140 }}
                                />
                            </div>
                        </div>
                    )}

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
                        <label className="modal__label">Типы</label>
                        <CategoryMultiSelect
                            categories={categories}
                            selectedIds={categoryIds}
                            onChange={setCategoryIds}
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