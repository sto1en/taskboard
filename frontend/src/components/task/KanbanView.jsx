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

export default function KanbanView({
                                       columns,
                                       projectId,
                                       boardId,
                                       reorderMode,
                                       onTaskMoved,
                                       onColumnsMoved,
                                       activeStatuses,
                                       onAddTask,
                                       onTaskClick,
                                       onToggleDone,
                                       sortMode,
                                       sortDir,
                                   }) {
    const [activeTask, setActiveTask] = useState(null)
    const [activeColumn, setActiveColumn] = useState(null)

    // Локальный порядок колонок (оптимистично)
    const [localColumns, setLocalColumns] = useState(columns)

    // Синхронизация с родителем при изменении columns
    useEffect(() => {
        setLocalColumns(columns)
    }, [columns])

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
        if (data?.type === 'column') setActiveColumn(data.column)
    }

    const handleDragOver = (event) => {
        const { active, over } = event
        if (!over) return

        const activeData = active.data.current
        const overData = over.data.current

        // Визуальное перемещение колонки на лету
        if (activeData?.type === 'column' && reorderMode) {
            const activeId = String(active.id).replace('col-', '')
            const overIdRaw = String(over.id)
            const overId = overIdRaw.startsWith('col-')
                ? overIdRaw.replace('col-', '')
                : overIdRaw
            if (activeId === overId) return

            setLocalColumns(prev => {
                const oldIndex = prev.findIndex(c => String(c.statusId) === activeId)
                const newIndex = prev.findIndex(c => String(c.statusId) === overId)
                if (oldIndex === -1 || newIndex === -1) return prev
                return arrayMove(prev, oldIndex, newIndex)
            })
            return
        }

        // Визуальное перемещение задачи между колонками на лету
        if (activeData?.type === 'task' && !reorderMode) {
            const activeTaskId = active.id
            let activeCol = null
            let activeIdx = -1
            for (const col of localColumns) {
                const idx = col.tasks.findIndex(t => t.id === activeTaskId)
                if (idx !== -1) {
                    activeCol = col
                    activeIdx = idx
                    break
                }
            }
            if (!activeCol) return

            // Куда
            let overCol = null
            let overIdx = -1
            const overIdRaw = String(over.id)
            if (overIdRaw.startsWith('column-')) {
                const statusId = Number(overIdRaw.replace('column-', ''))
                overCol = localColumns.find(c => c.statusId === statusId)
                overIdx = overCol ? overCol.tasks.length : -1
            } else if (overData?.type === 'task') {
                for (const col of localColumns) {
                    const idx = col.tasks.findIndex(t => t.id === over.id)
                    if (idx !== -1) {
                        overCol = col
                        overIdx = idx
                        break
                    }
                }
            }
            if (!overCol) return

            if (activeCol.statusId === overCol.statusId && activeIdx === overIdx) return

            setLocalColumns(prev => {
                const next = prev.map(c => ({ ...c, tasks: [...c.tasks] }))
                const ac = next.find(c => c.statusId === activeCol.statusId)
                const oc = next.find(c => c.statusId === overCol.statusId)
                const [moved] = ac.tasks.splice(activeIdx, 1)
                if (oc) {
                    oc.tasks.splice(overIdx, 0, moved)
                }
                return next
            })
        }
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)
        setActiveColumn(null)
        if (!over) return

        const activeData = active.data.current

        // ===== DRAG КОЛОНКИ =====
        if (activeData?.type === 'column') {
            if (!reorderMode) return

            // Локальный порядок уже применён в handleDragOver — просто сохраняем
            const orderedIds = localColumns.map(c => c.statusId)

            try {
                await Promise.all(
                    orderedIds.map((statusId, idx) =>
                        statusesApi.update(boardId, statusId, { position: idx })
                    )
                )
                onColumnsMoved && onColumnsMoved()
            } catch (err) {
                console.error('Column move failed:', err)
                // откат
                setLocalColumns(columns)
                onColumnsMoved && onColumnsMoved()
            }
            return
        }

        // ===== DRAG ЗАДАЧИ =====
        if (activeData?.type !== 'task') return
        if (reorderMode) return

        // Найти финальную позицию по локальному состоянию
        let targetCol = null
        let targetIdx = -1
        for (const col of localColumns) {
            const idx = col.tasks.findIndex(t => t.id === active.id)
            if (idx !== -1) {
                targetCol = col
                targetIdx = idx
                break
            }
        }
        if (!targetCol) return

        try {
            await tasksApi.move(active.id, {
                statusId: targetCol.statusId,
                position: targetIdx,
            })
            onTaskMoved && onTaskMoved()
        } catch (err) {
            console.error('Move failed:', err)
            setLocalColumns(columns)
            onTaskMoved && onTaskMoved()
        }
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
                            onAddTask={onAddTask}
                            onTaskClick={onTaskClick}
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
                    <div style={{ width: 256 }}>
                        <TaskCard task={activeTask} />
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