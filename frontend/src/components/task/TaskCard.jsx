import { useState } from 'react'
import { tasksApi } from '../../api/api'

export default function TaskCard({ task, onClick, onToggleDone }) {
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

    const handleExpand = async (e) => {
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

    const accent = task.statusAccentCode
        ? `var(--accent-${task.statusAccentCode}, var(--primary))`
        : 'var(--primary)'

    return (
        <div
            className="task-card"
            style={{ '--accent': accent }}
            onClick={() => onClick && onClick(task.id)}
        >
            <div className="task-card__head">
                <button
                    className={`task-card__check ${isDone ? 'task-card__check--done' : ''}`}
                    onClick={handleCheck}
                    title={isDone ? 'Вернуть в работу' : 'Отметить выполненной'}
                />
                <div className="task-card__title">{task.title}</div>
                <button
                    className="task-card__expand"
                    onClick={handleExpand}
                    title={expanded ? 'Свернуть' : 'Показать подробности'}
                >
                    {expanded ? '▲' : '▼'}
                </button>
                {task.hasAttachments && (
                    <span className="task-card__attach" title="Есть вложения">📎</span>
                )}
            </div>

            <div className="task-card__meta">
                {task.statusTitle && (
                    <span className="task-card__status">{task.statusTitle}</span>
                )}
                {task.priority > 0 && (
                    <span
                        className="task-card__priority"
                        title={task.priority === 2 ? 'Срочный' : 'Высокий'}
                    >
                        {task.priority === 2 ? '🔥' : '⚡'}
                    </span>
                )}
                {task.deadline && (
                    <span className="task-card__deadline">
                        📅 {new Date(task.deadline).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                    </span>
                )}
            </div>

            {task.tags && task.tags.length > 0 && (
                <div className="task-card__tags">
                    {task.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="task-tag"
                            style={{
                                background: `var(--accent-${tag.accentCode || 'gray'})`,
                            }}
                            title={tag.title}
                        >
                            {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                            {tag.title}
                        </span>
                    ))}
                </div>
            )}

            {expanded && (
                <div className="task-card__details" onClick={(e) => e.stopPropagation()}>
                    {loadingFull && (
                        <div className="task-card__details-loading">Загрузка...</div>
                    )}

                    {fullTask && (
                        <>
                            {fullTask.description && fullTask.description.trim() && (
                                <div>
                                    <div className="task-card__details-label">Описание:</div>
                                    <div className="task-card__details-description">
                                        {fullTask.description}
                                    </div>
                                </div>
                            )}

                            {fullTask.deadline && (
                                <div className="task-card__details-row">
                                    <span className="task-card__details-label">Дедлайн:</span>
                                    <span>
                                        {new Date(fullTask.deadline).toLocaleString('ru-RU', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}

                            {fullTask.attachments && fullTask.attachments.length > 0 && (
                                <div className="task-card__details-row">
                                    <span className="task-card__details-label">Вложения:</span>
                                    <span>📎 {fullTask.attachments.length}</span>
                                </div>
                            )}

                            {fullTask.subtasks && fullTask.subtasks.length > 0 && (
                                <div>
                                    <div className="task-card__details-label">
                                        Подзадачи ({fullTask.subtaskDone}/{fullTask.subtaskTotal}):
                                    </div>
                                    <div className="task-card__subtasks">
                                        {fullTask.subtasks.map(st => {
                                            const stDone = st.statusCategoryCode === 'DONE'
                                                || st.statusCode === 'DONE'
                                                || st.statusCategoryCode === 'CANCELLED'
                                            return (
                                                <div key={st.id} className="task-card__subtask">
                                                    <span
                                                        className={`task-card__subtask-check ${stDone ? 'task-card__subtask-check--done' : ''}`}
                                                    />
                                                    <span className={`task-card__subtask-title ${stDone ? 'task-card__subtask-title--done' : ''}`}>
                                                        {st.title}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}