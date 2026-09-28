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
import { tasksApi, statusesApi } from '../../api/api'

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

function SortableCompactTask({ task, onTaskClick, onToggleDone }) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`compact-task ${isDragging ? 'compact-task--dragging' : ''}`}
            onClick={() => onTaskClick && onTaskClick(task.id)}
        >
            <button
                className={`compact-task__check ${isDone ? 'compact-task__check--done' : ''}`}
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleDone && onToggleDone(task.id, isDone)
                }}
            />
            <span className="compact-task__title">{task.title}</span>
            {task.priority > 0 && (
                <span className="compact-task__priority">
                    {task.priority === 2 ? '🔥' : '⚡'}
                </span>
            )}
            {task.deadline && (
                <span className="compact-task__deadline">
                    {new Date(task.deadline).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </span>
            )}
            {task.hasAttachments && (
                <span className="compact-task__attach">📎</span>
            )}
        </div>
    )
}

function SortableCompactGroup({
                                  col,
                                  isCollapsed,
                                  onToggle,
                                  sortMode,
                                  sortDir,
                                  onTaskClick,
                                  onToggleDone,
                                  onTaskDropped,
                              }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `group-${col.statusId}`,
        data: { type: 'group', column: col },
    })

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `group-drop-${col.statusId}`,
        data: { type: 'group', statusId: col.statusId },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    }

    const tasks = sortTasks(col.tasks, sortMode, sortDir)

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`compact-group ${isDragging ? 'compact-group--dragging' : ''} ${isOver ? 'compact-group--over' : ''}`}
        >
            <div
                className="compact-group__head"
                ref={setDropRef}
            >
                <span
                    className="compact-group__drag"
                    {...attributes}
                    {...listeners}
                >⋮⋮</span>
                <span
                    className="compact-group__caret"
                    onClick={(e) => { e.stopPropagation(); onToggle(col.statusId) }}
                >
                    {isCollapsed ? '▶' : '▼'}
                </span>
                <span
                    className="compact-group__dot"
                    style={{ background: `var(--accent-${col.accentCode || 'gray'})` }}
                />
                <span className="compact-group__title">{col.title}</span>
                <span className="compact-group__count">{col.count}</span>
            </div>

            {!isCollapsed && (
                <div className="compact-group__body">
                    {tasks.length === 0 ? (
                        <div className="compact-group__empty">Пусто</div>
                    ) : (
                        <SortableContext
                            items={tasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {tasks.map(t => (
                                <SortableCompactTask
                                    key={t.id}
                                    task={t}
                                    onTaskClick={onTaskClick}
                                    onToggleDone={onToggleDone}
                                />
                            ))}
                        </SortableContext>
                    )}
                </div>
            )}
        </div>
    )
}

import { useDroppable } from '@dnd-kit/core'

export default function CompactView({
                                        columns,
                                        projectId,
                                        boardId,
                                        onAddTask,
                                        onTaskClick,
                                        onToggleDone,
                                        onTaskMoved,
                                        onColumnsMoved,
                                        sortMode,
                                        sortDir,
                                    }) {
    const [collapsed, setCollapsed] = useState({})
    const [activeTask, setActiveTask] = useState(null)
    const [activeGroup, setActiveGroup] = useState(null)
    const [localOrder, setLocalOrder] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const visibleColumns = localOrder || columns

    const toggle = (statusId) => {
        setCollapsed(prev => ({ ...prev, [statusId]: !prev[statusId] }))
    }

    const handleDragStart = (event) => {
        const { active } = event
        const data = active.data.current
        if (data?.type === 'task') setActiveTask(data.task)
        if (data?.type === 'group') setActiveGroup(data.column)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)
        setActiveGroup(null)
        if (!over) return

        const activeData = active.data.current
        const overData = over.data.current

        // ===== Drag группы (статуса) =====
        if (activeData?.type === 'group') {
            const activeId = String(active.id).replace('group-', '')
            const overId = String(over.id).replace('group-', '')
            if (activeId === overId) return

            const oldIndex = visibleColumns.findIndex(c => String(c.statusId) === activeId)
            const newIndex = visibleColumns.findIndex(c => String(c.statusId) === overId)
            if (oldIndex === -1 || newIndex === -1) return

            const reordered = arrayMove(visibleColumns, oldIndex, newIndex)
            setLocalOrder(reordered)

            try {
                await Promise.all(
                    reordered.map((c, idx) =>
                        statusesApi.update(boardId, c.statusId, { position: idx })
                    )
                )
                onColumnsMoved && onColumnsMoved()
                setLocalOrder(null)
            } catch (err) {
                console.error('Group move failed:', err)
                setLocalOrder(null)
            }
            return
        }

        // ===== Drag задачи =====
        if (activeData?.type !== 'task') return

        const activeTaskId = active.id

        // Целевая группа
        let overStatusId = null
        let overTaskId = null

        if (overData?.type === 'group' || String(over.id).startsWith('group-')) {
            overStatusId = overData?.statusId
                || Number(String(over.id).replace('group-drop-', '').replace('group-', ''))
        } else {
            // Бросили на задачу — найдём её группу
            for (const col of visibleColumns) {
                if (col.tasks.some(t => t.id === over.id)) {
                    overStatusId = col.statusId
                    overTaskId = over.id
                    break
                }
            }
        }

        if (!overStatusId) return

        // Найдём исходную группу
        let activeCol = null
        for (const col of visibleColumns) {
            if (col.tasks.some(t => t.id === activeTaskId)) {
                activeCol = col
                break
            }
        }
        if (!activeCol) return

        const targetCol = visibleColumns.find(c => c.statusId === overStatusId)
        if (!targetCol) return

        let newPosition = 0
        if (overTaskId) {
            newPosition = targetCol.tasks.findIndex(t => t.id === overTaskId)
            if (newPosition < 0) newPosition = targetCol.tasks.length
        } else {
            newPosition = targetCol.tasks.length
        }

        if (activeCol.statusId === targetCol.statusId) {
            const oldIndex = activeCol.tasks.findIndex(t => t.id === activeTaskId)
            if (oldIndex === newPosition) return
        }

        try {
            await tasksApi.move(activeTaskId, {
                statusId: targetCol.statusId,
                position: newPosition,
            })
            onTaskMoved && onTaskMoved()
        } catch (err) {
            console.error('Task move failed:', err)
            onTaskMoved && onTaskMoved()
        }
    }

    const groupIds = visibleColumns.map(c => `group-${c.statusId}`)

    return (
        <div className="compact-view">
            <div className="compact-view__topbar">
                <button
                    className="btn btn-secondary"
                    onClick={() => onAddTask && onAddTask()}
                >
                    + Задача
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                    {visibleColumns.map(col => (
                        <SortableCompactGroup
                            key={col.statusId}
                            col={col}
                            isCollapsed={!!collapsed[col.statusId]}
                            onToggle={toggle}
                            sortMode={sortMode}
                            sortDir={sortDir}
                            onTaskClick={onTaskClick}
                            onToggleDone={onToggleDone}
                        />
                    ))}
                </SortableContext>

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } },
                        }),
                    }}
                >
                    {activeTask ? (
                        <div className="compact-task" style={{ opacity: 0.9 }}>
                            <span className="compact-task__title">{activeTask.title}</span>
                        </div>
                    ) : activeGroup ? (
                        <div className="compact-group" style={{ opacity: 0.9 }}>
                            <div className="compact-group__head">
                                <span className="compact-group__dot"
                                      style={{ background: `var(--accent-${activeGroup.accentCode || 'gray'})` }} />
                                <span className="compact-group__title">{activeGroup.title}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}