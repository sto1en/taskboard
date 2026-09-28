import { useState, useEffect, useRef } from 'react'
import { tasksApi, tagsApi, attachmentsApi } from '../../api/api'
import Modal from '../Modal/Modal'
import AttachmentPreview from './AttachmentPreview'

const TAG_ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']
const TAG_ICONS = [
    '', '📌', '⭐', '🔥', '✅', '❗', '💡', '🎯', '📎', '📁',
    '🏷️', '🎨', '🚀', '🐛', '📝', '💼', '🎓', '❤️', '⚡', '🔔',
]

function resolveUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url
    }
    return `/uploads/${url}`
}

export default function TaskDetailModal({ open, onClose, taskId, onUpdated, boardId, columns }) {
    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 0,
        deadlineDate: '',
        deadlineTime: '',
        hasTime: false,
        statusId: '',
    })
    const [tags, setTags] = useState([])
    const [uploading, setUploading] = useState(false)
    const [creatingTag, setCreatingTag] = useState(false)
    const [newTagTitle, setNewTagTitle] = useState('')
    const [newTagAccent, setNewTagAccent] = useState('blue')
    const [newTagIcon, setNewTagIcon] = useState('')
    const [editingTag, setEditingTag] = useState(null)
    const [dirty, setDirty] = useState(false)
    const [previewAttachment, setPreviewAttachment] = useState(null)
    const fileInputRef = useRef(null)

    const load = () => {
        if (!taskId) return
        setLoading(true)
        setError(null)

        Promise.all([
            tasksApi.get(taskId),
            tagsApi.listByBoard(boardId).catch(() => ({ data: [] })),
        ])
            .then(([taskRes, tagsRes]) => {
                const t = taskRes.data
                const { date, time, hasTime } = splitDeadline(t.deadline)
                setTask(t)
                setForm({
                    title: t.title || '',
                    description: t.description || '',
                    priority: t.priority || 0,
                    deadlineDate: date,
                    deadlineTime: time,
                    hasTime,
                    statusId: t.statusId || '',
                })
                setTags(tagsRes.data)
                setDirty(false)
            })
            .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (open && taskId) {
            load()
        }
        // eslint-disable-next-line
    }, [open, taskId, boardId])

    const setField = (key, value) => {
        setForm(f => ({ ...f, [key]: value }))
        setDirty(true)
    }

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            const deadline = buildDeadline(form.deadlineDate, form.deadlineTime, form.hasTime)
            const tagIds = (task.tags || []).map(t => t.id)

            await tasksApi.update(taskId, {
                title: form.title,
                description: form.description,
                priority: form.priority,
                deadline,
                statusId: form.statusId || null,
                tagIds,
            })

            const refreshed = await tasksApi.get(taskId)
            setTask(refreshed.data)

            const { date, time, hasTime } = splitDeadline(refreshed.data.deadline)
            setForm({
                title: refreshed.data.title || '',
                description: refreshed.data.description || '',
                priority: refreshed.data.priority || 0,
                deadlineDate: date,
                deadlineTime: time,
                hasTime,
                statusId: refreshed.data.statusId || '',
            })
            setDirty(false)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const uploadAttachment = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data: attachment } = await attachmentsApi.upload(file)
            await tasksApi.attach(taskId, attachment.id)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const detachAttachment = async (attachmentId) => {
        try {
            await tasksApi.detach(taskId, attachmentId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    const toggleTag = (tagId) => {
        const currentTagIds = (task.tags || []).map(t => t.id)
        const newTagIds = currentTagIds.includes(tagId)
            ? currentTagIds.filter(id => id !== tagId)
            : [...currentTagIds, tagId]

        const newTags = tags.filter(t => newTagIds.includes(t.id))
        setTask(prev => ({ ...prev, tags: newTags }))
        setDirty(true)
    }

    const createTag = async () => {
        if (!newTagTitle.trim()) return
        try {
            const { data } = await tagsApi.create(boardId, {
                title: newTagTitle.trim(),
                accentCode: newTagAccent,
                icon: newTagIcon || null,
            })
            setTags(prev => [...prev, data])
            setTask(prev => ({
                ...prev,
                tags: [...(prev.tags || []), data],
            }))
            setNewTagTitle('')
            setNewTagAccent('blue')
            setNewTagIcon('')
            setCreatingTag(false)
            setDirty(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка создания тега')
        }
    }

    const saveTagEdit = async () => {
        if (!editingTag || !editingTag.title.trim()) return
        try {
            const { data } = await tagsApi.update(editingTag.id, {
                title: editingTag.title.trim(),
                accentCode: editingTag.accentCode,
                icon: editingTag.icon || null,
            })
            setTags(prev => prev.map(t => t.id === data.id ? data : t))
            setTask(prev => ({
                ...prev,
                tags: (prev.tags || []).map(t => t.id === data.id ? data : t),
            }))
            setEditingTag(null)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения тега')
        }
    }

    const handleAttachmentClick = (a) => {
        const isImage = a.mimeCode?.startsWith('image/')
        if (isImage) {
            setPreviewAttachment(a)
        } else {
            const url = resolveUrl(a.url)
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    }

    if (!open) return null

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={loading ? 'Загрузка...' : 'Задача'}
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Закрыть
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={save}
                            disabled={saving || !dirty}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </>
                }
            >
                {loading && <div className="loading">Загрузка...</div>}
                {error && <div className="modal__error">{error}</div>}

                {task && (
                    <div className="task-detail">
                        <div className="task-detail__group">
                            <div className="modal__field">
                                <label className="modal__label">Название</label>
                                <input
                                    className="input"
                                    value={form.title}
                                    onChange={(e) => setField('title', e.target.value)}
                                />
                            </div>

                            <div className="modal__field">
                                <label className="modal__label">Описание</label>
                                <textarea
                                    className="input"
                                    value={form.description}
                                    onChange={(e) => setField('description', e.target.value)}
                                    placeholder="Добавьте описание..."
                                    rows={5}
                                />
                            </div>
                        </div>

                        <div className="task-detail__group">
                            <div className="modal__row">
                                <div className="modal__field">
                                    <label className="modal__label">Статус</label>
                                    <select
                                        className="input"
                                        value={form.statusId}
                                        onChange={(e) => setField('statusId', Number(e.target.value))}
                                    >
                                        {(columns || []).map(c => (
                                            <option key={c.statusId} value={c.statusId}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal__field">
                                    <label className="modal__label">Приоритет</label>
                                    <select
                                        className="input"
                                        value={form.priority}
                                        onChange={(e) => setField('priority', Number(e.target.value))}
                                    >
                                        <option value={0}>Обычный</option>
                                        <option value={1}>Высокий</option>
                                        <option value={2}>Срочный</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal__field">
                                <label className="modal__label">Дата дедлайна</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={form.deadlineDate}
                                    onChange={(e) => setField('deadlineDate', e.target.value)}
                                />
                            </div>

                            <label className="task-detail__toggle">
                                <input
                                    type="checkbox"
                                    checked={form.hasTime}
                                    onChange={(e) => setField('hasTime', e.target.checked)}
                                />
                                <span>Указать время дедлайна</span>
                            </label>

                            {form.hasTime && (
                                <div className="modal__field">
                                    <label className="modal__label">Время дедлайна</label>
                                    <input
                                        className="input"
                                        type="time"
                                        value={form.deadlineTime}
                                        onChange={(e) => setField('deadlineTime', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="task-detail__group">
                            <div className="task-detail__label-row">
                                <div className="task-detail__label">Теги</div>
                                <button
                                    type="button"
                                    className="task-detail__small-btn"
                                    onClick={() => setCreatingTag(v => !v)}
                                >
                                    {creatingTag ? '× Отмена' : '+ Создать тег'}
                                </button>
                            </div>

                            {creatingTag && (
                                <div className="task-detail__create-tag">
                                    <input
                                        className="input"
                                        placeholder="Название тега"
                                        value={newTagTitle}
                                        onChange={(e) => setNewTagTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && createTag()}
                                        autoFocus
                                    />
                                    <select
                                        className="input tag-row__icon-select"
                                        value={newTagIcon}
                                        onChange={(e) => setNewTagIcon(e.target.value)}
                                    >
                                        {TAG_ICONS.map(ic => (
                                            <option key={ic} value={ic}>
                                                {ic ? `${ic}` : '— без иконки —'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="color-picker tag-row__colors">
                                        {TAG_ACCENTS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                data-accent={c}
                                                className={`color-picker__item color-picker__item--sm ${newTagAccent === c ? 'color-picker__item--active' : ''}`}
                                                onClick={() => setNewTagAccent(c)}
                                            />
                                        ))}
                                    </div>
                                    <button type="button" className="btn btn-primary" onClick={createTag}>
                                        ОК
                                    </button>
                                </div>
                            )}

                            <div className="task-detail__tags">
                                {tags.length === 0 && !creatingTag && (
                                    <div className="task-detail__empty">Нет тегов у доски</div>
                                )}
                                {tags.map(tag => {
                                    const active = (task.tags || []).some(t => t.id === tag.id)
                                    return (
                                        <div key={tag.id} className="task-detail__tag-wrap">
                                            <button
                                                type="button"
                                                className={`task-detail__tag ${active ? 'active' : ''}`}
                                                style={active ? {
                                                    background: `var(--accent-${tag.accentCode || 'gray'})`,
                                                    borderColor: `var(--accent-${tag.accentCode || 'gray'})`,
                                                    color: '#fff',
                                                } : {}}
                                                onClick={() => toggleTag(tag.id)}
                                            >
                                                {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                                                {tag.title}
                                            </button>
                                            <button
                                                type="button"
                                                className="task-detail__tag-edit"
                                                onClick={() => setEditingTag({
                                                    id: tag.id,
                                                    title: tag.title,
                                                    accentCode: tag.accentCode || 'gray',
                                                    icon: tag.icon || '',
                                                })}
                                                title="Изменить тег"
                                            >✎</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="task-detail__group">
                            <div className="task-detail__label">
                                Вложения {task.attachments?.length ? `(${task.attachments.length})` : ''}
                            </div>
                            <div className="task-detail__attachments">
                                {(task.attachments || []).map(a => {
                                    const url = resolveUrl(a.url)
                                    const isImage = a.mimeCode?.startsWith('image/')
                                    return (
                                        <div key={a.id} className="task-detail__attachment">
                                            {isImage && url ? (
                                                <img
                                                    src={url}
                                                    alt={a.originalName || ''}
                                                    onClick={() => handleAttachmentClick(a)}
                                                    style={{ cursor: 'zoom-in' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none'
                                                        e.target.parentNode.classList.add('task-detail__attachment--broken')
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="task-detail__file"
                                                    onClick={() => handleAttachmentClick(a)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    📎 {a.originalName}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="task-detail__attachment-remove"
                                                onClick={() => detachAttachment(a.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )
                                })}

                                <button
                                    type="button"
                                    className="task-detail__attachment-add"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? '...' : '+ Добавить'}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={uploadAttachment}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {editingTag && (
                <div className="modal-overlay" onClick={() => setEditingTag(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal__head">
                            <h3 className="modal__title">Изменить тег</h3>
                            <button className="modal__close" onClick={() => setEditingTag(null)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div className="modal__field">
                                <label className="modal__label">Название</label>
                                <input
                                    className="input"
                                    value={editingTag.title}
                                    onChange={(e) => setEditingTag(f => ({ ...f, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">Иконка</label>
                                <select
                                    className="input"
                                    value={editingTag.icon}
                                    onChange={(e) => setEditingTag(f => ({ ...f, icon: e.target.value }))}
                                >
                                    {TAG_ICONS.map(ic => (
                                        <option key={ic} value={ic}>
                                            {ic ? `${ic}` : '— без иконки —'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">Цвет</label>
                                <div className="color-picker">
                                    {TAG_ACCENTS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            data-accent={c}
                                            className={`color-picker__item ${editingTag.accentCode === c ? 'color-picker__item--active' : ''}`}
                                            onClick={() => setEditingTag(f => ({ ...f, accentCode: c }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal__foot">
                            <button className="btn btn-ghost" onClick={() => setEditingTag(null)}>Отмена</button>
                            <button className="btn btn-primary" onClick={saveTagEdit}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}

            <AttachmentPreview
                attachment={previewAttachment}
                onClose={() => setPreviewAttachment(null)}
            />
        </>
    )
}

function splitDeadline(value) {
    if (!value) return { date: '', time: '', hasTime: false }

    if (value.includes('T')) {
        const [date, time] = value.split('T')
        const timeShort = time.slice(0, 5)
        const hasTime = timeShort !== '00:00'
        return { date, time: timeShort, hasTime }
    }

    return { date: value, time: '', hasTime: false }
}

function buildDeadline(date, time, hasTime) {
    if (!date) return null
    if (hasTime && time) return `${date}T${time}:00`
    return `${date}T00:00:00`
}