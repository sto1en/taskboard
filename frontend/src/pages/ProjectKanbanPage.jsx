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

    const [showCreateTask, setShowCreateTask] = useState(false)
    const [presetStatusId, setPresetStatusId] = useState(null)
    const [openTaskId, setOpenTaskId] = useState(null)

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

    const handleAddTask = (statusId) => {
        setPresetStatusId(statusId || null)
        setShowCreateTask(true)
    }

    const handleTaskCreated = () => {
        setShowCreateTask(false)
        setPresetStatusId(null)
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

    if (loading) return <div className="loading">Загрузка...</div>
    if (error) return <div className="error">{error}</div>
    if (!project || !kanban) return <div>Проект не найден</div>

    const totalTasks = kanban.columns.reduce((s, c) => s + c.count, 0)
    const autoMode = totalTasks > 100 ? 'list' : 'kanban'
    const effectiveMode = viewMode === 'auto' ? autoMode : viewMode

    const accentStyle = {
        '--accent': `var(--accent-${project.accentCode || 'blue'})`,
    }

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
                <h2 className="board-detail__title">{project.title}</h2>

                <div className="board-detail__toolbar">
                    <FiltersBar
                        columns={kanban.columns}
                        activeStatuses={activeStatuses}
                        onStatusToggle={(id) => setActiveStatuses(prev =>
                            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        )}
                        onClear={() => setActiveStatuses([])}
                    />

                    <SortSwitcher
                        sortMode={sortMode}
                        sortDir={sortDir}
                        onChange={({ sortMode: sm, sortDir: sd }) => {
                            setSortMode(sm); setSortDir(sd)
                        }}
                    />

                    <ViewSwitcher mode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            <div className={`board-detail__scroll ${effectiveMode === 'kanban' ? 'board-detail__scroll--kanban' : ''}`}>
                {effectiveMode === 'kanban' && (
                    <KanbanView
                        columns={kanban.columns}
                        projectId={Number(projectId)}
                        onTaskMoved={reloadKanban}
                        activeStatuses={activeStatuses}
                        onAddTask={handleAddTask}
                        onTaskClick={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        sortMode={sortMode}
                        sortDir={sortDir}
                    />
                )}
                {effectiveMode === 'list' && (
                    <ListView
                        columns={kanban.columns}
                        projectId={Number(projectId)}
                        onAddTask={handleAddTask}
                        onTaskClick={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onTaskMoved={reloadKanban}
                        sortMode={sortMode}
                        sortDir={sortDir}
                    />
                )}
                {effectiveMode === 'compact' && (
                    <CompactView
                        columns={kanban.columns}
                        projectId={Number(projectId)}
                        boardId={Number(boardId)}
                        onAddTask={handleAddTask}
                        onTaskClick={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onTaskMoved={reloadKanban}
                        onColumnsMoved={reloadKanban}
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
                onUpdated={reloadKanban}
                boardId={Number(boardId)}
                columns={kanban.columns}
            />
        </div>
    )
}