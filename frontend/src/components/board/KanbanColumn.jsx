import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableTaskCard from '../Task/SortableTaskCard'
import InlineEdit from '../common/InlineEdit'
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
                                         onEditStatus,
                                         onRecolorStatus,
                                     }) {
    const t = useT()
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

    const handleStatusContextMenu = (e) => {
        e.preventDefault()
        e.stopPropagation()
        onRecolorStatus && onRecolorStatus(column, e)
    }

    const handleTitleSave = async (newTitle) => {
        const trimmed = (newTitle || '').trim()
        if (!trimmed || trimmed === column.title) return
        await onEditStatus?.(column, trimmed)
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

                <div
                    className="kanban-col__title-wrap"
                    onContextMenu={handleStatusContextMenu}
                >
                    <InlineEdit
                        value={displayTitle}
                        className="kanban-col__title kanban-col__title--editable"
                        inputClassName="input kanban-col__title-input"
                        onSave={handleTitleSave}
                        title="Двойной клик — переименовать · ПКМ — сменить цвет"
                    />
                </div>

                <span className="kanban-col__count">{column.count}</span>
            </div>

            <div className="kanban-col__body" ref={setNodeRef}>
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map(task => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            reorderMode={reorderMode}
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