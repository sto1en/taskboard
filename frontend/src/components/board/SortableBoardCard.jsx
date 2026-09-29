import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BoardCard from './BoardCard'

export default function SortableBoardCard({ board, onClick, onEdit, onTogglePin }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: board.id,
        data: { type: 'board', board },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={isDragging ? 'board-card-wrapper--dragging' : ''}
        >
            <BoardCard
                board={board}
                onClick={onClick}
                onEdit={onEdit}
                onTogglePin={onTogglePin}
            />
        </div>
    )
}