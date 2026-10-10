import { useState, useEffect, useRef } from 'react'
import { tasksApi, tagsApi, attachmentsApi, projectsApi, recurrenceApi } from '../../api/api'
import Modal from '../Modal/Modal'
import ConfirmModal from '../common/ConfirmModal'
import AttachmentPreview from './AttachmentPreview'
import DetailTextEditor from './DetailTextEditor'
import RecurrenceEditor from './RecurrenceEditor'
import TaskHistory from './TaskHistory'
import TaskChat from './TaskChat'
import {
    formatDeadline,
    splitDeadline,
    buildDeadline,
    resolveUrl,
} from '../../utils/format'
import useT from '../../hooks/useT'
import useConfirmDelete from '../../hooks/useConfirmDelete'
import { useAuth } from '../../context/AuthContext'

const TAG_ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']
const TAG_ICONS = [
    '', '📌', '⭐', '🔥', '✅', '❗', '💡', '🎯', '📎', '📁',
    '🏷️', '🎨', '🚀', '🐛', '📝', '💼', '🎓', '❤️', '⚡', '🔔',
]

export default function TaskDetailModal({
                                            open,
                                            onClose,
                                            taskId,
                                            onOpenTask,
                                            onUpdated,
                                            boardId: boardIdProp,
                                            columns: columnsProp,
                                        }) {
    const t = useT()
    const { user, updateUser } = useAuth()
    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

    const [detailTab, setDetailTab] = useState('details')

    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    const [boardId, setBoardId] = useState(boardIdProp || null)
    const [columns, setColumns] = useState(columnsProp || [])

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

    const [recurrence, setRecurrence] = useState(null)
    const [recurrenceDirty, setRecurrenceDirty] = useState(false)

    const load = async () => {
        if (!taskId) return
        setLoading(true)
        setError(null)

        try {
            const { data: taskData } = await tasksApi.get(taskId)

            const { date, time, hasTime } = splitDeadline(taskData.deadline)
            setTask(taskData)
            setForm({
                title: taskData.title || '',
                description: taskData.description || '',
                priority: taskData.priority || 0,
                deadlineDate: date,
                deadlineTime: time,
                hasTime,
                statusId: taskData.statusId || '',
            })

            setExistingSubtasks(taskData.subtasks || [])
            setPendingSubtasks([])
            setDirty(false)
            setRecurrence(taskData.recurrence || null)
            setRecurrenceDirty(false)

            let bid = boardIdProp
            let cols = columnsProp || []

            if (!bid && taskData.projectId) {
                try {
                    const { data: project } = await projectsApi.get(taskData.projectId)
                    bid = project.boardId
                    setBoardId(bid)
                } catch {}
            } else if (bid) {
                setBoardId(bid)
            }

            if ((!cols || cols.length === 0) && taskData.projectId) {
                try {
                    const { data: kanban } = await tasksApi.kanban(taskData.projectId)
                    cols = kanban.columns || []
                    setColumns(cols)
                } catch {}
            } else if (cols?.length) {
                setColumns(cols)
            }

            if (bid) {
                try {
                    const { data: tagsData } = await tagsApi.listByBoard(bid)
                    setTags(tagsData)
                } catch {
                    setTags([])
                }
            }

            if (taskData.projectId) {
                try {
                    const { data } = await tasksApi.listByProject(taskData.projectId)
                    setAllProjectTasks(data)
                } catch {
                    setAllProjectTasks([])
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && taskId) {
            load()
        }
        // eslint-disable-next-line
    }, [open, taskId])

    useEffect(() => {
        if (open) setDetailTab('details')
    }, [open, taskId])

    useEffect(() => {
        if (!open) {
            setPreviewAttachment(null)
            setEditingTag(null)
            setCreatingTag(false)
            setPendingSubtasks([])
            setSubtaskInput('')
            setShowSubtaskAutocomplete(false)
            setSubtaskError(null)
            setBoardId(boardIdProp || null)
            setColumns(columnsProp || [])
            setRecurrence(null)
            setRecurrenceDirty(false)
            setDetailTab('details')
        }
    }, [open, boardIdProp, columnsProp])

    const setField = (key, value) => {
        setForm(f => ({ ...f, [key]: value }))
        setDirty(true)
    }

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            const deadline = buildDeadline(form.deadlineDate, form.deadlineTime, form.hasTime)
            const tagIds = (task.tags || []).map(tg => tg.id)

            await tasksApi.update(taskId, {
                title: form.title,
                description: form.description,
                priority: form.priority,
                deadline,
                statusId: form.statusId || null,
                tagIds,
            })

            if (recurrenceDirty) {
                if (recurrence && recurrence.rule) {
                    await recurrenceApi.save(taskId, recurrence)
                } else if (!recurrence) {
                    try { await recurrenceApi.delete(taskId) } catch {}
                }
            }

            for (const ps of pendingSubtasks) {
                try {
                    await tasksApi.create(task.projectId, {
                        title: ps.title,
                        parentId: taskId,
                    })
                } catch (err) {
                    console.error('Subtask create error:', err)
                }
            }

            const { data: refreshed } = await tasksApi.get(taskId)
            setTask(refreshed)
            setExistingSubtasks(refreshed.subtasks || [])
            setPendingSubtasks([])
            setRecurrence(refreshed.recurrence || null)
            setRecurrenceDirty(false)

            const { date, time, hasTime } = splitDeadline(refreshed.deadline)
            setForm({
                title: refreshed.title || '',
                description: refreshed.description || '',
                priority: refreshed.priority || 0,
                deadlineDate: date,
                deadlineTime: time,
                hasTime,
                statusId: refreshed.statusId || '',
            })
            setDirty(false)
            onUpdated && onUpdated()
            onClose && onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteClick = () => {
        if (!task) return
        requestDelete({
            kind: 'task',
            title: task.title,
            onConfirm: async () => {
                try {
                    await tasksApi.delete(taskId)
                    window.dispatchEvent(new Event('tasks:refresh'))
                    onUpdated && onUpdated()
                    onClose && onClose()
                } catch (err) {
                    setError(err.response?.data?.message || 'Error')
                }
            },
        })
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
            setError(err.response?.data?.message || 'Error')
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
            setError(err.response?.data?.message || 'Error')
        }
    }

    const toggleTag = (tagId) => {
        const currentTagIds = (task.tags || []).map(tg => tg.id)
        const newTagIds = currentTagIds.includes(tagId)
            ? currentTagIds.filter(id => id !== tagId)
            : [...currentTagIds, tagId]
        const newTags = tags.filter(tg => newTagIds.includes(tg.id))
        setTask(prev => ({ ...prev, tags: newTags }))
        setDirty(true)
    }

    const createTag = async () => {
        if (!newTagTitle.trim() || !boardId) return
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
            setError(err.response?.data?.message || 'Error')
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
            setTags(prev => prev.map(tg => tg.id === data.id ? data : tg))
            setTask(prev => ({
                ...prev,
                tags: (prev.tags || []).map(tg => tg.id === data.id ? data : tg),
            }))
            setEditingTag(null)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
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
            setSubtaskError(err.response?.data?.message || 'Error')
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
        if (!confirm(t.deleteSubtask + '?')) return
        try {
            await tasksApi.delete(subtaskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const removePendingSubtask = (idx) => {
        setPendingSubtasks(prev => prev.filter((_, i) => i !== idx))
        setDirty(true)
    }

    const detachSubtask = async (subtaskId) => {
        if (!confirm(t.makeStandalone + '?')) return
        try {
            await tasksApi.clearParent(subtaskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const openSubtask = (subtaskId) => {
        if (!onOpenTask) return
        if (dirty) {
            if (!confirm(t.searchUnsavedChanges || 'Unsaved changes. Continue?')) return
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
    const isRecurrenceInstance = !!task?.isRecurrenceInstance

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={loading ? t.loading : t.taskLabel}
                footer={
                    <>
                        <button
                            type="button"
                            className="btn btn-icon btn-icon--danger"
                            onClick={handleDeleteClick}
                            title="Удалить задачу"
                        >
                            🗑
                        </button>
                        <div className="modal__foot-spacer" />
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            {t.close}
                        </button>
                        {detailTab === 'details' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={save}
                                disabled={saving}
                            >
                                {saving ? t.loading : t.save}
                            </button>
                        )}
                    </>
                }
            >
                {loading && <div className="loading">{t.loading}</div>}
                {error && <div className="modal__error">{error}</div>}

                {task && (
                    <>
                        <div className="task-detail-tabs">
                            <button
                                type="button"
                                className={`task-detail-tab ${detailTab === 'details' ? 'task-detail-tab--active' : ''}`}
                                onClick={() => setDetailTab('details')}
                            >Детали</button>
                            <button
                                type="button"
                                className={`task-detail-tab ${detailTab === 'history' ? 'task-detail-tab--active' : ''}`}
                                onClick={() => setDetailTab('history')}
                            >История</button>
                            <button
                                type="button"
                                className={`task-detail-tab ${detailTab === 'chat' ? 'task-detail-tab--active' : ''}`}
                                onClick={() => setDetailTab('chat')}
                            >Обсуждение</button>
                        </div>

                        {detailTab === 'history' ? (
                            <TaskHistory taskId={taskId} />
                        ) : detailTab === 'chat' ? (
                            <TaskChat taskId={taskId} />
                        ) : (
                            <div className="task-detail">

                                {(task.startedBy || task.lastEditedBy) && (
                                    <div className="task-detail__authors">
                                        {task.startedBy && (
                                            <div className="task-detail__author-row">
                                                <span className="task-detail__author-label">Начал:</span>
                                                <span className="task-detail__author-name">
                                                    {task.startedBy.displayName}
                                                </span>
                                            </div>
                                        )}
                                        {task.lastEditedBy && (
                                            <div className="task-detail__author-row">
                                                <span className="task-detail__author-label">Последний редактор:</span>
                                                <span className="task-detail__author-name">
                                                    {task.lastEditedBy.displayName}
                                                    {task.lastEditedAt && (
                                                        <span className="task-detail__author-date">
                                                            {' · '}{new Date(task.lastEditedAt).toLocaleString('ru-RU')}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isRecurrenceInstance && (
                                    <div className="recurrence-banner">
                                        <span className="recurrence-banner__icon">🔁</span>
                                        <div className="recurrence-banner__text">
                                            Это повторение от{' '}
                                            <b>
                                                {task.occurrenceDate
                                                    ? new Date(task.occurrenceDate).toLocaleDateString()
                                                    : '—'}
                                            </b>
                                            . Изменения применятся ко всем вхождениям.
                                        </div>
                                    </div>
                                )}

                                <div className="task-detail__group">
                                    <div className="modal__field">
                                        <label className="modal__label">{t.nameLabel}</label>
                                        <input
                                            className="input"
                                            value={form.title}
                                            onChange={(e) => setField('title', e.target.value)}
                                        />
                                    </div>

                                    <div className="modal__field">
                                        <label className="modal__label">{t.taskDescriptionLabel}</label>
                                        <DetailTextEditor
                                            value={form.description}
                                            onSave={(html) => setField('description', html)}
                                            placeholder={t.addDescription}
                                            title={t.edit}
                                        />
                                    </div>
                                </div>

                                <div className="task-detail__group">
                                    <div className="modal__row">
                                        {!isSubtask && columns.length > 0 && (
                                            <div className="modal__field">
                                                <label className="modal__label">{t.statusLabel}</label>
                                                <select
                                                    className="input"
                                                    value={form.statusId}
                                                    onChange={(e) => setField('statusId', Number(e.target.value))}
                                                >
                                                    {columns.map(c => (
                                                        <option key={c.statusId} value={c.statusId}>{c.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="modal__field">
                                            <label className="modal__label">{t.priorityLabel}</label>
                                            <select
                                                className="input"
                                                value={form.priority}
                                                onChange={(e) => setField('priority', Number(e.target.value))}
                                            >
                                                <option value={0}>{t.priorityNormal}</option>
                                                <option value={1}>{t.priorityHigh}</option>
                                                <option value={2}>{t.priorityUrgent}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="modal__field">
                                        <label className="modal__label">{t.deadlineLabel}</label>
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
                                        <span>{t.specifyTime}</span>
                                    </label>

                                    {form.hasTime && (
                                        <div className="modal__field">
                                            <label className="modal__label">{t.timeLabel}</label>
                                            <input
                                                className="input"
                                                type="time"
                                                value={form.deadlineTime}
                                                onChange={(e) => setField('deadlineTime', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {!isSubtask && !isRecurrenceInstance && (
                                    <div className="task-detail__group">
                                        <RecurrenceEditor
                                            taskId={taskId}
                                            initial={recurrence}
                                            onChange={(val) => {
                                                setRecurrence(val)
                                                setRecurrenceDirty(true)
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="task-detail__group">
                                    <div className="task-detail__label-row">
                                        <div className="task-detail__label">{t.tagsLabel}</div>
                                        {boardId && (
                                            <button
                                                type="button"
                                                className="task-detail__small-btn"
                                                onClick={() => setCreatingTag(v => !v)}
                                            >
                                                {creatingTag ? t.cancelCreate : t.createTag}
                                            </button>
                                        )}
                                    </div>

                                    {creatingTag && (
                                        <div className="task-detail__create-tag">
                                            <input
                                                className="input"
                                                placeholder={t.tagName}
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
                                                        {ic ? `${ic}` : t.noIcon}
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
                                                {t.ok}
                                            </button>
                                        </div>
                                    )}

                                    <div className="task-detail__tags">
                                        {tags.length === 0 && !creatingTag && (
                                            <div className="task-detail__empty">{t.noBoardTags}</div>
                                        )}
                                        {tags.map(tag => {
                                            const active = (task.tags || []).some(tg => tg.id === tag.id)
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
                                                        title={t.edit}
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
                                                {t.subtasksLabel} {(existingSubtasks.length + pendingSubtasks.length) > 0
                                                ? `(${existingSubtasks.length + pendingSubtasks.length})`
                                                : ''}
                                            </div>
                                        </div>

                                        <div className="task-detail__subtask-input-wrap">
                                            <input
                                                className="input"
                                                placeholder={t.findOrCreateSubtask}
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
                                                    {autocompleteResults.map(st => (
                                                        <button
                                                            key={st.id}
                                                            type="button"
                                                            className="task-detail__subtask-ac-item"
                                                            onClick={() => attachExistingSubtask(st)}
                                                        >
                                                            <span className="task-detail__subtask-ac-title">{st.title}</span>
                                                            {st.statusTitle && (
                                                                <span className="task-detail__subtask-ac-status">
                                                                    {st.statusTitle}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                    {autocompleteResults.length === 0 && (
                                                        <div className="task-detail__subtask-ac-empty">
                                                            {t.noMatches}
                                                        </div>
                                                    )}
                                                    {autocompleteResults.length > 0 && (
                                                        <button
                                                            type="button"
                                                            className="task-detail__subtask-ac-create"
                                                            onClick={addPendingSubtask}
                                                        >
                                                            {t.createNew(subtaskInput.trim())}
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
                                                <div className="task-detail__empty">{t.noSubtasks}</div>
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
                                                                title={t.makeStandalone}
                                                            >↗</button>
                                                            <button
                                                                type="button"
                                                                className="subtask-card__btn subtask-card__btn--danger"
                                                                onClick={(e) => { e.stopPropagation(); deleteExistingSubtask(st.id) }}
                                                                title={t.deleteSubtask}
                                                            >🗑</button>
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
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            {pendingSubtasks.map((ps, idx) => (
                                                <div key={`pending-${idx}`} className="subtask-card subtask-card--pending">
                                                    <div className="subtask-card__head">
                                                        <span className="subtask-card__check" />
                                                        <span className="subtask-card__title">{ps.title}</span>
                                                        <span className="subtask-card__pending-badge">{t.newBadge}</span>
                                                        <button
                                                            type="button"
                                                            className="subtask-card__btn subtask-card__btn--danger"
                                                            onClick={(e) => { e.stopPropagation(); removePendingSubtask(idx) }}
                                                            title={t.removeFromList}
                                                        >×</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="task-detail__group">
                                    <div className="task-detail__label">
                                        {t.attachmentsLabel} {task.attachments?.length ? `(${task.attachments.length})` : ''}
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
                                                    >×</button>
                                                </div>
                                            )
                                        })}

                                        <label className="task-detail__attachment-add">
                                            {uploading ? '...' : t.addAttachment}
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
                    </>
                )}
            </Modal>

            {editingTag && (
                <div className="modal-overlay" onClick={() => setEditingTag(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal__head">
                            <h3 className="modal__title">{t.editTagModal}</h3>
                            <button className="modal__close" onClick={() => setEditingTag(null)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div className="modal__field">
                                <label className="modal__label">{t.titleLabel}</label>
                                <input
                                    className="input"
                                    value={editingTag.title}
                                    onChange={(e) => setEditingTag(f => ({ ...f, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">{t.iconLabel}</label>
                                <select
                                    className="input"
                                    value={editingTag.icon}
                                    onChange={(e) => setEditingTag(f => ({ ...f, icon: e.target.value }))}
                                >
                                    {TAG_ICONS.map(ic => (
                                        <option key={ic} value={ic}>
                                            {ic ? `${ic}` : t.noIcon}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">{t.colorLabel}</label>
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
                            <button className="btn btn-ghost" onClick={() => setEditingTag(null)}>{t.cancel}</button>
                            <button className="btn btn-primary" onClick={saveTagEdit}>{t.save}</button>
                        </div>
                    </div>
                </div>
            )}

            <AttachmentPreview
                attachment={previewAttachment}
                onClose={() => setPreviewAttachment(null)}
            />

            <ConfirmModal {...modalProps} />
        </>
    )
}