import { useState, useEffect } from 'react'
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
import DraggableSubtask from './DraggableSubtask'

function formatDeadline(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
    return hasTime
        ? d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : d.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
}

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

function SortableTaskRow({
                             task, doneStatusId, activeStatusId,
                             isDropOver, dropMode,
                             onOpenTask, onToggleDone, onTaskMoved, onOpenAttachments,
                         }) {
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

    const handleToggleExpand = async (e) => {
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

    const handleEdit = (e) => {
        e.stopPropagation()
        onOpenTask && onOpenTask(task.id)
    }

    const handleSubtaskToggleDone = async (subtask) => {
        const subDone = subtask.statusCategoryCode === 'DONE'
            || subtask.statusCode === 'DONE'
            || subtask.statusCategoryCode === 'CANCELLED'

        const targetStatusId = subDone ? activeStatusId : doneStatusId
        if (!targetStatusId) return

        try {
            await tasksApi.update(subtask.id, { statusId: targetStatusId })
            onTaskMoved && onTaskMoved()
        } catch (err) {
            console.error('Subtask check failed:', err)
        }
    }

    const handleOpenAttachments = async (e) => {
        e.stopPropagation()
        let t = fullTask
        const needReload = !t
            || (t.attachments?.length || 0) < (task.attachmentNames?.length || 0)
        if (needReload) {
            try {
                const { data } = await tasksApi.get(task.id)
                t = data
                setFullTask(data)
            } catch {
                return
            }
        }
        if (!t?.attachments?.length) return
        onOpenAttachments && onOpenAttachments(task.id, t.attachments)
    }

    const wrapperClass = [
        'word-list__item-wrap',
        isDragging ? 'word-list__item-wrap--dragging' : '',
        isDropOver ? 'word-list__item-wrap--drop-over' : '',
        isDropOver && dropMode ? `word-list__item-wrap--drop-${dropMode}` : '',
    ].filter(Boolean).join(' ')

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={wrapperClass}
        >
            <div
                className={`word-list__item ${isDone ? 'word-list__item--done' : ''}`}
                style={{ '--accent': accent }}
                onClick={handleToggleExpand}
            >
                <button
                    className={`word-list__check ${isDone ? 'word-list__check--done' : ''}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleDone && onToggleDone(task.id, isDone)
                    }}
                />

                <div className="word-list__body">
                    <div className="word-list__row-top">
                        <div className="word-list__title">{task.title}</div>
                        {task.priority > 0 && (
                            <span className="word-list__priority task-card__priority--big">
                                {task.priority === 2 ? '❗' : '⚡'}
                            </span>
                        )}
                    </div>

                    {task.deadline && (
                        <div className="word-list__deadline-row">
                            <span className="word-list__deadline-inline">
                                📅 {formatDeadline(task.deadline)}
                            </span>
                        </div>
                    )}

                    {task.tags && task.tags.length > 0 && (
                        <div className="word-list__tags-row">
                            {task.tags.map(tag => (
                                <span
                                    key={tag.id}
                                    className="task-tag"
                                    style={{ background: `var(--accent-${tag.accentCode || 'gray'})` }}
                                    title={tag.title}
                                >
                                    {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                                    {tag.title}
                                </span>
                            ))}
                        </div>
                    )}

                    {task.subtaskTotal > 0 && (
                        <div className="word-list__subtask-count">
                            {task.subtaskDone}/{task.subtaskTotal}
                        </div>
                    )}

                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="word-list__subtasks" style={{ '--accent': accent }}>
                            {task.subtasks.map(st => (
                                <DraggableSubtask
                                    key={st.id}
                                    subtask={st}
                                    onClick={onOpenTask}
                                    onToggleDone={handleSubtaskToggleDone}
                                    onTaskMoved={onTaskMoved}
                                    onOpenAttachments={onOpenAttachments}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="word-list__actions">
                    {task.attachmentNames?.length > 0 && (
                        <span
                            className="word-list__attach"
                            title={`Вложений: ${task.attachmentNames.length}`}
                        >📎</span>
                    )}
                    <button
                        className="word-list__edit"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleEdit}
                        title="Редактировать"
                    >✎</button>
                </div>
            </div>

            {expanded && (
                <div className="word-list__details" onClick={(e) => e.stopPropagation()}>
                    {loadingFull && (
                        <div className="word-list__details-loading">Загрузка...</div>
                    )}
                    {fullTask && (
                        <>
                            {fullTask.description && fullTask.description.trim() && (
                                <div>
                                    <div className="word-list__details-label">Описание:</div>
                                    <div className="word-list__details-description">
                                        {fullTask.description}
                                    </div>
                                </div>
                            )}
                            {fullTask.attachments && fullTask.attachments.length > 0 && (
                                <div className="word-list__details-row">
                                    <span className="word-list__details-label">Вложения:</span>
                                    <span
                                        className="word-list__details-attachments"
                                        onClick={handleOpenAttachments}
                                        title="Открыть вложения"
                                    >
                                        {fullTask.attachments[0].originalName}
                                        {fullTask.attachments.length > 1 && (
                                            <> +{fullTask.attachments.length - 1}</>
                                        )}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default function ListView({
                                     columns,
                                     projectId,
                                     doneStatusId,
                                     activeStatusId,
                                     onOpenTask,
                                     onAddTask,
                                     onToggleDone,
                                     onTaskMoved,
                                     onOpenAttachments,
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
    const [activeSubtask, setActiveSubtask] = useState(null)
    const [hoverTaskId, setHoverTaskId] = useState(null)
    const [hoverMode, setHoverMode] = useState(null)
    const [shiftPressed, setShiftPressed] = useState(false)

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

    const sorted = localOrder || sortTasks(allTasks, sortMode, sortDir)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const handleDragStart = (event) => {
        const { active } = event
        const data = active.data.current
        if (data?.type === 'task') setActiveTask(data.task)
        if (data?.type === 'subtask') setActiveSubtask(data.subtask)
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
            for (const t of sorted) {
                if ((t.subtasks || []).some(st => st.id === subId)) {
                    setHoverTaskId(t.id)
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
        setHoverTaskId(null)
        setHoverMode(null)
        if (!over) {
            setLocalOrder(null)
            return
        }

        const activeData = active.data.current
        const overData = over.data.current

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
                for (const t of sorted) {
                    if ((t.subtasks || []).some(st => st.id === targetSubId)) {
                        parentTaskId = t.id
                        break
                    }
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

            if (shiftPressed) {
                try {
                    await tasksApi.clearParent(subtaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Не удалось сделать задачей')
                    onTaskMoved && onTaskMoved()
                }
                return
            }

            return
        }

        if (activeData?.type !== 'task') return

        if (overData?.type === 'task' && overData.task?.id) {
            const overTaskId = overData.task.id
            if (overTaskId === active.id) {
                setLocalOrder(null)
                return
            }

            if (shiftPressed) {
                try {
                    await tasksApi.setParent(active.id, overTaskId)
                    onTaskMoved && onTaskMoved()
                    setLocalOrder(null)
                } catch (err) {
                    alert(err.response?.data?.message || 'Не удалось сделать подзадачей')
                    setLocalOrder(null)
                }
                return
            }

            const oldIndex = sorted.findIndex(t => t.id === active.id)
            const overIndex = sorted.findIndex(t => t.id === overTaskId)
            if (oldIndex === -1 || overIndex === -1) {
                setLocalOrder(null)
                return
            }

            const mode = computeReorderMode(active, over)
            const targetIndex = mode === 'above'
                ? (oldIndex < overIndex ? overIndex - 1 : overIndex)
                : (oldIndex < overIndex ? overIndex : overIndex + 1)

            const reordered = arrayMove(sorted, oldIndex, targetIndex)
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
            return
        }

        if (overData?.type === 'subtask' && overData.subtask?.id) {
            const targetSubId = overData.subtask.id
            let parentTaskId = null
            for (const t of sorted) {
                if ((t.subtasks || []).some(st => st.id === targetSubId)) {
                    parentTaskId = t.id
                    break
                }
            }
            if (parentTaskId && parentTaskId !== active.id) {
                try {
                    await tasksApi.setParent(active.id, parentTaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Не удалось сделать подзадачей')
                    onTaskMoved && onTaskMoved()
                }
            }
            return
        }

        if (active.id === over.id) {
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
                    <div className="word-list__count">
                        {sorted.length} {plural(sorted.length, ['задача', 'задачи', 'задач'])}
                    </div>
                    <button
                        className="btn btn-primary"
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
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                            <div className="word-list__list">
                                {sorted.map(t => (
                                    <SortableTaskRow
                                        key={t.id}
                                        task={t}
                                        doneStatusId={doneStatusId}
                                        activeStatusId={activeStatusId}
                                        isDropOver={hoverTaskId === t.id}
                                        dropMode={hoverTaskId === t.id ? hoverMode : null}
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
                                <div style={{ width: 600 }}>
                                    <div className="word-list__item">
                                        <div className="word-list__body">
                                            <div className="word-list__title">{activeTask.title}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeSubtask ? (
                                <div className="subtask-mini" style={{ width: 240 }}>
                                    <span className="subtask-mini__check" />
                                    <span className="subtask-mini__title">{activeSubtask.title}</span>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>
        </div>
    )
}

function plural(n, forms) {
    const mod10 = n % 10, mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}