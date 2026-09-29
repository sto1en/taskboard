import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    defaultDropAnimationSideEffects,
    useDroppable,
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

function SortableCompactTask({ task, onTaskClick, onToggleDone, disabled }) {
    const [expanded, setExpanded] = useState(false)
    const [fullTask, setFullTask] = useState(null)
    const [loadingFull, setLoadingFull] = useState(false)

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
        disabled,
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

    const handleExpand = async (e) => {
        e.stopPropagation()
        if (expanded) {
            setExpanded(false)
            return
        }
        setExpanded(true)
        if (!fullTask && !loadingFull) {
            setLoadingFull(true)
            try {
                const { data } = await tasksApi.get(task.id)
                setFullTask(data)
            } catch (err) {
                console.error('Failed to load full task:', err)
            } finally {
                setLoadingFull(false)
            }
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`compact-task-wrap ${isDragging ? 'compact-task-wrap--dragging' : ''}`}
        >
            <div
                className="compact-task"
                onClick={() => onTaskClick && onTaskClick(task.id)}
            >
                <button
                    className={`compact-task__check ${isDone ? 'compact-task__check--done' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleDone && onToggleDone(task.id, isDone)
                    }}
                />

                <div className="compact-task__main">
                    <div className="compact-task__title">{task.title}</div>
                    <div className="compact-task__meta">
                        {task.statusTitle && (
                            <span
                                className="compact-task__status"
                                style={{ color: accent }}
                            >
                                {task.statusTitle}
                            </span>
                        )}
                        {task.priority > 0 && (
                            <span className="compact-task__priority">
                                {task.priority === 2 ? '🔥 Срочный' : '⚡ Высокий'}
                            </span>
                        )}
                        {task.deadline && (
                            <span className="compact-task__deadline">
                                📅 {new Date(task.deadline).toLocaleString('ru-RU', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                            </span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                            <span className="compact-task__tags">
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
                    <span className="compact-task__attach" title="Есть вложения">📎</span>
                )}

                <button
                    className="compact-task__expand"
                    onClick={handleExpand}
                    title={expanded ? 'Свернуть' : 'Показать подробности'}
                >
                    {expanded ? '▲' : '▼'}
                </button>
            </div>

            {expanded && (
                <div className="compact-task__details" onClick={(e) => e.stopPropagation()}>
                    {loadingFull && (
                        <div className="compact-task__details-loading">Загрузка...</div>
                    )}
                    {fullTask && (
                        <>
                            {fullTask.description && fullTask.description.trim() && (
                                <div>
                                    <div className="compact-task__details-label">Описание:</div>
                                    <div className="compact-task__details-description">
                                        {fullTask.description}
                                    </div>
                                </div>
                            )}
                            {fullTask.deadline && (
                                <div className="compact-task__details-row">
                                    <span className="compact-task__details-label">Дедлайн:</span>
                                    <span>
                                        {new Date(fullTask.deadline).toLocaleString('ru-RU', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}
                            {fullTask.attachments && fullTask.attachments.length > 0 && (
                                <div className="compact-task__details-row">
                                    <span className="compact-task__details-label">Вложения:</span>
                                    <span>📎 {fullTask.attachments.length}</span>
                                </div>
                            )}
                            {fullTask.subtasks && fullTask.subtasks.length > 0 && (
                                <div>
                                    <div className="compact-task__details-label">
                                        Подзадачи ({fullTask.subtaskDone}/{fullTask.subtaskTotal}):
                                    </div>
                                    <div className="compact-task__subtasks">
                                        {fullTask.subtasks.map(st => {
                                            const stDone = st.statusCategoryCode === 'DONE'
                                                || st.statusCode === 'DONE'
                                                || st.statusCategoryCode === 'CANCELLED'
                                            return (
                                                <div key={st.id} className="compact-task__subtask">
                                                    <span
                                                        className={`compact-task__subtask-check ${stDone ? 'compact-task__subtask-check--done' : ''}`}
                                                    />
                                                    <span className={`compact-task__subtask-title ${stDone ? 'compact-task__subtask-title--done' : ''}`}>
                                                        {st.title}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
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
                                  reorderMode,
                                  onTaskClick,
                                  onToggleDone,
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
        disabled: !reorderMode,
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
            <div className="compact-group__head">
                {reorderMode && (
                    <span
                        className="compact-group__drag"
                        {...attributes}
                        {...listeners}
                        title="Перетащить группу"
                    >⋮⋮</span>
                )}
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
                <div className="compact-group__body" ref={setDropRef}>
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
                                    disabled={reorderMode}
                                />
                            ))}
                        </SortableContext>
                    )}
                </div>
            )}
        </div>
    )
}

export default function CompactView({
                                        columns,
                                        projectId,
                                        boardId,
                                        reorderMode,
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

        if (activeData?.type === 'group') {
            if (!reorderMode) return

            const activeId = String(active.id).replace('group-', '')
            const overIdRaw = String(over.id)
            const overId = overIdRaw.startsWith('group-')
                ? overIdRaw.replace('group-', '')
                : overIdRaw
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

        if (activeData?.type !== 'task') return
        if (reorderMode) return

        const activeTaskId = active.id

        let overStatusId = null
        let overTaskId = null

        if (overData?.type === 'group' || String(over.id).startsWith('group-')) {
            overStatusId = overData?.statusId
                || Number(String(over.id).replace('group-drop-', '').replace('group-', ''))
        } else {
            for (const col of visibleColumns) {
                if (col.tasks.some(t => t.id === over.id)) {
                    overStatusId = col.statusId
                    overTaskId = over.id
                    break
                }
            }
        }

        if (!overStatusId) return

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
        <div className={`compact-view ${reorderMode ? 'compact-view--reorder' : ''}`}>
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
                            reorderMode={reorderMode}
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
                            <div className="compact-task__main">
                                <div className="compact-task__title">{activeTask.title}</div>
                            </div>
                        </div>
                    ) : activeGroup ? (
                        <div className="compact-group" style={{ opacity: 0.9 }}>
                            <div className="compact-group__head">
                                <span className="compact-group__drag">⋮⋮</span>
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