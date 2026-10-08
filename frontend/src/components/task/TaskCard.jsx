import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { tasksApi } from '../../api/api'
import Subtask from './Subtask'
import InlineEdit from '../common/InlineEdit'
import DetailTextEditor from './DetailTextEditor'
import { formatDeadline } from '../../utils/format'
import { isDone as checkIsDone, isCancelled as checkIsCancelled, isExpired as checkIsExpired } from '../../utils/sortTasks'
import useT from '../../hooks/useT'

export default function TaskCard({
                                     task, doneStatusId, activeStatusId,
                                     onOpenTask, onToggleDone, onTaskMoved, onOpenAttachments,
                                     onHover,
                                 }) {
    const t = useT()
    const nav = useNavigate()
    const location = useLocation()
    const [expanded, setExpanded] = useState(false)
    const [fullTask, setFullTask] = useState(null)
    const [loadingFull, setLoadingFull] = useState(false)

    const isDone = checkIsDone(task)
    const isCancelled = checkIsCancelled(task)
    const isExpired = checkIsExpired(task)

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
        const subDone = checkIsDone(subtask)
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
        let loaded = fullTask
        const needReload = !loaded
            || (loaded.attachments?.length || 0) < (task.attachmentNames?.length || 0)
        if (needReload) {
            try {
                const { data } = await tasksApi.get(task.id)
                loaded = data
                setFullTask(data)
            } catch {
                return
            }
        }
        if (!loaded?.attachments?.length) return
        onOpenAttachments && onOpenAttachments(task.id, loaded.attachments)
    }

    const handleTagClick = (e, tag) => {
        e.stopPropagation()
        nav(`/search?tagIds=${tag.id}`)
    }

    const handleDeadlineClick = (e) => {
        e.stopPropagation()
        const d = new Date(task.deadline)
        if (isNaN(d.getTime())) return
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const backPath = location.pathname + location.search
        nav(`/calendar?date=${yyyy}-${mm}-${dd}&from=${encodeURIComponent(backPath)}`)
    }

    const saveTitle = async (newTitle) => {
        await tasksApi.update(task.id, { title: newTitle })
        onTaskMoved && onTaskMoved()
    }

    const saveDescription = async (newDesc) => {
        await tasksApi.update(task.id, { description: newDesc })
        setFullTask(prev => prev ? { ...prev, description: newDesc } : prev)
    }

    const accent = task.statusAccentCode
        ? `var(--accent-${task.statusAccentCode}, var(--primary))`
        : 'var(--primary)'

    return (
        <div
            className={`task-card ${isDone ? 'task-card--done' : ''}`}
            style={{ '--accent': accent }}
            onClick={handleToggleExpand}
            onMouseEnter={() => onHover && onHover(task.id)}
            onMouseLeave={() => onHover && onHover(null)}
        >
            <div className="task-card__head">
                <button
                    className={[
                        'task-card__check',
                        isDone ? 'task-card__check--done' : '',
                        isCancelled ? 'task-card__check--cancelled' : '',
                        isExpired ? 'task-card__check--expired' : '',
                    ].filter(Boolean).join(' ')}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleCheck}
                />

                <InlineEdit
                    value={task.title}
                    className="task-card__title"
                    inputClassName="input task-card__title-input"
                    onSave={saveTitle}
                    title={t.edit}
                />

                {task.priority > 0 && (
                    <span className="task-card__priority task-card__priority--big">
                        {task.priority === 2 ? '❗' : '⚡'}
                    </span>
                )}
                <div className="task-card__actions">
                    {task.attachmentNames?.length > 0 && (
                        <span
                            className="task-card__attach"
                            title={`${t.attachmentsLabel}: ${task.attachmentNames.length}`}
                        >📎</span>
                    )}
                    <button
                        className="task-card__edit"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleEdit}
                        title={t.edit}
                    >✎</button>
                </div>
            </div>

            {task.deadline && (
                <div className="task-card__deadline-row">
                    <button
                        type="button"
                        className="task-card__deadline-inline task-card__deadline-inline--clickable"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleDeadlineClick}
                        title="Открыть в календаре"
                    >
                        📅 {formatDeadline(task.deadline)}
                    </button>
                </div>
            )}

            {task.tags && task.tags.length > 0 && (
                <div className="task-card__tags-row">
                    {task.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="task-tag task-tag--clickable"
                            style={{ background: `var(--accent-${tag.accentCode || 'gray'})` }}
                            title={tag.title}
                            onClick={(e) => handleTagClick(e, tag)}
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
                        <Subtask
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
                    {loadingFull && <div className="task-card__details-loading">{t.loading}</div>}
                    {fullTask && (
                        <>
                            <div>
                                <div className="task-card__details-label">{t.taskDescriptionLabel}:</div>
                                <DetailTextEditor
                                    value={fullTask.description || ''}
                                    onSave={saveDescription}
                                    placeholder={t.addDescription}
                                    title={t.edit}
                                />
                            </div>
                            {fullTask.attachments?.length > 0 && (
                                <div className="task-card__details-row">
                                    <span className="task-card__details-label">{t.attachmentsLabel}:</span>
                                    <span
                                        className="task-card__details-attachments"
                                        onClick={handleOpenAttachments}
                                        title={t.open}
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