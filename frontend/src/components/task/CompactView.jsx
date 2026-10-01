import { useState, useEffect, useMemo } from 'react'
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
import Subtask from './Subtask'
import InlineEdit from '../common/InlineEdit'
import DetailTextEditor from './DetailTextEditor'
import { formatDeadline } from '../../utils/format'
import { sortTasks, isDone as checkIsDone } from '../../utils/sortTasks'
import { useAuth } from '../../context/AuthContext'
import useT from '../../hooks/useT'
import { localizeStatusTitle } from '../../utils/statusNames'

function SortableCompactTask({
                                 task, doneStatusId, activeStatusId,
                                 isDropOver, dropMode,
                                 onOpenTask, onToggleDone, onTaskMoved, onOpenAttachments,
                                 onHover,
                                 disabled,
                             }) {
    const t = useT()
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

    const isDone = checkIsDone(task)

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
        const subDone = checkIsDone(subtask)
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
        let full = fullTask
        const needReload = !full
            || (full.attachments?.length || 0) < (task.attachmentNames?.length || 0)
        if (needReload) {
            try {
                const { data } = await tasksApi.get(task.id)
                full = data
                setFullTask(data)
            } catch {
                return
            }
        }
        if (!full?.attachments?.length) return
        onOpenAttachments && onOpenAttachments(task.id, full.attachments)
    }

    const saveTitle = async (newTitle) => {
        await tasksApi.update(task.id, { title: newTitle })
        onTaskMoved && onTaskMoved()
    }

    const saveDescription = async (newDesc) => {
        await tasksApi.update(task.id, { description: newDesc })
        setFullTask(prev => prev ? { ...prev, description: newDesc } : prev)
    }

    const wrapperClass = [
        'compact-task-wrap',
        isDragging ? 'compact-task-wrap--dragging' : '',
        isDropOver ? 'compact-task-wrap--drop-over' : '',
        isDropOver && dropMode ? `compact-task-wrap--drop-${dropMode}` : '',
    ].filter(Boolean).join(' ')

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={wrapperClass}
            onMouseEnter={() => onHover && onHover(task.id)}
            onMouseLeave={() => onHover && onHover(null)}
        >
            <div
                className="compact-task"
                style={{ '--accent': accent }}
                onClick={handleToggleExpand}
            >
                <button
                    className={`compact-task__check ${isDone ? 'compact-task__check--done' : ''}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleDone && onToggleDone(task.id, isDone)
                    }}
                />

                <div className="compact-task__main">
                    <div className="compact-task__row-top">
                        <InlineEdit
                            value={task.title}
                            className="compact-task__title compact-task__title-text"
                            inputClassName="input compact-task__title-input"
                            onSave={saveTitle}
                            title={t.edit}
                        />
                        {task.priority > 0 && (
                            <span className="compact-task__priority task-card__priority--big">
                                {task.priority === 2 ? '❗' : '⚡'}
                            </span>
                        )}
                    </div>

                    {task.deadline && (
                        <div className="compact-task__deadline-row">
                            <span className="compact-task__deadline-inline">
                                📅 {formatDeadline(task.deadline)}
                            </span>
                        </div>
                    )}

                    {task.tags && task.tags.length > 0 && (
                        <div className="compact-task__tags-row">
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
                        <div className="compact-task__subtask-count">
                            {task.subtaskDone}/{task.subtaskTotal}
                        </div>
                    )}

                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="compact-task__subtasks" style={{ '--accent': accent }}>
                            {task.subtasks.map(st => (
                                <Subtask
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

                <div className="compact-task__actions">
                    {task.attachmentNames?.length > 0 && (
                        <span
                            className="compact-task__attach"
                            title={`${t.attachmentsLabel}: ${task.attachmentNames.length}`}
                        >📎</span>
                    )}
                    <button
                        className="compact-task__edit"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleEdit}
                        title={t.edit}
                    >
                        ✎
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="compact-task__details" onClick={(e) => e.stopPropagation()}>
                    {loadingFull && (
                        <div className="compact-task__details-loading">{t.loading}</div>
                    )}
                    {fullTask && (
                        <>
                            <div>
                                <div className="compact-task__details-label">{t.taskDescriptionLabel}:</div>
                                <DetailTextEditor
                                    value={fullTask.description || ''}
                                    onSave={saveDescription}
                                    placeholder={t.addDescription}
                                    title={t.edit}
                                />
                            </div>
                            {fullTask.attachments && fullTask.attachments.length > 0 && (
                                <div className="compact-task__details-row">
                                    <span className="compact-task__details-label">{t.attachmentsLabel}:</span>
                                    <span
                                        className="compact-task__details-attachments"
                                        onClick={handleOpenAttachments}
                                        title={t.open}
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

function SortableCompactGroup({
                                  col,
                                  isCollapsed,
                                  onToggle,
                                  sortMode,
                                  sortDir,
                                  reorderMode,
                                  doneStatusId,
                                  activeStatusId,
                                  hoverTaskId,
                                  hoverMode,
                                  onOpenTask,
                                  onAddTask,
                                  onToggleDone,
                                  onTaskMoved,
                                  onOpenAttachments,
                                  onHover,
                              }) {
    const t = useT()
    const { user } = useAuth()
    const lang = user?.locale?.language || 'ru'
    const displayTitle = localizeStatusTitle(col.title, lang)

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
            className={`compact-group ${isDragging ? 'compact-group--dragging' : ''}`}
        >
            <div className="compact-group__head">
                {reorderMode && (
                    <span
                        className="compact-group__drag"
                        {...attributes}
                        {...listeners}
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
                <span className="compact-group__title">{displayTitle}</span>
                <span className="compact-group__count">{col.count}</span>
            </div>

            {!isCollapsed && (
                <div className="compact-group__body">
                    {tasks.length === 0 ? (
                        <div className="compact-group__empty">{t.emptyColumn}</div>
                    ) : (
                        <SortableContext
                            items={tasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {tasks.map(t => (
                                <SortableCompactTask
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
                                    onHover={onHover}
                                    disabled={reorderMode}
                                />
                            ))}
                        </SortableContext>
                    )}

                    {!reorderMode && (
                        <button
                            className="compact-group__add"
                            onClick={(e) => {
                                e.stopPropagation()
                                onAddTask && onAddTask(col.statusId)
                            }}
                        >
                            {t.addTask}
                        </button>
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
                                        doneStatusId,
                                        activeStatusId,
                                        activeStatuses,
                                        onOpenTask,
                                        onAddTask,
                                        onAddStatus,
                                        onToggleDone,
                                        onTaskMoved,
                                        onColumnsMoved,
                                        onOpenAttachments,
                                        sortMode,
                                        sortDir,
                                        onHover,
                                    }) {
    const t = useT()
    const [collapsed, setCollapsed] = useState({})
    const [activeTask, setActiveTask] = useState(null)
    const [activeSubtask, setActiveSubtask] = useState(null)
    const [activeGroup, setActiveGroup] = useState(null)
    const [localOrder, setLocalOrder] = useState(null)
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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const visibleColumns = useMemo(() => {
        const base = localOrder || columns
        if (!activeStatuses || activeStatuses.length === 0) return base
        return base.filter(c => activeStatuses.includes(c.statusId))
    }, [columns, localOrder, activeStatuses])

    const toggle = (statusId) => {
        setCollapsed(prev => ({ ...prev, [statusId]: !prev[statusId] }))
    }

    const handleDragStart = (event) => {
        const { active } = event
        const data = active.data.current
        if (data?.type === 'task') setActiveTask(data.task)
        if (data?.type === 'subtask') setActiveSubtask(data.subtask)
        if (data?.type === 'group') setActiveGroup(data.column)
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
            for (const col of visibleColumns) {
                for (const t of col.tasks) {
                    if ((t.subtasks || []).some(st => st.id === subId)) {
                        setHoverTaskId(t.id)
                        setHoverMode('subtask')
                        return
                    }
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
        setActiveGroup(null)
        setHoverTaskId(null)
        setHoverMode(null)
        if (!over) return

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
                        alert(err.response?.data?.message || 'Error')
                        onTaskMoved && onTaskMoved()
                    }
                } else {
                    try {
                        await tasksApi.setParent(subtaskId, overData.task.id)
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Error')
                        onTaskMoved && onTaskMoved()
                    }
                }
                return
            }

            if (overData?.type === 'subtask' && overData.subtask?.id) {
                const targetSubId = overData.subtask.id
                if (targetSubId === subtaskId) return
                let parentTaskId = null
                for (const col of visibleColumns) {
                    for (const t of col.tasks) {
                        if ((t.subtasks || []).some(st => st.id === targetSubId)) {
                            parentTaskId = t.id
                            break
                        }
                    }
                    if (parentTaskId) break
                }
                if (parentTaskId) {
                    try {
                        await tasksApi.setParent(subtaskId, parentTaskId)
                        onTaskMoved && onTaskMoved()
                    } catch (err) {
                        alert(err.response?.data?.message || 'Error')
                        onTaskMoved && onTaskMoved()
                    }
                }
                return
            }

            if (overData?.type === 'group' || String(over.id).startsWith('group-')) {
                const statusId = overData?.statusId
                    || Number(String(over.id).replace('group-', ''))
                if (statusId) {
                    if (shiftPressed) {
                        try {
                            await tasksApi.clearParent(subtaskId)
                            await tasksApi.update(subtaskId, { statusId })
                            onTaskMoved && onTaskMoved()
                        } catch (err) {
                            alert(err.response?.data?.message || 'Error')
                            onTaskMoved && onTaskMoved()
                        }
                    } else {
                        try {
                            await tasksApi.update(subtaskId, { statusId })
                            onTaskMoved && onTaskMoved()
                        } catch (err) {
                            alert(err.response?.data?.message || 'Error')
                            onTaskMoved && onTaskMoved()
                        }
                    }
                    return
                }
            }

            if (shiftPressed) {
                try {
                    await tasksApi.clearParent(subtaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Error')
                    onTaskMoved && onTaskMoved()
                }
                return
            }

            return
        }

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

        if (overData?.type === 'task' && overData.task?.id) {
            const overTaskId = overData.task.id
            if (overTaskId === active.id) return

            if (shiftPressed) {
                try {
                    await tasksApi.setParent(active.id, overTaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Error')
                    onTaskMoved && onTaskMoved()
                }
                return
            }

            const overColumn = visibleColumns.find(c => c.tasks.some(t => t.id === overTaskId))
            if (!overColumn) return

            const overIndex = overColumn.tasks.findIndex(t => t.id === overTaskId)
            const mode = computeReorderMode(active, over)
            const newPosition = mode === 'above' ? overIndex : overIndex + 1

            try {
                await tasksApi.move(active.id, {
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
            for (const col of visibleColumns) {
                for (const t of col.tasks) {
                    if ((t.subtasks || []).some(st => st.id === targetSubId)) {
                        parentTaskId = t.id
                        break
                    }
                }
                if (parentTaskId) break
            }
            if (parentTaskId && parentTaskId !== active.id) {
                try {
                    await tasksApi.setParent(active.id, parentTaskId)
                    onTaskMoved && onTaskMoved()
                } catch (err) {
                    alert(err.response?.data?.message || 'Error')
                    onTaskMoved && onTaskMoved()
                }
            }
            return
        }

        const activeTaskId = active.id
        let overStatusId = null

        if (overData?.type === 'group' || String(over.id).startsWith('group-')) {
            overStatusId = overData?.statusId
                || Number(String(over.id).replace('group-', ''))
        }

        if (!overStatusId) return

        const targetCol = visibleColumns.find(c => c.statusId === overStatusId)
        if (!targetCol) return

        try {
            await tasksApi.move(activeTaskId, {
                statusId: targetCol.statusId,
                position: targetCol.tasks.length,
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
                    className="btn btn-primary"
                    onClick={() => onAddTask && onAddTask()}
                >
                    {t.addTask}
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
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
                            doneStatusId={doneStatusId}
                            activeStatusId={activeStatusId}
                            hoverTaskId={hoverTaskId}
                            hoverMode={hoverMode}
                            onOpenTask={onOpenTask}
                            onAddTask={onAddTask}
                            onToggleDone={onToggleDone}
                            onTaskMoved={onTaskMoved}
                            onOpenAttachments={onOpenAttachments}
                            onHover={onHover}
                        />
                    ))}
                </SortableContext>

                {!reorderMode && onAddStatus && (
                    <button
                        type="button"
                        className="compact-group__add-status"
                        onClick={onAddStatus}
                    >
                        {t.addStatus}
                    </button>
                )}

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
                    ) : activeSubtask ? (
                        <div className="subtask-mini" style={{ width: 240 }}>
                            <span className="subtask-mini__check" />
                            <span className="subtask-mini__title">{activeSubtask.title}</span>
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