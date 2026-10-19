import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { invalidateTasks } from '../../store/slices/tasksSlice'
import { tasksApi, tagsApi, attachmentsApi, projectsApi, boardsApi, recurrenceApi } from '../../api/api'
import Modal from '../modal/Modal'
import useT from '../../hooks/useT'
import { resolveUrl } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import RecurrenceEditor from './RecurrenceEditor'

/**
 * Универсальная модалка создания задачи.
 *
 * @param {'calendar' | 'project'} props.mode
 *   'calendar' — показываются поля выбора Доски и Проекта, принимает presetDeadline
 *   'project'  — поля выбора скрыты, работаем в контексте projectId/boardId
 */
export default function TaskFormModal({
                                          open,
                                          onClose,
                                          onCreated,
                                          projectId: fixedProjectId,
                                          boardId: fixedBoardId,
                                          presetStatusId,
                                          columns: presetColumns,
                                          presetDeadline,
                                          boards: boardsProp,
                                          mode = 'project',
                                      }) {
    const t = useT()
    const { user } = useAuth()
    const dispatch = useDispatch()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [statusId, setStatusId] = useState('')
    const [priority, setPriority] = useState(0)
    const [deadlineDate, setDeadlineDate] = useState('')
    const [deadlineTime, setDeadlineTime] = useState('')
    const [hasTime, setHasTime] = useState(false)
    const [showMore, setShowMore] = useState(false)
    const [recurrence, setRecurrence] = useState(null)

    // Выбор доски/проекта — только для mode === 'calendar'
    const [boards, setBoards] = useState(boardsProp || [])
    const [selectedBoardId, setSelectedBoardId] = useState(null)
    const [projectsOfBoard, setProjectsOfBoard] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState(null)
    const [loadingProjects, setLoadingProjects] = useState(false)

    const [columns, setColumns] = useState(presetColumns || [])
    const [loadingColumns, setLoadingColumns] = useState(false)

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

    const isProjectFixed = mode === 'project' || !!fixedProjectId

    // 1. Список досок (только для режима календаря)
    useEffect(() => {
        if (!open || mode !== 'calendar') return
        if (boardsProp && boardsProp.length) {
            setBoards(boardsProp)
            return
        }
        boardsApi.list()
            .then(({ data }) => setBoards(data))
            .catch(() => setBoards([]))
    }, [open, boardsProp, mode])

    // 2. Сброс формы при открытии
    useEffect(() => {
        if (!open) return

        setTitle('')
        setDescription('')
        setPriority(0)
        setDeadlineDate(presetDeadline || '')
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
        setRecurrence(null)
        setError(null)

        if (isProjectFixed) {
            setSelectedBoardId(fixedBoardId || null)
            setSelectedProjectId(fixedProjectId)
            // Колонки для фиксированного проекта синхронизирует отдельный
            // эффект по presetColumns — здесь не трогаем их, чтобы не
            // перезапускать сброс формы на каждый новый массив из родителя.
        } else {
            setSelectedBoardId(null)
            setSelectedProjectId(null)
            setColumns([])
            setProjectsOfBoard([])
        }

        if (presetStatusId) {
            setStatusId(String(presetStatusId))
        } else {
            setStatusId('')
        }
    }, [open, presetDeadline, isProjectFixed, fixedProjectId, fixedBoardId, presetStatusId])

    // 3. Доска по умолчанию (только режим календаря)
    useEffect(() => {
        if (!open || mode !== 'calendar' || isProjectFixed) return
        if (selectedBoardId) return
        if (!boards?.length) return

        const defaultFromWorkspace = user?.workspace?.defaultBoardId
        const pick =
            (defaultFromWorkspace && boards.some(b => b.id === defaultFromWorkspace)
                ? defaultFromWorkspace
                : null)
            || boards.find(b => b.isPinned)?.id
            || boards[0].id

        setSelectedBoardId(pick)
    }, [open, boards, selectedBoardId, isProjectFixed, mode, user?.workspace?.defaultBoardId])

    // 4. Проекты выбранной доски (только режим календаря)
    useEffect(() => {
        if (!open || mode !== 'calendar' || isProjectFixed) return
        if (!selectedBoardId) {
            setProjectsOfBoard([])
            return
        }
        setLoadingProjects(true)
        projectsApi.listByBoard(selectedBoardId)
            .then(({ data }) => {
                setProjectsOfBoard(data)
                setSelectedProjectId(prev => {
                    if (prev && data.some(p => p.id === prev)) return prev
                    const main = data.find(p => p.isMain) || data[0]
                    return main?.id || null
                })
            })
            .catch(() => setProjectsOfBoard([]))
            .finally(() => setLoadingProjects(false))
    }, [open, selectedBoardId, isProjectFixed, mode])

    // 5. Колонки (статусы) выбранного проекта
    useEffect(() => {
        if (!open) return
        // В режиме фиксированного проекта колонки приходят пропом presetColumns
        // и синхронизируются отдельным эффектом ниже — сетевой запрос не нужен
        // и раньше дублировал GET /kanban на каждый ре-рендер.
        if (isProjectFixed) return
        if (!selectedProjectId) {
            setColumns([])
            if (!presetStatusId) setStatusId('')
            return
        }
        setLoadingColumns(true)
        tasksApi.kanban(selectedProjectId)
            .then(({ data }) => {
                const cols = data.columns || []
                setColumns(cols)
                setStatusId(prev => {
                    if (prev && cols.some(c => String(c.statusId) === String(prev))) {
                        return prev
                    }
                    if (presetStatusId && cols.some(c => String(c.statusId) === String(presetStatusId))) {
                        return String(presetStatusId)
                    }
                    const active = cols.find(c => c.categoryCode === 'ACTIVE')
                    const fallback = active?.statusId || cols[0]?.statusId || ''
                    return fallback ? String(fallback) : ''
                })
            })
            .catch(() => setColumns([]))
            .finally(() => setLoadingColumns(false))
        // presetColumns намеренно НЕ в deps: новый массив из родителя
        // перезапускал эффект и плодил запросы.
        // eslint-disable-next-line
    }, [open, selectedProjectId, isProjectFixed, presetStatusId])

    // Синхронизация колонок из пропа для фиксированного проекта БЕЗ сетевого
    // запроса — отдельно от эффекта загрузки выше.
    useEffect(() => {
        if (!open || !isProjectFixed) return
        setColumns(presetColumns || [])
    }, [open, isProjectFixed, presetColumns])

    // 6. Теги для доски
    useEffect(() => {
        if (!open) return
        const boardIdForTags = isProjectFixed ? fixedBoardId : selectedBoardId
        if (!boardIdForTags) {
            setTags([])
            return
        }
        tagsApi.listByBoard(boardIdForTags)
            .then(({ data }) => setTags(data))
            .catch(() => setTags([]))
    }, [open, selectedBoardId, fixedBoardId, isProjectFixed])

    const toggleTag = (tagId) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        )
    }

    const createTag = async () => {
        const boardIdForTag = isProjectFixed ? fixedBoardId : selectedBoardId
        if (!newTagTitle.trim() || !boardIdForTag) return
        try {
            const { data } = await tagsApi.create(boardIdForTag, {
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
        const projectIdToUse = isProjectFixed ? fixedProjectId : selectedProjectId
        if (!projectIdToUse) {
            setError('Выберите проект')
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

            const { data: created } = await tasksApi.create(projectIdToUse, {
                title: title.trim(),
                description: description.trim() || undefined,
                statusId: statusId ? Number(statusId) : undefined,
                deadline: deadline || undefined,
                priority: priority || undefined,
                tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            })

            if (recurrence && recurrence.rule) {
                try {
                    await recurrenceApi.save(created.id, {
                        rule: recurrence.rule,
                        timeOfDay: recurrence.timeOfDay || null,
                        startAt: recurrence.startAt || null,
                        endMode: recurrence.endMode || 'never',
                        endUntil: recurrence.endUntil || null,
                        endCount: recurrence.endCount || null,
                    })
                } catch (err) {
                    console.error('Recurrence save failed:', err)
                }
            }

            for (const a of attachments) {
                try { await tasksApi.attach(created.id, a.id) } catch (err) { console.error(err) }
            }

            for (const st of subtasks) {
                try {
                    await tasksApi.create(projectIdToUse, {
                        title: st.title,
                        parentId: created.id,
                    })
                } catch (err) { console.error(err) }
            }

            dispatch(invalidateTasks())
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
                        form="task-form"
                        className="btn btn-primary"
                        disabled={loading || !title.trim() || (!isProjectFixed && !selectedProjectId)}
                    >
                        {loading ? t.creatingLabel : t.create}
                    </button>
                </>
            }
        >
            <form id="task-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
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

                {!showMore && presetDeadline && (
                    <div className="create-task__hint-inline">
                        📅 {new Date(presetDeadline).toLocaleDateString()}
                    </div>
                )}

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

                        {mode === 'calendar' && !isProjectFixed && (
                            <>
                                <div className="modal__field">
                                    <label className="modal__label">Доска</label>
                                    <select
                                        className="input"
                                        value={selectedBoardId || ''}
                                        onChange={(e) => setSelectedBoardId(Number(e.target.value) || null)}
                                        disabled={!boards.length}
                                    >
                                        {boards.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {projectsOfBoard.length > 1 && (
                                    <div className="modal__field">
                                        <label className="modal__label">Проект</label>
                                        <select
                                            className="input"
                                            value={selectedProjectId || ''}
                                            onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
                                            disabled={loadingProjects}
                                        >
                                            {projectsOfBoard.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title}{p.isMain ? ' (главный)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="modal__row">
                            <div className="modal__field">
                                <label className="modal__label">{t.statusLabel}</label>
                                <select
                                    className="input"
                                    value={statusId}
                                    onChange={(e) => setStatusId(e.target.value)}
                                    disabled={loadingColumns || !columns.length}
                                >
                                    {columns.map(c => (
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
                            <RecurrenceEditor
                                initial={recurrence}
                                onChange={(val) => setRecurrence(val)}
                            />
                        </div>

                        <div className="task-detail__group" style={{ paddingBottom: 0, borderBottom: 'none', gap: 12 }}>
                            <div className="task-detail__label-row">
                                <div className="task-detail__label">{t.tagsLabel}</div>
                                <button
                                    type="button"
                                    className="task-detail__small-btn"
                                    onClick={() => setCreatingTag(v => !v)}
                                    disabled={!(isProjectFixed ? fixedBoardId : selectedBoardId)}
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
                                    className="create-task__subtask-add"
                                    onClick={addSubtask}
                                    disabled={!subtaskInput.trim()}
                                    title="Добавить подзадачу"
                                >
                                    Добавить
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