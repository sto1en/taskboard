import { useState } from 'react'
import { tasksApi } from '../../api/api'
import DraggableSubtask from './DraggableSubtask'

function formatDeadline(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
    return hasTime
        ? d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
}

export default function TaskCard({
                                     task, doneStatusId, activeStatusId,
                                     onOpenTask, onToggleDone, onTaskMoved, onOpenAttachments,
                                 }) {
    const [expanded, setExpanded] = useState(false)
    const [fullTask, setFullTask] = useState(null)
    const [loadingFull, setLoadingFull] = useState(false)

    const isDone = task.statusCategoryCode === 'DONE'
        || task.statusCode === 'DONE'
        || task.statusCategoryCode === 'CANCELLED'

    const handleCheck = (e) => {
        e.stopPropagation()
        if (onToggleDone) onToggleDone(task.id, isDone)
    }

    const handleEdit = (e) => {
        e.stopPropagation()
        onOpenTask && onOpenTask(task.id)
    }

    const handleToggleExpand = async (e) => {
        e.stopPropagation()
        if (expanded) {
            setExpanded(false)
            return
        }
        setExpanded(true)
        if (!fullTask && !loadingFull) {
            setLoadingFull(true)
            try {
                const { data } = await tasksApi.get(task.id)
                setFullTask(data)
            } catch (err) {
                console.error('Failed to load full task:', err)
            } finally {
                setLoadingFull(false)
            }
        }
    }

    const handleSubtaskToggleDone = async (subtask) => {
        const subDone = subtask.statusCategoryCode === 'DONE'
            || subtask.statusCode === 'DONE'
            || subtask.statusCategoryCode === 'CANCELLED'

        const targetStatusId = subDone ? activeStatusId : doneStatusId
        if (!targetStatusId) return

        try {
            await tasksApi.update(subtask.id, { statusId: targetStatusId })
            onTaskMoved && onTaskMoved()
        } catch (err) {
            console.error('Subtask check failed:', err)
        }
    }

    const handleOpenAttachments = async (e) => {
        e.stopPropagation()
        let t = fullTask
        const needReload = !t
            || (t.attachments?.length || 0) < (task.attachmentNames?.length || 0)
        if (needReload) {
            try {
                const { data } = await tasksApi.get(task.id)
                t = data
                setFullTask(data)
            } catch {
                return
            }
        }
        if (!t?.attachments?.length) return
        onOpenAttachments && onOpenAttachments(task.id, t.attachments)
    }

    const accent = task.statusAccentCode
        ? `var(--accent-${task.statusAccentCode}, var(--primary))`
        : 'var(--primary)'

    return (
        <div
            className="task-card"
            style={{ '--accent': accent }}
            onClick={handleToggleExpand}
        >
            <div className="task-card__head">
                <button
                    className={`task-card__check ${isDone ? 'task-card__check--done' : ''}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleCheck}
                />
                <div className="task-card__title">{task.title}</div>
                {task.priority > 0 && (
                    <span className="task-card__priority task-card__priority--big">
                        {task.priority === 2 ? '❗' : '⚡'}
                    </span>
                )}
                <div className="task-card__actions">
                    {task.attachmentNames?.length > 0 && (
                        <span
                            className="task-card__attach"
                            title={`Вложений: ${task.attachmentNames.length}`}
                        >📎</span>
                    )}
                    <button
                        className="task-card__edit"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleEdit}
                        title="Редактировать"
                    >✎</button>
                </div>
            </div>

            {task.deadline && (
                <div className="task-card__deadline-row">
                    <span className="task-card__deadline-inline">
                        📅 {formatDeadline(task.deadline)}
                    </span>
                </div>
            )}

            {task.tags && task.tags.length > 0 && (
                <div className="task-card__tags-row">
                    {task.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="task-tag"
                            style={{ background: `var(--accent-${tag.accentCode || 'gray'})` }}
                            title={tag.title}
                        >
                            {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                            {tag.title}
                        </span>
                    ))}
                </div>
            )}

            {task.subtaskTotal > 0 && (
                <div className="task-card__subtask-count">
                    {task.subtaskDone}/{task.subtaskTotal}
                </div>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
                <div className="task-card__subtasks" style={{ '--accent': accent }}>
                    {task.subtasks.map(st => (
                        <DraggableSubtask
                            key={st.id}
                            subtask={st}
                            onClick={onOpenTask}
                            onToggleDone={handleSubtaskToggleDone}
                            onTaskMoved={onTaskMoved}
                            onOpenAttachments={onOpenAttachments}
                        />
                    ))}
                </div>
            )}

            {expanded && (
                <div className="task-card__details" onClick={(e) => e.stopPropagation()}>
                    {loadingFull && <div className="task-card__details-loading">Загрузка...</div>}
                    {fullTask && (
                        <>
                            {fullTask.description?.trim() && (
                                <div>
                                    <div className="task-card__details-label">Описание:</div>
                                    <div className="task-card__details-description">{fullTask.description}</div>
                                </div>
                            )}
                            {fullTask.attachments?.length > 0 && (
                                <div className="task-card__details-row">
                                    <span className="task-card__details-label">Вложения:</span>
                                    <span
                                        className="task-card__details-attachments"
                                        onClick={handleOpenAttachments}
                                        title="Открыть вложения"
                                    >
                                        {fullTask.attachments[0].originalName}
                                        {fullTask.attachments.length > 1 && (
                                            <> +{fullTask.attachments.length - 1}</>
                                        )}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}