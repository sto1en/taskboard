import { tasksApi } from '../../api/api'
import InlineEdit from '../common/InlineEdit'
import { formatDeadline } from '../../utils/format'
import { isDone as checkIsDone, isCancelled as checkIsCancelled, isExpired as checkIsExpired } from '../../utils/sortTasks'
import { PriorityStars, hasPriorityStars } from './PriorityStars'

/**
 * Компактная подзадача внутри карточки задачи.
 *
 * Раньше её можно было тащить dnd-kit'ом: подзадача выезжала за границы
 * карточки и визуально «ломала» доску. Порядок подзадач меняется в
 * TaskDetailModal (там же, где список), а не перетаскиванием мини-строки.
 * Описание подзадачи здесь тоже не показываем — только название, дедлайн,
 * теги и приоритет.
 */
export default function Subtask({
                                    subtask, onClick, onToggleDone, onTaskMoved,
                                }) {
    const stDone = checkIsDone(subtask)
    const stCancelled = checkIsCancelled(subtask)
    const stExpired = checkIsExpired(subtask)
    const hasAttach = (subtask.attachmentNames?.length || 0) > 0

    const handleEdit = (e) => {
        e.stopPropagation()
        if (onClick) onClick(subtask.id)
    }

    const handleCheck = (e) => {
        e.stopPropagation()
        if (onToggleDone) onToggleDone(subtask)
    }

    const saveTitle = async (newTitle) => {
        await tasksApi.update(subtask.id, { title: newTitle })
        onTaskMoved && onTaskMoved()
    }

    return (
        <div
            className={[
                'subtask-mini',
                stDone ? 'subtask-mini--done' : '',
                stCancelled ? 'subtask-mini--cancelled' : '',
            ].filter(Boolean).join(' ')}
        >
            <div className="subtask-mini__row-top">
                <button
                    className={[
                        'subtask-mini__check',
                        stDone ? 'subtask-mini__check--done' : '',
                        stCancelled ? 'subtask-mini__check--cancelled' : '',
                        stExpired ? 'subtask-mini__check--expired' : '',
                    ].filter(Boolean).join(' ')}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleCheck}
                />

                <InlineEdit
                    value={subtask.title}
                    className={`subtask-mini__title subtask-mini__title-text ${stDone ? 'subtask-mini__title--done' : ''}`}
                    inputClassName="input subtask-mini__title-input"
                    onSave={saveTitle}
                    title="Двойной клик — редактировать название"
                />

                {hasPriorityStars(subtask.priority) && (
                    <PriorityStars
                        priority={subtask.priority}
                        className="subtask-mini__priority"
                    />
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
        </div>
    )
}
