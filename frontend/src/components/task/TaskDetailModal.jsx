import { useState, useEffect, useRef } from 'react'
import { tasksApi, tagsApi, attachmentsApi } from '../../api/api'
import Modal from '../Modal/Modal'
import AttachmentPreview from './AttachmentPreview'
import {
    formatDeadline,
    splitDeadline,
    buildDeadline,
    resolveUrl,
} from '../../utils/format'

const TAG_ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']
const TAG_ICONS = [
    '', '📌', '⭐', '🔥', '✅', '❗', '💡', '🎯', '📎', '📁',
    '🏷️', '🎨', '🚀', '🐛', '📝', '💼', '🎓', '❤️', '⚡', '🔔',
]

export default function TaskDetailModal({ open, onClose, taskId, onOpenTask, onUpdated, boardId, columns }) {
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

    const [existingSubtasks, setExistingSubtasks] = useState([])
    const [pendingSubtasks, setPendingSubtasks] = useState([])
    const [subtaskInput, setSubtaskInput] = useState('')
    const [showSubtaskAutocomplete, setShowSubtaskAutocomplete] = useState(false)
    const [allProjectTasks, setAllProjectTasks] = useState([])
    const [subtaskError, setSubtaskError] = useState(null)

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
                setExistingSubtasks(t.subtasks || [])
                setPendingSubtasks([])

                if (t.projectId) {
                    tasksApi.listByProject(t.projectId)
                        .then(({ data }) => setAllProjectTasks(data))
                        .catch(() => setAllProjectTasks([]))
                }

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

    // Сброс transient-состояния при закрытии
    useEffect(() => {
        if (!open) {
            setPreviewAttachment(null)
            setEditingTag(null)
            setCreatingTag(false)
            setPendingSubtasks([])
            setSubtaskInput('')
            setShowSubtaskAutocomplete(false)
            setSubtaskError(null)
        }
    }, [open])

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

            for (const ps of pendingSubtasks) {
                try {
                    await tasksApi.create(task.projectId, {
                        title: ps.title,
                        parentId: taskId,
                    })
                } catch (err) {
                    console.error('Failed to create subtask:', ps.title, err)
                }
            }

            const refreshed = await tasksApi.get(taskId)
            setTask(refreshed.data)
            setExistingSubtasks(refreshed.data.subtasks || [])
            setPendingSubtasks([])

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
            onClose && onClose()
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

    const existingTaskIds = new Set([
        taskId,
        ...existingSubtasks.map(s => s.id),
    ])

    const autocompleteResults = subtaskInput.trim().length > 0
        ? allProjectTasks
            .filter(t => !existingTaskIds.has(t.id))
            .filter(t => t.title.toLowerCase().includes(subtaskInput.trim().toLowerCase()))
            .slice(0, 8)
        : []

    const attachExistingSubtask = async (existing) => {
        setSubtaskError(null)
        try {
            await tasksApi.setParent(existing.id, taskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setSubtaskInput('')
            setShowSubtaskAutocomplete(false)
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setSubtaskError(err.response?.data?.message || 'Не удалось прикрепить')
        }
    }

    const addPendingSubtask = () => {
        if (!subtaskInput.trim()) return
        setPendingSubtasks(prev => [...prev, { title: subtaskInput.trim() }])
        setSubtaskInput('')
        setShowSubtaskAutocomplete(false)
        setDirty(true)
    }

    const deleteExistingSubtask = async (subtaskId) => {
        if (!confirm('Удалить подзадачу?')) return
        try {
            await tasksApi.delete(subtaskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    const removePendingSubtask = (idx) => {
        setPendingSubtasks(prev => prev.filter((_, i) => i !== idx))
        setDirty(true)
    }

    const detachSubtask = async (subtaskId) => {
        if (!confirm('Сделать подзадачу самостоятельной?')) return
        try {
            await tasksApi.clearParent(subtaskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    const openSubtask = (subtaskId) => {
        if (!onOpenTask) return
        if (dirty) {
            if (!confirm('Есть несохранённые изменения. Открыть подзадачу без сохранения?')) return
        }
        onOpenTask(subtaskId)
    }

    const handleSubtaskKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addPendingSubtask()
        }
        if (e.key === 'Escape') {
            setShowSubtaskAutocomplete(false)
        }
    }

    if (!open) return null

    const isSubtask = !!task?.parentId

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
                            disabled={saving}
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
                                {!isSubtask && (
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
                                )}

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

                        {!isSubtask && (
                            <div className="task-detail__group">
                                <div className="task-detail__label-row">
                                    <div className="task-detail__label">
                                        Подзадачи {(existingSubtasks.length + pendingSubtasks.length) > 0
                                        ? `(${existingSubtasks.length + pendingSubtasks.length})`
                                        : ''}
                                    </div>
                                </div>

                                <div className="task-detail__subtask-input-wrap">
                                    <input
                                        className="input"
                                        placeholder="Найти или создать подзадачу..."
                                        value={subtaskInput}
                                        onChange={(e) => {
                                            setSubtaskInput(e.target.value)
                                            setShowSubtaskAutocomplete(true)
                                        }}
                                        onFocus={() => setShowSubtaskAutocomplete(true)}
                                        onKeyDown={handleSubtaskKeyDown}
                                    />

                                    {showSubtaskAutocomplete && subtaskInput.trim().length > 0 && (
                                        <div className="task-detail__subtask-autocomplete">
                                            {autocompleteResults.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    className="task-detail__subtask-ac-item"
                                                    onClick={() => attachExistingSubtask(t)}
                                                >
                                                    <span className="task-detail__subtask-ac-title">{t.title}</span>
                                                    {t.statusTitle && (
                                                        <span className="task-detail__subtask-ac-status">
                                                            {t.statusTitle}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                            {autocompleteResults.length === 0 && (
                                                <div className="task-detail__subtask-ac-empty">
                                                    Нет совпадений — нажми Enter, чтобы создать новую
                                                </div>
                                            )}
                                            {autocompleteResults.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="task-detail__subtask-ac-create"
                                                    onClick={addPendingSubtask}
                                                >
                                                    + Создать новую «{subtaskInput.trim()}»
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {subtaskError && (
                                    <div className="modal__error" style={{ marginTop: 8 }}>
                                        {subtaskError}
                                    </div>
                                )}

                                <div className="task-detail__subtasks">
                                    {existingSubtasks.length === 0 && pendingSubtasks.length === 0 && (
                                        <div className="task-detail__empty">Нет подзадач</div>
                                    )}

                                    {existingSubtasks.map(st => {
                                        const stDone = st.statusCategoryCode === 'DONE'
                                            || st.statusCode === 'DONE'
                                            || st.statusCategoryCode === 'CANCELLED'

                                        return (
                                            <div
                                                key={st.id}
                                                className="subtask-card"
                                                style={{ '--accent': task.statusAccentCode
                                                        ? `var(--accent-${task.statusAccentCode})`
                                                        : 'var(--primary)' }}
                                                onClick={() => openSubtask(st.id)}
                                            >
                                                <div className="subtask-card__head">
                                                    <span
                                                        className={`subtask-card__check ${stDone ? 'subtask-card__check--done' : ''}`}
                                                    />
                                                    <span className={`subtask-card__title ${stDone ? 'subtask-card__title--done' : ''}`}>
                                                        {st.title}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="subtask-card__btn"
                                                        onClick={(e) => { e.stopPropagation(); detachSubtask(st.id) }}
                                                        title="Сделать самостоятельной"
                                                    >
                                                        ↗
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="subtask-card__btn subtask-card__btn--danger"
                                                        onClick={(e) => { e.stopPropagation(); deleteExistingSubtask(st.id) }}
                                                        title="Удалить подзадачу"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>

                                                <div className="subtask-card__meta">
                                                    {st.priority > 0 && (
                                                        <span className="subtask-card__priority">
                                                            {st.priority === 2 ? '❗' : '⚡'}
                                                        </span>
                                                    )}
                                                    {st.deadline && (
                                                        <span className="subtask-card__deadline">
                                                            📅 {formatDeadline(st.deadline)}
                                                        </span>
                                                    )}
                                                    {st.subtaskTotal > 0 && (
                                                        <span className="subtask-card__subtask-count">
                                                            {st.subtaskDone}/{st.subtaskTotal}
                                                        </span>
                                                    )}
                                                    {st.attachmentNames && st.attachmentNames.length > 0 && (
                                                        <span className="subtask-card__attach">
                                                            📎 {st.attachmentNames[0]}
                                                            {st.attachmentNames.length > 1 && ` +${st.attachmentNames.length - 1}`}
                                                        </span>
                                                    )}
                                                </div>

                                                {st.tags && st.tags.length > 0 && (
                                                    <div className="subtask-card__tags">
                                                        {st.tags.map(tag => (
                                                            <span
                                                                key={tag.id}
                                                                className="task-tag"
                                                                style={{ background: `var(--accent-${tag.accentCode || 'gray'})` }}
                                                            >
                                                                {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                                                                {tag.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {pendingSubtasks.map((ps, idx) => (
                                        <div key={`pending-${idx}`} className="subtask-card subtask-card--pending">
                                            <div className="subtask-card__head">
                                                <span className="subtask-card__check" />
                                                <span className="subtask-card__title">{ps.title}</span>
                                                <span className="subtask-card__pending-badge">новая</span>
                                                <button
                                                    type="button"
                                                    className="subtask-card__btn subtask-card__btn--danger"
                                                    onClick={(e) => { e.stopPropagation(); removePendingSubtask(idx) }}
                                                    title="Убрать из списка"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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

                                <label className="task-detail__attachment-add">
                                    {uploading ? '...' : '+ Добавить'}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        style={{ display: 'none' }}
                                        onChange={uploadAttachment}
                                    />
                                </label>
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