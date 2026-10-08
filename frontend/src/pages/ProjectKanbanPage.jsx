import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { projectsApi, tasksApi, projectFiltersApi, statusesApi } from '../api/api'
import ViewSwitcher from '../components/Task/ViewSwitcher'
import SortSwitcher from '../components/Task/SortSwitcher'
import FiltersBar from '../components/Task/FiltersBar'
import KanbanView from '../components/Task/KanbanView'
import ListView from '../components/Task/ListView'
import CompactView from '../components/Task/CompactView'
import CreateTaskModal from '../components/Task/CreateTaskModal'
import CreateStatusModal from '../components/Task/CreateStatusModal'
import TaskDetailModal from '../components/Task/TaskDetailModal'
import AttachmentsModal from '../components/Task/AttachmentsModal'
import ConfirmModal from '../components/common/ConfirmModal'
import InlineEdit from '../components/common/InlineEdit'
import useHotkeys from '../hooks/useHotkeys'
import useConfirmDelete from '../hooks/useConfirmDelete'
import { useAuth } from '../context/AuthContext'

const ACCENTS = [
    'blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal',
    'navy', 'olive', 'indigo', 'violet', 'magenta', 'coral', 'amber',
    'lime', 'mint', 'cyan', 'slate', 'maroon', 'brown',
]

