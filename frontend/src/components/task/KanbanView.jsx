import { useState, useEffect, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import SortableKanbanColumn from '../Board/SortableKanbanColumn'
import TaskCard from './TaskCard'
import { tasksApi, statusesApi } from '../../api/api'
import { sortTasks } from '../../utils/sortTasks'

export default function KanbanView({
                                       columns,
                                       projectId,
                                       boardId,
                                       reorderMode,
                                       doneStatusId,
                                       activeStatusId,
                                       onTaskMoved,
                                       onColumnsMoved,
                                       activeStatuses,
                                       onAddTask,
                                       onOpenTask,
                                       onToggleDone,
                                       onOpenAttachments,
                                       sortMode,
                                       sortDir,
                                   }) {
    const [activeTask, setActiveTask] = useState(null)
    const [activeSubtask, setActiveSubtask] = useState(null)
    const [activeColumn, setActiveColumn] = useState(null)
    const [hoverTaskId, setHoverTaskId] = useState(null)
    const [hoverMode, setHoverMode] = useState(null)
    const [shiftPressed, setShiftPressed] = useState(false)
    const [localColumns, setLocalColumns] = useState(columns)

    useEffect(() => {
        setLocalColumns(columns)
    }, [columns])

    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Shift') setShiftPressed(true) }
        const onKeyUp = (e) => { if (e.key === 'Shift') setShiftPressed(false) }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const visible = useMemo(() => {
        return activeStatuses.length > 0
            ? localColumns.filter(c => activeStatuses.includes(c.statusId))
            : localColumns
    }, [localColumns, activeStatuses])

    const sorted = useMemo(() => {
        return visible.map(col => ({
            ...col,
            tasks: sortTasks(col.tasks, sortMode, sortDir),
        }))
    }, [visible, sortMode, sortDir])

    const findColumnByTaskId = (taskId) => {
        for (const col of sorted) {
            if (col.tasks.some(t => t.id === taskId)) return col
        }
        return null
    }

    const handleDragStart = (event) => {
        const { active } = event
        const data = active.data.current
        if (data?.type === 'task') setActiveTask(data.task)
        if (data?.type === 'subtask') setActiveSubtask(data.subtask)
        if (data?.type === 'column') setActiveColumn(data.column)
    }

    const computeReorderMode = (active, over) => {
        if (!active.rect.current?.translated || !over.rect) return 'below'
        const activeRect = active.rect.current.translated
        const cursorY = activeRect.top + activeRect.height / 2
        const overTop = over.rect.top
        const overHeight = over.rect.height
        const centerY = overTop + overHeight / 2
        return cursorY < centerY ? 'above' : 'below'
    }

    const handleDragOver = (event) => {
        const { active, over } = event
        if (!over) {
            setHoverTaskId(null)
            setHoverMode(null)
            return
        }

        const overData = over.data.current

        if (overData?.type === 'task' && overData.task?.id) {
            setHoverTaskId(overData.task.id)
            if (shiftPressed) {
                setHoverMode('subtask')
            } else {
                setHoverMode(computeReorderMode(active, over))
            }
            return
        }

        if (overData?.type === 'subtask' && overData.subtask?.id) {
            const subId = overData.subtask.id
            for (const col of sorted) {
                const parent = col.tasks.find(t => (t.subtasks || []).some(st => st.id === subId))
                if (parent) {
                    setHoverTaskId(parent.id)
                    setHoverMode('subtask')
                    return
                }
            }
            setHoverTaskId(null)
            setHoverMode(null)
            return
        }

        setHoverTaskId(null)
        setHoverMode(null)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)
        setActiveSubtask(null)
        setActiveColumn(null)
        setHoverTaskId(null)
        setHoverMode(null)
        if (!over) return

        const activeData = active.data.current
        const overData = over.data.current

        // === COLUMN reorder ===
        if (activeData?.type === 'column') {
            if (!reorderMode) return
            const activeId = String(active.id).replace('col-', '')
            const overIdRaw = String(over.id)
            const overId = overIdRaw.startsWith('col-') ? overIdRaw.replace('col-', '') : overIdRaw
            if (activeId === overId) return

            const oldIndex = sorted.findIndex(c => String(c.statusId) === activeId)
            const newIndex = sorted.findIndex(c => String(c.statusId) === overId)
            if (oldIndex === -1 || newIndex === -1) return

            const reordered = arrayMove(sorted, oldIndex, newIndex)
            setLocalColumns(reordered)

            try {
                await Promise.all(
                    reordered.map((c, idx) =>
                        statusesApi.update(boardId, c.statusId, { position: idx })
                    )
                )
                onColumnsMoved && onColumnsMoved()
            } catch (err) {
                console.error('Column move failed:', err)
                setLocalColumns(columns)
                onColumnsMoved && onColumnsMoved()
            }
            return
        }

        // === SUBTASK drag ===
        if (activeData?.type === 'subtask') {
            const subtaskId = activeData.subtask.id

            if (overData?.type === 'task' && overData.task?.id) {
                if (overData.task.id === subtaskId) return
                if (shiftPressed) {
                    try {
                        await tasksApi.clearParent(subtaskId)
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Не удалось сделать задачей')
                        onTaskMoved && onTaskMoved()
                    }
                } else {
                    try {
                        await tasksApi.setParent(subtaskId, overData.task.id)
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Не удалось переместить')
                        onTaskMoved && onTaskMoved()
                    }
                }
                return
            }

            if (overData?.type === 'subtask' && overData.subtask?.id) {
                const targetSubId = overData.subtask.id
                if (targetSubId === subtaskId) return
                let parentTaskId = null
                for (const col of sorted) {
                    const parent = col.tasks.find(t => (t.subtasks || []).some(st => st.id === targetSubId))
                    if (parent) { parentTaskId = parent.id; break }
                }
                if (parentTaskId) {
                    try {
                        await tasksApi.setParent(subtaskId, parentTaskId)
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Не удалось переместить')
                        onTaskMoved && onTaskMoved()
                    }
                }
                return
            }

            const overColumnId = getColumnIdFromOver(over)
            if (overColumnId !== null) {
                if (shiftPressed) {
                    try {
                        await tasksApi.clearParent(subtaskId)
                        await tasksApi.update(subtaskId, { statusId: overColumnId })
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Не удалось сделать задачей')
                        onTaskMoved && onTaskMoved()
                    }
                } else {
                    try {
                        await tasksApi.update(subtaskId, { statusId: overColumnId })
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Не удалось переместить')
                        onTaskMoved && onTaskMoved()
                    }
                }
                return
            }

            return
        }

        // === TASK drag ===
        if (activeData?.type !== 'task') return
        if (reorderMode) return

        const activeTaskId = active.id

        if (overData?.type === 'task' && overData.task?.id) {
            const overTaskId = overData.task.id
            if (overTaskId === activeTaskId) return

            if (shiftPressed) {
                try {
                    await tasksApi.setParent(activeTaskId, overTaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Не удалось сделать подзадачей')
                    onTaskMoved && onTaskMoved()
                }
                return
            }

            const overColumn = findColumnByTaskId(overTaskId)
            if (!overColumn) return

            const overIndex = overColumn.tasks.findIndex(t => t.id === overTaskId)
            if (overIndex === -1) return

            const mode = computeReorderMode(active, over)
            const newPosition = mode === 'above' ? overIndex : overIndex + 1

            try {
                await tasksApi.move(activeTaskId, {
                    statusId: overColumn.statusId,
                    position: newPosition,
                })
                onTaskMoved && onTaskMoved()
            } catch (err) {
                console.error('Reorder failed:', err)
                onTaskMoved && onTaskMoved()
            }
            return
        }

        if (overData?.type === 'subtask' && overData.subtask?.id) {
            const targetSubId = overData.subtask.id
            let parentTaskId = null
            for (const col of sorted) {
                const parent = col.tasks.find(t => (t.subtasks || []).some(st => st.id === targetSubId))
                if (parent) { parentTaskId = parent.id; break }
            }
            if (parentTaskId && parentTaskId !== activeTaskId) {
                try {
                    await tasksApi.setParent(activeTaskId, parentTaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Не удалось сделать подзадачей')
                    onTaskMoved && onTaskMoved()
                }
            }
            return
        }

        const overColumnId = getColumnIdFromOver(over)
        if (overColumnId !== null) {
            const overColumn = sorted.find(c => c.statusId === overColumnId)
            if (!overColumn) return

            try {
                await tasksApi.move(activeTaskId, {
                    statusId: overColumn.statusId,
                    position: overColumn.tasks.length,
                })
                onTaskMoved && onTaskMoved()
            } catch (err) {
                console.error('Move failed:', err)
                onTaskMoved && onTaskMoved()
            }
        }
    }

    const getColumnIdFromOver = (over) => {
        const overData = over.data?.current
        if (overData?.statusId) return overData.statusId
        const idStr = String(over.id)
        if (idStr.startsWith('column-')) {
            return Number(idStr.replace('column-', ''))
        }
        return null
    }

    const columnIds = sorted.map(c => `col-${c.statusId}`)

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                <div className={`kanban ${reorderMode ? 'kanban--reorder' : ''}`}>
                    {sorted.map(col => (
                        <SortableKanbanColumn
                            key={col.statusId}
                            column={col}
                            projectId={projectId}
                            reorderMode={reorderMode}
                            doneStatusId={doneStatusId}
                            activeStatusId={activeStatusId}
                            hoverTaskId={hoverTaskId}
                            hoverMode={hoverMode}
                            onAddTask={onAddTask}
                            onOpenTask={onOpenTask}
                            onToggleDone={onToggleDone}
                            onTaskMoved={onTaskMoved}
                            onOpenAttachments={onOpenAttachments}
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
                    <div style={{ width: 256 }}>
                        <TaskCard task={activeTask} />
                    </div>
                ) : activeSubtask ? (
                    <div className="subtask-mini" style={{ width: 240 }}>
                        <span className="subtask-mini__check" />
                        <span className="subtask-mini__title">{activeSubtask.title}</span>
                    </div>
                ) : activeColumn ? (
                    <div style={{ width: 280, opacity: 0.9 }}>
                        <div
                            className="kanban-col"
                            style={{
                                '--accent': activeColumn.accentCode
                                    ? `var(--accent-${activeColumn.accentCode})`
                                    : 'var(--primary)',
                            }}
                        >
                            <div
                                className="kanban-col__head"
                                style={{
                                    borderBottomColor: activeColumn.accentCode
                                        ? `var(--accent-${activeColumn.accentCode})`
                                        : 'var(--primary)',
                                }}
                            >
                                <span className="kanban-col__drag">⋮⋮</span>
                                <span
                                    className="kanban-col__title"
                                    style={{
                                        color: activeColumn.accentCode
                                            ? `var(--accent-${activeColumn.accentCode})`
                                            : 'var(--primary)',
                                    }}
                                >
                                    {activeColumn.title}
                                </span>
                                <span className="kanban-col__count">{activeColumn.count}</span>
                            </div>
                            <div className="kanban-col__body" style={{ minHeight: 60 }} />
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}