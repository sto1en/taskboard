export default function TaskCard({ task, onClick, onToggleDone }) {
    const isDone = task.statusCategoryCode === 'DONE'
        || task.statusCode === 'DONE'
        || task.statusCategoryCode === 'CANCELLED'

    const handleCheck = (e) => {
        e.stopPropagation()
        if (onToggleDone) onToggleDone(task.id, isDone)
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
        </div>
    )
}