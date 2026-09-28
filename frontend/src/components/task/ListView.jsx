import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { tasksApi } from '../../api/api'

function sortTasks(tasks, sortMode, sortDir) {
    const dir = sortDir === 'desc' ? -1 : 1
    const arr = [...tasks]

    switch (sortMode) {
        case 'by_priority':
            arr.sort((a, b) => dir * ((b.priority || 0) - (a.priority || 0)))
            break
        case 'by_deadline':
            arr.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0
                if (!a.deadline) return 1
                if (!b.deadline) return -1
                return dir * (new Date(a.deadline) - new Date(b.deadline))
            })
            break
        case 'by_created':
            arr.sort((a, b) => dir * ((b.id || 0) - (a.id || 0)))
            break
        case 'manual':
        default:
            arr.sort((a, b) => dir * ((a.position || 0) - (b.position || 0)))
    }
    return arr
}

function SortableTaskRow({ task, columnTitle, onClick, onToggleDone }) {
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

    const isDone = task.statusCategoryCode === 'DONE'
        || task.statusCode === 'DONE'
        || task.statusCategoryCode === 'CANCELLED'

    const accent = task.statusAccentCode
        ? `var(--accent-${task.statusAccentCode}, var(--primary))`
        : 'var(--primary)'

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`word-list__item ${isDragging ? 'word-list__item--dragging' : ''}`}
            onClick={() => onClick && onClick(task.id)}
        >
            <button
                className={`word-list__check ${isDone ? 'word-list__check--done' : ''}`}
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleDone && onToggleDone(task.id, isDone)
                }}
            />
            <div className="word-list__body">
                <div className="word-list__title">{task.title}</div>
                <div className="word-list__meta">
                    <span className="word-list__status">
                        <span
                            className="word-list__dot"
                            style={{ background: accent }}
                        />
                        {columnTitle}
                    </span>
                    {task.priority > 0 && (
                        <span className="word-list__priority">
                            {task.priority === 2 ? '🔥 Срочный' : '⚡ Высокий'}
                        </span>
                    )}
                    {task.deadline && (
                        <span className="word-list__deadline">
                            📅 {new Date(task.deadline).toLocaleDateString('ru-RU')}
                        </span>
                    )}
                    {task.tags && task.tags.length > 0 && (
                        <span className="word-list__tags">
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
                        </span>
                    )}
                </div>
            </div>
            {task.hasAttachments && (
                <span className="word-list__attach" title="Есть вложения">📎</span>
            )}
        </div>
    )
}

export default function ListView({
                                     columns,
                                     projectId,
                                     onAddTask,
                                     onTaskClick,
                                     onToggleDone,
                                     onTaskMoved,
                                     sortMode,
                                     sortDir,
                                 }) {
    const allTasks = columns.flatMap(c =>
        c.tasks.map(t => ({
            ...t,
            columnTitle: c.title,
        }))
    )

    const [localOrder, setLocalOrder] = useState(null)
    const [activeTask, setActiveTask] = useState(null)

    const sorted = localOrder || sortTasks(allTasks, sortMode, sortDir)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const handleDragStart = (event) => {
        const { active } = event
        const task = active.data.current?.task
        if (task) setActiveTask(task)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)
        if (!over || active.id === over.id) {
            setLocalOrder(null)
            return
        }

        const oldIndex = sorted.findIndex(t => t.id === active.id)
        const newIndex = sorted.findIndex(t => t.id === over.id)
        if (oldIndex === -1 || newIndex === -1) {
            setLocalOrder(null)
            return
        }

        const reordered = arrayMove(sorted, oldIndex, newIndex)
        setLocalOrder(reordered)

        try {
            await Promise.all(
                reordered.map((t, idx) =>
                    tasksApi.move(t.id, {
                        statusId: t.statusId,
                        position: idx,
                    })
                )
            )
            onTaskMoved && onTaskMoved()
            setLocalOrder(null)
        } catch (err) {
            console.error('Reorder failed:', err)
            setLocalOrder(null)
        }
    }

    const taskIds = sorted.map(t => t.id)

    return (
        <div className="word-list">
            <div className="word-list__page">
                <div className="word-list__topbar">
                    <div className="word-list__count">{sorted.length} задач</div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => onAddTask && onAddTask()}
                    >
                        + Задача
                    </button>
                </div>

                {sorted.length === 0 ? (
                    <div className="word-list__empty">Нет задач</div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                            <div className="word-list__list">
                                {sorted.map(t => (
                                    <SortableTaskRow
                                        key={t.id}
                                        task={t}
                                        columnTitle={t.columnTitle}
                                        onClick={onTaskClick}
                                        onToggleDone={onToggleDone}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay
                            dropAnimation={{
                                sideEffects: defaultDropAnimationSideEffects({
                                    styles: { active: { opacity: '0.5' } },
                                }),
                            }}
                        >
                            {activeTask ? (
                                <div style={{ width: 600 }}>
                                    <div className="word-list__item">
                                        <div className="word-list__body">
                                            <div className="word-list__title">{activeTask.title}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>
        </div>
    )
}