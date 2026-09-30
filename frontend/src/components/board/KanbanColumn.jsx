import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableTaskCard from '../Task/SortableTaskCard'

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
                                     }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.statusId}`,
        data: { type: 'column', statusId: column.statusId },
    })

    const taskIds = column.tasks.map(t => t.id)

    const accentColor = column.accentCode
        ? `var(--accent-${column.accentCode}, #97a0af)`
        : 'var(--primary)'

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
                        title="Перетащить колонку"
                    >
                        ⋮⋮
                    </span>
                )}
                <span className="kanban-col__title" style={{ color: accentColor }}>
                    {column.icon && <span style={{ marginRight: 4 }}>{column.icon}</span>}
                    {column.title}
                </span>
                <span className="kanban-col__count">{column.count}</span>
            </div>

            <div className="kanban-col__body" ref={setNodeRef}>
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map(t => (
                        <SortableTaskCard
                            key={t.id}
                            task={t}
                            doneStatusId={doneStatusId}
                            activeStatusId={activeStatusId}
                            isDropOver={hoverTaskId === t.id}
                            dropMode={hoverTaskId === t.id ? hoverMode : null}
                            onOpenTask={onOpenTask}
                            onToggleDone={onToggleDone}
                            onTaskMoved={onTaskMoved}
                            onOpenAttachments={onOpenAttachments}
                        />
                    ))}
                </SortableContext>
            </div>

            <button
                className="kanban-col__add"
                onClick={() => onAddTask && onAddTask(column.statusId)}
            >
                + Добавить задачу
            </button>
        </div>
    )
}