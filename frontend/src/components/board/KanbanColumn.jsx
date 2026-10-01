import { useDroppable } from '@dnd-kit/core'
import { useNavigate } from 'react-router-dom'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableTaskCard from '../Task/SortableTaskCard'
import useT from '../../hooks/useT'
import { useAuth } from '../../context/AuthContext'
import { localizeStatusTitle } from '../../utils/statusNames'

export default function KanbanColumn({
                                         column,
                                         projectId,
                                         reorderMode,
                                         doneStatusId,
                                         activeStatusId,
                                         dragHandleProps,
                                         hoverTaskId,
                                         hoverMode,
                                         onOpenTask,
                                         onToggleDone,
                                         onAddTask,
                                         onTaskMoved,
                                         onOpenAttachments,
                                         onHover,
                                     }) {
    const t = useT()
    const nav = useNavigate()
    const { user } = useAuth()
    const lang = user?.locale?.language || 'ru'
    const displayTitle = localizeStatusTitle(column.title, lang)

    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.statusId}`,
        data: { type: 'column', statusId: column.statusId },
    })

    const taskIds = column.tasks.map(t => t.id)

    const accentColor = column.accentCode
        ? `var(--accent-${column.accentCode}, #97a0af)`
        : 'var(--primary)'

    const handleStatusClick = (e) => {
        e.stopPropagation()
        nav(`/search?statusIds=${column.statusId}`)
    }

    return (
        <div
            className={`kanban-col ${isOver ? 'kanban-col--over' : ''}`}
            data-status-id={column.statusId}
            style={{ '--accent': accentColor }}
        >
            <div
                className="kanban-col__head"
                style={{ borderBottomColor: accentColor }}
            >
                {reorderMode && (
                    <span
                        className="kanban-col__drag"
                        {...(dragHandleProps || {})}
                        title="⋮⋮"
                    >
                        ⋮⋮
                    </span>
                )}
                <span
                    className="kanban-col__title kanban-col__title--clickable"
                    style={{ color: accentColor }}
                    onClick={handleStatusClick}
                    title={t.groupTasks}
                >
                    {column.icon && <span style={{ marginRight: 4 }}>{column.icon}</span>}
                    {displayTitle}
                </span>
                <span className="kanban-col__count">{column.count}</span>
            </div>

            <div className="kanban-col__body" ref={setNodeRef}>
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map(task => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            doneStatusId={doneStatusId}
                            activeStatusId={activeStatusId}
                            isDropOver={hoverTaskId === task.id}
                            dropMode={hoverTaskId === task.id ? hoverMode : null}
                            onOpenTask={onOpenTask}
                            onToggleDone={onToggleDone}
                            onTaskMoved={onTaskMoved}
                            onOpenAttachments={onOpenAttachments}
                            onHover={onHover}
                        />
                    ))}
                </SortableContext>
            </div>

            <button
                className="kanban-col__add"
                onClick={() => onAddTask && onAddTask(column.statusId)}
            >
                {t.addTask}
            </button>
        </div>
    )
}