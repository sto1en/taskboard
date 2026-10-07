import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

export default function SortableTaskCard({
                                             task,
                                             reorderMode,
                                             doneStatusId,
                                             activeStatusId,
                                             isDropOver,
                                             dropMode,
                                             onOpenTask,
                                             onToggleDone,
                                             onTaskMoved,
                                             onOpenAttachments,
                                             onHover,
                                         }) {
    // В режиме перестановки статусов задача не участвует в DnD —
    // рендерим её как обычную карточку, чтобы dnd-kit не «магнитился» к ней
    if (reorderMode) {
        return (
            <TaskCard
                task={task}
                doneStatusId={doneStatusId}
                activeStatusId={activeStatusId}
                onOpenTask={onOpenTask}
                onToggleDone={onToggleDone}
                onTaskMoved={onTaskMoved}
                onOpenAttachments={onOpenAttachments}
                onHover={onHover}
            />
        )
    }

    return (
        <SortableTaskCardInner
            task={task}
            doneStatusId={doneStatusId}
            activeStatusId={activeStatusId}
            isDropOver={isDropOver}
            dropMode={dropMode}
            onOpenTask={onOpenTask}
            onToggleDone={onToggleDone}
            onTaskMoved={onTaskMoved}
            onOpenAttachments={onOpenAttachments}
            onHover={onHover}
        />
    )
}

function SortableTaskCardInner({
                                   task,
                                   doneStatusId,
                                   activeStatusId,
                                   isDropOver,
                                   dropMode,
                                   onOpenTask,
                                   onToggleDone,
                                   onTaskMoved,
                                   onOpenAttachments,
                                   onHover,
                               }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: { type: 'task', task },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    }

    const wrapperClass = [
        'task-card-wrapper',
        isDragging ? 'task-card-wrapper--dragging' : '',
        isDropOver ? 'task-card-wrapper--drop-over' : '',
        isDropOver && dropMode ? `task-card-wrapper--drop-${dropMode}` : '',
    ].filter(Boolean).join(' ')

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={wrapperClass}
        >
            <TaskCard
                task={task}
                doneStatusId={doneStatusId}
                activeStatusId={activeStatusId}
                onOpenTask={onOpenTask}
                onToggleDone={onToggleDone}
                onTaskMoved={onTaskMoved}
                onOpenAttachments={onOpenAttachments}
                onHover={onHover}
            />
        </div>
    )
}