import { useState, useEffect, useRef } from 'react'
import { tasksApi, tagsApi, attachmentsApi } from '../../api/api'
import Modal from '../Modal/Modal'
import useT from '../../hooks/useT'
import { resolveUrl } from '../../utils/format'

export default function CreateTaskModal({
                                            open,
                                            onClose,
                                            onCreated,
                                            projectId,
                                            presetStatusId,
                                            columns,
                                            boardId,
                                        }) {
    const t = useT()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [statusId, setStatusId] = useState('')
    const [priority, setPriority] = useState(0)
    const [deadlineDate, setDeadlineDate] = useState('')
    const [deadlineTime, setDeadlineTime] = useState('')
    const [hasTime, setHasTime] = useState(false)
    const [showMore, setShowMore] = useState(false)

    const [tags, setTags] = useState([])
    const [selectedTagIds, setSelectedTagIds] = useState([])
    const [creatingTag, setCreatingTag] = useState(false)
    const [newTagTitle, setNewTagTitle] = useState('')
    const [newTagAccent, setNewTagAccent] = useState('blue')
    const [newTagIcon, setNewTagIcon] = useState('')

    const [subtasks, setSubtasks] = useState([])
    const [subtaskInput, setSubtaskInput] = useState('')

    const [attachments, setAttachments] = useState([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const defaultStatusId = (() => {
        if (presetStatusId) return presetStatusId
        const active = (columns || []).find(c => c.categoryCode === 'ACTIVE')
        if (active) return active.statusId
        return (columns || [])[0]?.statusId || ''
    })()

    useEffect(() => {
        if (open) {
            setTitle('')
            setDescription('')
            setStatusId(defaultStatusId)
            setPriority(0)
            setDeadlineDate('')
            setDeadlineTime('')
            setHasTime(false)
            setShowMore(false)
            setSelectedTagIds([])
            setCreatingTag(false)
            setNewTagTitle('')
            setNewTagAccent('blue')
            setNewTagIcon('')
            setSubtasks([])
            setSubtaskInput('')
            setAttachments([])
            setError(null)

            if (boardId) {
                tagsApi.listByBoard(boardId)
                    .then(({ data }) => setTags(data))
                    .catch(() => setTags([]))
            }
        }
        // eslint-disable-next-line
    }, [open, presetStatusId, boardId])

    const toggleTag = (tagId) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
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
            setSelectedTagIds(prev => [...prev, data.id])
            setNewTagTitle('')
            setNewTagAccent('blue')
            setNewTagIcon('')
            setCreatingTag(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const addSubtask = () => {
        const v = subtaskInput.trim()
        if (!v) return
        setSubtasks(prev => [...prev, { title: v }])
        setSubtaskInput('')
    }

    const removeSubtask = (idx) => {
        setSubtasks(prev => prev.filter((_, i) => i !== idx))
    }

    const handleSubtaskKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addSubtask()
        }
    }

    const uploadAttachment = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data } = await attachmentsApi.upload(file)
            setAttachments(prev => [...prev, {
                id: data.id,
                url: resolveUrl(data.url),
                originalName: data.originalName,
                mimeCode: data.mimeCode,
            }])
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id))
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) {
            setError(t.titleLabel)
            return
        }
        setLoading(true)
        setError(null)
        try {
            let deadline = null
            if (deadlineDate) {
                if (hasTime && deadlineTime) {
                    deadline = `${deadlineDate}T${deadlineTime}:00`
                } else {
                    deadline = `${deadlineDate}T00:00:00`
                }
            }

            const { data: created } = await tasksApi.create(projectId, {
                title: title.trim(),
                description: description.trim() || undefined,
                statusId: statusId ? Number(statusId) : undefined,
                deadline: deadline || undefined,
                priority: priority || undefined,
                tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            })

            for (const a of attachments) {
                try {
                    await tasksApi.attach(created.id, a.id)
                } catch (err) {
                    console.error('Attach failed:', a.originalName, err)
                }
            }

            for (const st of subtasks) {
                try {
                    await tasksApi.create(projectId, {
                        title: st.title,
                        parentId: created.id,
                    })
                } catch (err) {
                    console.error('Subtask create failed:', st.title, err)
                }
            }

            onCreated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t.newTask}
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        {t.cancel}
                    </button>
                    <button
                        type="submit"
                        form="create-task-form"
                        className="btn btn-primary"
                        disabled={loading || !title.trim()}
                    >
                        {loading ? t.creatingLabel : t.create}
                    </button>
                </>
            }
        >
            <form id="create-task-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
                <div className="modal__field">
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.whatToDo}
                        maxLength={255}
                        autoFocus
                        required
                    />
                </div>

                <button
                    type="button"
                    className="task-more-toggle"
                    onClick={() => setShowMore(v => !v)}
                >
                    {showMore ? t.hideMore : t.showMore}
                </button>

                {showMore && (
                    <>
                        <div className="modal__field">
                            <label className="modal__label">{t.descriptionLabel}</label>
                            <textarea
                                className="input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t.detailsPlaceholder}
                                maxLength={5000}
                            />
                        </div>

                        <div className="modal__row">
                            <div className="modal__field">
                                <label className="modal__label">{t.statusLabel}</label>
                                <select
                                    className="input"
                                    value={statusId}
                                    onChange={(e) => setStatusId(e.target.value)}
                                >
                                    {(columns || []).map(c => (
                                        <option key={c.statusId} value={c.statusId}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal__field">
                                <label className="modal__label">{t.priorityLabel}</label>
                                <select
                                    className="input"
                                    value={priority}
                                    onChange={(e) => setPriority(Number(e.target.value))}
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
                                value={deadlineDate}
                                onChange={(e) => setDeadlineDate(e.target.value)}
                            />
                        </div>

                        <label className="task-detail__toggle">
                            <input
                                type="checkbox"
                                checked={hasTime}
                                onChange={(e) => setHasTime(e.target.checked)}
                            />
                            <span>{t.specifyTime}</span>
                        </label>

                        {hasTime && (
                            <div className="modal__field">
                                <label className="modal__label">{t.timeLabel}</label>
                                <input
                                    className="input"
                                    type="time"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="task-detail__group" style={{ paddingBottom: 0, borderBottom: 'none', gap: 12 }}>
                            <div className="task-detail__label-row">
                                <div className="task-detail__label">{t.tagsLabel}</div>
                                <button
                                    type="button"
                                    className="task-detail__small-btn"
                                    onClick={() => setCreatingTag(v => !v)}
                                >
                                    {creatingTag ? t.cancelCreate : t.createTag}
                                </button>
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
                                    const active = selectedTagIds.includes(tag.id)
                                    return (
                                        <button
                                            key={tag.id}
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
                                    )
                                })}
                            </div>
                        </div>

                        <div className="task-detail__group" style={{ paddingBottom: 0, borderBottom: 'none', gap: 12 }}>
                            <div className="task-detail__label-row">
                                <div className="task-detail__label">
                                    {t.subtasksLabel} {subtasks.length > 0 ? `(${subtasks.length})` : ''}
                                </div>
                            </div>

                            <div className="create-task__subtask-row">
                                <input
                                    className="input"
                                    placeholder={t.subtaskPlaceholder}
                                    value={subtaskInput}
                                    onChange={(e) => setSubtaskInput(e.target.value)}
                                    onKeyDown={handleSubtaskKeyDown}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={addSubtask}
                                    disabled={!subtaskInput.trim()}
                                >
                                    +
                                </button>
                            </div>

                            {subtasks.length > 0 && (
                                <div className="create-task__subtasks">
                                    {subtasks.map((st, idx) => (
                                        <div key={idx} className="create-task__subtask">
                                            <span className="create-task__subtask-title">
                                                {st.title}
                                            </span>
                                            <button
                                                type="button"
                                                className="create-task__subtask-remove"
                                                onClick={() => removeSubtask(idx)}
                                                title={t.removeFromList}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="task-detail__group" style={{ paddingBottom: 0, borderBottom: 'none', gap: 12 }}>
                            <div className="task-detail__label-row">
                                <div className="task-detail__label">
                                    {t.attachmentsLabel} {attachments.length > 0 ? `(${attachments.length})` : ''}
                                </div>
                            </div>

                            <div className="create-task__attachments">
                                {attachments.map(a => {
                                    const isImage = a.mimeCode?.startsWith('image/')
                                    return (
                                        <div key={a.id} className="create-task__attachment">
                                            {isImage && a.url ? (
                                                <img src={a.url} alt={a.originalName} />
                                            ) : (
                                                <div className="create-task__attachment-file">
                                                    📎 {a.originalName}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="create-task__attachment-remove"
                                                onClick={() => removeAttachment(a.id)}
                                            >×</button>
                                        </div>
                                    )
                                })}

                                <label className="create-task__attachment-add">
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
                    </>
                )}

                {error && <div className="modal__error">{error}</div>}
            </form>
        </Modal>
    )
}