import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { projectsApi, tasksApi } from '../api/api'
import ViewSwitcher from '../components/Task/ViewSwitcher'
import SortSwitcher from '../components/Task/SortSwitcher'
import FiltersBar from '../components/Task/FiltersBar'
import KanbanView from '../components/Task/KanbanView'
import ListView from '../components/Task/ListView'
import CompactView from '../components/Task/CompactView'
import CreateTaskModal from '../components/Task/CreateTaskModal'
import TaskDetailModal from '../components/Task/TaskDetailModal'
import AttachmentsModal from '../components/Task/AttachmentsModal'
import InlineEdit from '../components/common/InlineEdit'

export default function ProjectKanbanPage() {
    const { boardId, projectId } = useParams()
    const [searchParams] = useSearchParams()
    const nav = useNavigate()
    const [project, setProject] = useState(null)
    const [kanban, setKanban] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [viewMode, setViewMode] = useState('auto')
    const [sortMode, setSortMode] = useState('manual')
    const [sortDir, setSortDir] = useState('asc')
    const [activeStatuses, setActiveStatuses] = useState([])
    const [reorderMode, setReorderMode] = useState(false)

    const [showCreateTask, setShowCreateTask] = useState(false)
    const [presetStatusId, setPresetStatusId] = useState(null)
    const [openTaskId, setOpenTaskId] = useState(null)

    const [attachmentsToView, setAttachmentsToView] = useState(null)
    const [attachmentsTaskId, setAttachmentsTaskId] = useState(null)

    useEffect(() => {
        const taskFromUrl = searchParams.get('task')
        if (taskFromUrl) {
            setOpenTaskId(Number(taskFromUrl))
        }
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

    const handleTaskCreated = () => {
        setShowCreateTask(false)
        setPresetStatusId(null)
        reloadKanban()
        refreshTree()
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

    if (loading) return <div className="loading">Загрузка...</div>
    if (error) return <div className="error">{error}</div>
    if (!project || !kanban) return <div>Проект не найден</div>

    const totalTasks = kanban.columns.reduce((s, c) => s + c.count, 0)
    const autoMode = totalTasks > 100 ? 'list' : 'kanban'
    const effectiveMode = viewMode === 'auto' ? autoMode : viewMode

    const doneCol = kanban.columns.find(c => c.categoryCode === 'DONE')
    const doneStatusId = doneCol?.statusId || null

    const activeCol = kanban.columns.find(c => c.categoryCode === 'ACTIVE')
    const activeStatusId = activeCol?.statusId || null

    const accentStyle = {
        '--accent': `var(--accent-${project.accentCode || 'blue'})`,
    }

    const showReorderButton = effectiveMode === 'kanban' || effectiveMode === 'compact'

    return (
        <div className="board-detail" style={accentStyle}>
            <div className="board-detail__head">
                <button
                    className="btn btn-ghost board-detail__back"
                    onClick={() => nav(`/boards/${boardId}`)}
                    title="Назад к доске"
                >
                    ← Назад
                </button>

                <div className="board-detail__title-wrap">
                    <InlineEdit
                        value={project.title}
                        className="board-detail__title board-detail__title-text"
                        inputClassName="input board-detail__title-input"
                        onSave={saveProjectTitle}
                        title="Двойной клик — редактировать название проекта"
                    />
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
                    />

                    {showReorderButton && (
                        <button
                            className={`reorder-btn ${reorderMode ? 'reorder-btn--active' : ''}`}
                            onClick={() => setReorderMode(v => !v)}
                            title={reorderMode ? 'Выключить режим перестановки' : 'Включить режим перестановки'}
                        >
                            🔀 {reorderMode ? 'Готово' : 'Переставить'}
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
                        onOpenTask={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onOpenAttachments={handleOpenAttachments}
                        sortMode={sortMode}
                        sortDir={sortDir}
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
                        onAddTask={handleAddTask}
                        onOpenTask={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onTaskMoved={reloadKanban}
                        onColumnsMoved={reloadKanban}
                        onOpenAttachments={handleOpenAttachments}
                        sortMode={sortMode}
                        sortDir={sortDir}
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
        </div>
    )
}