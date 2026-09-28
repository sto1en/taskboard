import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import KanbanColumn from '../Board/KanbanColumn'
import TaskCard from './TaskCard'
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

export default function KanbanView({
                                       columns,
                                       projectId,
                                       onTaskMoved,
                                       activeStatuses,
                                       onAddTask,
                                       onTaskClick,
                                       onToggleDone,
                                       sortMode,
                                       sortDir,
                                   }) {
    const [activeTask, setActiveTask] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const visible = activeStatuses.length > 0
        ? columns.filter(c => activeStatuses.includes(c.statusId))
        : columns

    const sorted = visible.map(col => ({
        ...col,
        tasks: sortTasks(col.tasks, sortMode, sortDir),
    }))

    const findColumnByTaskId = (taskId) => {
        for (const col of sorted) {
            if (col.tasks.some(t => t.id === taskId)) return col
        }
        return null
    }

    const handleDragStart = (event) => {
        const { active } = event
        const task = active.data.current?.task
        if (task) setActiveTask(task)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)
        if (!over) return

        const activeColumn = findColumnByTaskId(active.id)
        const overId = over.id

        let overColumn
        if (typeof overId === 'string' && overId.startsWith('column-')) {
            const statusId = Number(overId.replace('column-', ''))
            overColumn = sorted.find(c => c.statusId === statusId)
        } else {
            overColumn = findColumnByTaskId(overId)
        }

        if (!activeColumn || !overColumn) return

        let newPosition = 0
        if (typeof overId === 'string' && overId.startsWith('column-')) {
            newPosition = overColumn.tasks.length
        } else {
            const overIndex = overColumn.tasks.findIndex(t => t.id === overId)
            newPosition = overIndex >= 0 ? overIndex : overColumn.tasks.length
        }

        if (activeColumn.statusId === overColumn.statusId) {
            const oldIndex = activeColumn.tasks.findIndex(t => t.id === active.id)
            if (oldIndex === newPosition) return
        }

        try {
            await tasksApi.move(active.id, {
                statusId: overColumn.statusId,
                position: newPosition,
            })
            onTaskMoved && onTaskMoved()
        } catch (err) {
            console.error('Move failed:', err)
            onTaskMoved && onTaskMoved()
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="kanban">
                {sorted.map(col => (
                    <KanbanColumn
                        key={col.statusId}
                        column={col}
                        projectId={projectId}
                        onAddTask={onAddTask}
                        onTaskClick={onTaskClick}
                        onToggleDone={onToggleDone}
                    />
                ))}
            </div>

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
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}