export default function ProjectKanbanPage() {
    const { boardId, projectId } = useParams()
    const [searchParams] = useSearchParams()
    const nav = useNavigate()
    const { user, updateUser } = useAuth()

    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

    const [project, setProject] = useState(null)
    const [kanban, setKanban] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [viewMode, setViewMode] = useState('kanban')
    const [sortMode, setSortMode] = useState('manual')
    const [sortDir, setSortDir] = useState('asc')
    const [activeStatuses, setActiveStatuses] = useState([])
    const [reorderMode, setReorderMode] = useState(false)

    const [showCreateTask, setShowCreateTask] = useState(false)
    const [showCreateStatus, setShowCreateStatus] = useState(false)
    const [presetStatusId, setPresetStatusId] = useState(null)
    const [openTaskId, setOpenTaskId] = useState(null)

    const [attachmentsToView, setAttachmentsToView] = useState(null)
    const [attachmentsTaskId, setAttachmentsTaskId] = useState(null)

    const [hoveredTaskId, setHoveredTaskId] = useState(null)
    const [colorMenu, setColorMenu] = useState(null)

    useEffect(() => {
        if (!projectId) return
        projectFiltersApi.get(projectId)
            .then(({ data }) => {
                if (data?.statusIds?.length > 0) setActiveStatuses(data.statusIds)
                else setActiveStatuses([])
                if (data?.sortMode) setSortMode(data.sortMode)
                if (data?.sortDir) setSortDir(data.sortDir)
                if (data?.viewMode) setViewMode(data.viewMode)
            })
            .catch(() => setActiveStatuses([]))
    }, [projectId])

    useEffect(() => {
        const taskFromUrl = searchParams.get('task')
        if (taskFromUrl) setOpenTaskId(Number(taskFromUrl))
    }, [searchParams])

    useEffect(() => {
        if (!projectId) return
        setLoading(true)
        setError(null)
        Promise.all([
            projectsApi.get(projectId),
            tasksApi.kanban(projectId),
        ])
            .then(([projRes, kanbanRes]) => {
                setProject(projRes.data)
                setKanban(kanbanRes.data)
            })
            .catch((err) => {
                console.error('Project load error:', err)
                setError(err.response?.data?.message || 'Ошибка загрузки')
            })
            .finally(() => setLoading(false))
    }, [projectId])

    useEffect(() => {
        if (!colorMenu) return
        const close = () => setColorMenu(null)
        window.addEventListener('click', close)
        window.addEventListener('scroll', close, true)
        return () => {
            window.removeEventListener('click', close)
            window.removeEventListener('scroll', close, true)
        }
    }, [colorMenu])

    const reloadKanban = () => {
        tasksApi.kanban(projectId).then(({ data }) => setKanban(data))
    }

    const refreshTree = () => {
        window.dispatchEvent(new Event('tree:refresh'))
    }

    const handleAddTask = (statusId) => {
        setPresetStatusId(statusId || null)
        setShowCreateTask(true)
    }

    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'task') handleAddTask(null)
        }
        window.addEventListener('hotkey:new', handler)
        return () => window.removeEventListener('hotkey:new', handler)
        // eslint-disable-next-line
    }, [])

    const handleTaskCreated = () => {
        setShowCreateTask(false)
        setPresetStatusId(null)
        reloadKanban()
        refreshTree()
    }

    const handleStatusCreated = () => {
        setShowCreateStatus(false)
        reloadKanban()
    }

    const handleToggleDone = async (taskId, isDone) => {
        const doneCol = kanban.columns.find(c => c.categoryCode === 'DONE')
        const activeCol = kanban.columns.find(c => c.categoryCode === 'ACTIVE')
        const targetStatusId = isDone ? activeCol?.statusId : doneCol?.statusId
        if (!targetStatusId) return
        try {
            await tasksApi.update(taskId, { statusId: targetStatusId })
            reloadKanban()
            refreshTree()
        } catch (err) {
            console.error('Toggle done failed:', err)
        }
    }

    const handleDuplicateTask = async (taskId) => {
        try {
            const { data: t } = await tasksApi.get(taskId)
            const { data: created } = await tasksApi.create(t.projectId, {
                title: `${t.title} (копия)`,
                description: t.description || undefined,
                statusId: t.statusId || undefined,
                priority: t.priority || undefined,
                deadline: t.deadline || undefined,
                tagIds: (t.tags || []).map(tag => tag.id),
            })
            if (t.attachments?.length) {
                for (const a of t.attachments) {
                    try { await tasksApi.attach(created.id, a.id) } catch {}
                }
            }
            reloadKanban()
            refreshTree()
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось дублировать')
        }
    }

    const findHoveredTask = () => {
        if (!hoveredTaskId || !kanban) return null
        return kanban.columns
            .flatMap(c => c.tasks)
            .find(x => x.id === hoveredTaskId) || null
    }

    const doDelete = async (taskId) => {
        try {
            await tasksApi.delete(taskId)
            reloadKanban()
            refreshTree()
            setHoveredTaskId(null)
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось удалить')
        }
    }

    const handleDeleteWithConfirm = () => {
        const t = findHoveredTask()
        if (!t) return
        requestDelete({
            kind: 'task',
            title: t.title,
            onConfirm: () => doDelete(t.id),
        })
    }

    const handleToggleCancel = async () => {
        if (!hoveredTaskId || !kanban) return
        const task = findHoveredTask()
        if (!task) return

        const isCancelled = task.statusCategoryCode === 'CANCELLED'
        const cancelledCol = kanban.columns.find(c => c.categoryCode === 'CANCELLED')
        const activeCol = kanban.columns.find(c => c.categoryCode === 'ACTIVE')

        const targetStatusId = isCancelled
            ? activeCol?.statusId
            : cancelledCol?.statusId

        if (!targetStatusId) {
            alert('Нет подходящего статуса (Отменено или В процессе)')
            return
        }

        try {
            await tasksApi.update(hoveredTaskId, { statusId: targetStatusId })
            reloadKanban()
            refreshTree()
        } catch (err) {
            console.error('Toggle cancel failed:', err)
        }
    }

    const closeTaskModal = () => {
        setOpenTaskId(null)
        if (searchParams.get('task')) {
            nav(`/boards/${boardId}/projects/${projectId}`, { replace: true })
        }
    }

    const handleOpenAttachments = (taskId, attachments) => {
        setAttachmentsTaskId(taskId)
        setAttachmentsToView(attachments)
    }

    const saveProjectTitle = async (newTitle) => {
        const { data } = await projectsApi.update(project.id, { title: newTitle })
        setProject(data)
    }

    const saveProjectDescription = async (newDesc) => {
        const { data } = await projectsApi.update(project.id, { description: newDesc })
        setProject(data)
    }

    const handleTogglePin = async () => {
        try {
            const { data } = await projectsApi.update(project.id, {
                isPinned: !project.isPinned,
            })
            setProject(data)
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const handleEditStatus = async (column, newTitle) => {
        try {
            await statusesApi.update(boardId, column.statusId, { title: newTitle })
            reloadKanban()
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const handleRecolorStatus = (column, e) => {
        setColorMenu({
            column,
            x: e.clientX,
            y: e.clientY,
        })
    }

    const applyStatusColor = async (colorCode) => {
        if (!colorMenu) return
        try {
            await statusesApi.update(boardId, colorMenu.column.statusId, {
                accentCode: colorCode,
            })
            reloadKanban()
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        } finally {
            setColorMenu(null)
        }
    }

    useHotkeys([
        {
            combo: 'escape',
            when: () => reorderMode,
            handler: () => setReorderMode(false),
            allowInInput: true,
        },

        { combo: 'e', handler: () => { if (hoveredTaskId) setOpenTaskId(hoveredTaskId) } },

        {
            combo: 'space',
            allowInInput: false,
            handler: () => {
                if (!hoveredTaskId || !kanban) return
                const t = kanban.columns
                    .flatMap(c => c.tasks)
                    .find(x => x.id === hoveredTaskId)
                if (!t) return

                const isDone =
                    t.statusCategoryCode === 'DONE' ||
                    t.statusCode === 'DONE' ||
                    t.statusCategoryCode === 'CANCELLED'

                handleToggleDone(hoveredTaskId, isDone)
            },
        },

        // Delete — удалить
        {
            combo: 'delete',
            allowInInput: false,
            handler: handleDeleteWithConfirm,
        },
        // Backspace — перенести в отменённые
        {
            combo: 'backspace',
            allowInInput: false,
            handler: handleToggleCancel,
        },

        { combo: 'c', handler: () => { if (hoveredTaskId) handleDuplicateTask(hoveredTaskId) } },

        { combo: '1', handler: () => setViewMode('kanban') },
        { combo: '2', handler: () => setViewMode('list') },
        { combo: '3', handler: () => setViewMode('compact') },

        { combo: 'p', handler: () => setReorderMode(v => !v) },
    ])

    if (loading) return <div className="loading">Загрузка...</div>
    if (error) return <div className="error">{error}</div>
    if (!project || !kanban) return <div>Проект не найден</div>

    const effectiveMode = viewMode
    const doneCol = kanban.columns.find(c => c.categoryCode === 'DONE')
    const doneStatusId = doneCol?.statusId || null

    const activeCol = kanban.columns.find(c => c.categoryCode === 'ACTIVE')
    const activeStatusId = activeCol?.statusId || null

    const showReorderButton = effectiveMode === 'kanban' || effectiveMode === 'compact'

    return (
        <div className="board-detail">
            <div className="board-detail__head">
                <button
                    className="btn btn-ghost board-detail__back"
                    onClick={() => nav(`/boards/${boardId}`)}
                    title="Назад к доске"
                >
                    ← Назад
                </button>

                <div className="board-detail__title-wrap">
                    <div className="board-detail__title-row">
                        <InlineEdit
                            value={project.title}
                            className="board-detail__title board-detail__title-text"
                            inputClassName="input board-detail__title-input"
                            onSave={saveProjectTitle}
                            title="Двойной клик — редактировать название проекта"
                        />
                        <button
                            type="button"
                            className={`board-detail__pin-btn ${project.isPinned ? 'board-detail__pin-btn--active' : ''}`}
                            onClick={handleTogglePin}
                            title={project.isPinned ? 'Открепить проект' : 'Закрепить проект'}
                        >
                            📌
                        </button>
                    </div>
                    <InlineEdit
                        value={project.description || ''}
                        multiline
                        className="board-detail__subtitle"
                        inputClassName="input board-detail__subtitle-input"
                        placeholder="Двойной клик — добавить описание проекта"
                        onSave={saveProjectDescription}
                        title="Двойной клик — редактировать описание проекта"
                    />
                </div>

                <div className="board-detail__toolbar">
                    <ViewSwitcher mode={viewMode} onChange={setViewMode} />

                    <SortSwitcher
                        sortMode={sortMode}
                        sortDir={sortDir}
                        onChange={({ sortMode: sm, sortDir: sd }) => {
                            setSortMode(sm); setSortDir(sd)
                        }}
                    />

                    <FiltersBar
                        columns={kanban.columns}
                        activeStatuses={activeStatuses}
                        onStatusToggle={(id) => setActiveStatuses(prev =>
                            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        )}
                        onClear={() => setActiveStatuses([])}
                        projectId={Number(projectId)}
                    />

                    {showReorderButton && (
                        <button
                            className={`reorder-btn ${reorderMode ? 'reorder-btn--active' : ''}`}
                            onClick={() => setReorderMode(v => !v)}
                            title={reorderMode ? 'Выйти из режима перестановки' : 'Включить режим перестановки'}
                        >
                            <span className="reorder-btn__icon">{reorderMode ? '✓' : '↔'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={`board-detail__scroll ${effectiveMode === 'kanban' ? 'board-detail__scroll--kanban' : ''}`}>
                {effectiveMode === 'kanban' && (
                    <KanbanView
                        columns={kanban.columns}
                        projectId={Number(projectId)}
                        boardId={Number(boardId)}
                        reorderMode={reorderMode}
                        doneStatusId={doneStatusId}
                        activeStatusId={activeStatusId}
                        onTaskMoved={reloadKanban}
                        onColumnsMoved={reloadKanban}
                        activeStatuses={activeStatuses}
                        onAddTask={handleAddTask}
                        onAddStatus={() => setShowCreateStatus(true)}
                        onOpenTask={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onOpenAttachments={handleOpenAttachments}
                        sortMode={sortMode}
                        sortDir={sortDir}
                        onHover={setHoveredTaskId}
                        onEditStatus={handleEditStatus}
                        onRecolorStatus={handleRecolorStatus}
                    />
                )}
                {effectiveMode === 'list' && (
                    <ListView
                        columns={kanban.columns}
                        projectId={Number(projectId)}
                        doneStatusId={doneStatusId}
                        activeStatusId={activeStatusId}
                        onAddTask={handleAddTask}
                        onOpenTask={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onTaskMoved={reloadKanban}
                        onOpenAttachments={handleOpenAttachments}
                        sortMode={sortMode}
                        sortDir={sortDir}
                        onHover={setHoveredTaskId}
                    />
                )}
                {effectiveMode === 'compact' && (
                    <CompactView
                        columns={kanban.columns}
                        projectId={Number(projectId)}
                        boardId={Number(boardId)}
                        reorderMode={reorderMode}
                        doneStatusId={doneStatusId}
                        activeStatusId={activeStatusId}
                        activeStatuses={activeStatuses}
                        onAddTask={handleAddTask}
                        onAddStatus={() => setShowCreateStatus(true)}
                        onOpenTask={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onTaskMoved={reloadKanban}
                        onColumnsMoved={reloadKanban}
                        onOpenAttachments={handleOpenAttachments}
                        sortMode={sortMode}
                        sortDir={sortDir}
                        onHover={setHoveredTaskId}
                        onEditStatus={handleEditStatus}
                        onRecolorStatus={handleRecolorStatus}
                    />
                )}
            </div>

            <CreateTaskModal
                open={showCreateTask}
                onClose={() => { setShowCreateTask(false); setPresetStatusId(null) }}
                onCreated={handleTaskCreated}
                projectId={Number(projectId)}
                boardId={Number(boardId)}
                presetStatusId={presetStatusId}
                columns={kanban.columns}
            />

            <CreateStatusModal
                open={showCreateStatus}
                onClose={() => setShowCreateStatus(false)}
                boardId={Number(boardId)}
                onCreated={handleStatusCreated}
            />

            <TaskDetailModal
                open={!!openTaskId}
                onClose={closeTaskModal}
                taskId={openTaskId}
                onOpenTask={setOpenTaskId}
                onUpdated={() => {
                    reloadKanban()
                    refreshTree()
                }}
                boardId={Number(boardId)}
                columns={kanban.columns}
            />

            <AttachmentsModal
                open={!!attachmentsToView}
                attachments={attachmentsToView || []}
                taskId={attachmentsTaskId}
                onClose={() => {
                    setAttachmentsToView(null)
                    setAttachmentsTaskId(null)
                }}
                onUpdated={reloadKanban}
            />

            <ConfirmModal {...modalProps} />

            {colorMenu && (
                <div
                    className="color-menu"
                    style={{
                        position: 'fixed',
                        left: colorMenu.x,
                        top: colorMenu.y,
                        zIndex: 2000,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {ACCENTS.map(c => (
                        <button
                            key={c}
                            type="button"
                            className="color-menu__item"
                            style={{ background: `var(--accent-${c})` }}
                            title={c}
                            onClick={() => applyStatusColor(c)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}