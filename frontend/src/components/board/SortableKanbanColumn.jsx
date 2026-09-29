import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import KanbanColumn from './KanbanColumn'

export default function SortableKanbanColumn({ column, reorderMode, ...props }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `col-${column.statusId}`,
        data: { type: 'column', statusId: column.statusId, column },
        disabled: !reorderMode,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'kanban-col-wrapper--dragging' : ''}
        >
            <KanbanColumn
                column={column}
                reorderMode={reorderMode}
                dragHandleProps={{ ...attributes, ...listeners }}
                {...props}
            />
        </div>
    )
}