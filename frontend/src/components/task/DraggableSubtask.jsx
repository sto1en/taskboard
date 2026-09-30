import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { tasksApi } from '../../api/api'

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

export default function DraggableSubtask({
                                             subtask, onClick, onToggleDone, onTaskMoved, onOpenAttachments,
                                         }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `subtask-${subtask.id}`,
        data: { type: 'subtask', subtask },
    })

    const [expanded, setExpanded] = useState(false)
    const [fullSubtask, setFullSubtask] = useState(null)
    const [loadingFull, setLoadingFull] = useState(false)

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: 1000,
            opacity: isDragging ? 0.5 : 1,
        }
        : {}

    const stDone = subtask.statusCategoryCode === 'DONE'
        || subtask.statusCode === 'DONE'
        || subtask.statusCategoryCode === 'CANCELLED'

    const hasAttach = (subtask.attachmentNames?.length || 0) > 0

    const handleToggleExpand = async (e) => {
        e.stopPropagation()
        if (expanded) {
            setExpanded(false)
            return
        }
        setExpanded(true)
        if (!fullSubtask && !loadingFull) {
            setLoadingFull(true)
            try {
                const { data } = await tasksApi.get(subtask.id)
                setFullSubtask(data)
            } catch (err) {
                console.error('Failed to load subtask:', err)
            } finally {
                setLoadingFull(false)
            }
        }
    }

    const handleEdit = (e) => {
        e.stopPropagation()
        if (onClick) onClick(subtask.id)
    }

    const handleCheck = (e) => {
        e.stopPropagation()
        if (onToggleDone) onToggleDone(subtask)
    }

    const handleOpenAttachments = async (e) => {
        e.stopPropagation()
        let t = fullSubtask
        if (!t || (t.attachments?.length || 0) < (subtask.attachmentNames?.length || 0)) {
            try {
                const { data } = await tasksApi.get(subtask.id)
                t = data
                setFullSubtask(data)
            } catch {
                return
            }
        }
        if (!t?.attachments?.length) return
        onOpenAttachments && onOpenAttachments(subtask.id, t.attachments)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`subtask-mini ${stDone ? 'subtask-mini--done' : ''} ${isDragging ? 'subtask-mini--dragging' : ''}`}
            onClick={handleToggleExpand}
        >
            <div className="subtask-mini__row-top">
                <button
                    className={`subtask-mini__check ${stDone ? 'subtask-mini__check--done' : ''}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleCheck}
                />
                <span className={`subtask-mini__title ${stDone ? 'subtask-mini__title--done' : ''}`}>
                    {subtask.title}
                </span>
                {subtask.priority > 0 && (
                    <span className="subtask-mini__priority task-card__priority--big">
                        {subtask.priority === 2 ? '❗' : '⚡'}
                    </span>
                )}
                <div className="subtask-mini__actions">
                    {hasAttach && (
                        <span
                            className="subtask-mini__attach"
                            title={`Вложений: ${subtask.attachmentNames.length}`}
                        >📎</span>
                    )}
                    <button
                        className="subtask-mini__edit"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleEdit}
                        title="Редактировать"
                    >✎</button>
                </div>
            </div>

            {subtask.deadline && (
                <div className="subtask-mini__deadline-row">
                    <span className="subtask-mini__deadline">
                        📅 {formatDeadline(subtask.deadline)}
                    </span>
                </div>
            )}

            {subtask.tags && subtask.tags.length > 0 && (
                <div className="subtask-mini__tags-row">
                    {subtask.tags.map(tag => (
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

            {expanded && (
                <div className="subtask-mini__details" onClick={(e) => e.stopPropagation()}>
                    {loadingFull && (
                        <div className="subtask-mini__details-loading">Загрузка...</div>
                    )}
                    {fullSubtask && (
                        <>
                            {fullSubtask.description?.trim() && (
                                <div>
                                    <div className="subtask-mini__details-label">Описание:</div>
                                    <div className="subtask-mini__details-description">
                                        {fullSubtask.description}
                                    </div>
                                </div>
                            )}
                            {fullSubtask.attachments?.length > 0 && (
                                <div className="subtask-mini__details-row">
                                    <span className="subtask-mini__details-label">Вложения:</span>
                                    <span
                                        className="subtask-mini__details-attachments"
                                        onClick={handleOpenAttachments}
                                        title="Открыть вложения"
                                    >
                                        {fullSubtask.attachments[0].originalName}
                                        {fullSubtask.attachments.length > 1 && (
                                            <> +{fullSubtask.attachments.length - 1}</>
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