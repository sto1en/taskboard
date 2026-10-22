import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { observer } from 'mobx-react-lite'
import { fetchPinned } from '../store/slices/sidebarSlice'
import { invalidateStats } from '../store/slices/statsSlice'
import { useUiStore } from '../store/useUiStore'
import { projectsApi, tasksApi, projectFiltersApi, statusesApi } from '../api/api'
import ViewSwitcher from '../components/task/ViewSwitcher'
import SortSwitcher from '../components/task/SortSwitcher'
import FiltersBar from '../components/task/FiltersBar'
import KanbanView from '../components/task/KanbanView'
import ListView from '../components/task/ListView'
import CompactView from '../components/task/CompactView'
import ProjectCalendarView from '../components/task/ProjectCalendarView'
import TaskFormModal from '../components/task/TaskFormModal'
import CreateStatusModal from '../components/task/CreateStatusModal'
import TaskDetailModal from '../components/task/TaskDetailModal'
import AttachmentsModal from '../components/task/AttachmentsModal'
import ConfirmModal from '../components/common/ConfirmModal'
import InlineEdit from '../components/common/InlineEdit'
import { IconPin } from '../components/common/ToolbarIcons'
import useHotkeys from '../hooks/useHotkeys'
import useConfirmDelete from '../hooks/useConfirmDelete'
import { useAuth } from '../context/AuthContext'
import { sortTasks } from '../utils/sortTasks'

const ACCENTS = [
    'blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal',
    'navy', 'olive', 'indigo', 'violet', 'magenta', 'coral', 'amber',
    'lime', 'mint', 'cyan', 'slate', 'maroon', 'brown',
]

function sameIds(a = [], b = []) {
    return a.length === b.length && a.every((v, i) => v === b[i])
}

export default observer(function ProjectKanbanPage({
    boardId: boardIdProp,
    projectId: projectIdProp,
    groupMode = false,
}) {
    const params = useParams()
    const boardId = boardIdProp ?? params.boardId
    const projectId = projectIdProp ?? params.projectId
    const [searchParams] = useSearchParams()
    const nav = useNavigate()
    const dispatch = useDispatch()
    const ui = useUiStore()
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
    const [sortMode, setSortMode] = useState('by_priority')
    const [sortDir, setSortDir] = useState('asc')
    const [activeStatuses, setActiveStatuses] = useState([])
    const [reorderMode, setReorderMode] = useState(false)

    // Закрепы: фильтр (statusIds) и вид (viewMode + сортировка) хранятся
    // в одной записи project_filters, поэтому сохраняем их вместе.
    const [pinnedFilters, setPinnedFilters] = useState(false)
    const [pinnedView, setPinnedView] = useState(false)
    const [savingPins, setSavingPins] = useState(false)
    const savedPinsRef = useRef({
        filters: [],
        viewMode: null,
        sortMode: null,
        sortDir: null,
    })

    const [showCreateTask, setShowCreateTask] = useState(false)
    const [showCreateStatus, setShowCreateStatus] = useState(false)
    const [presetStatusId, setPresetStatusId] = useState(null)
    const [presetDeadline, setPresetDeadline] = useState(null)
    const [calendarRevision, setCalendarRevision] = useState(0)
    const [openTaskId, setOpenTaskId] = useState(null)

    const [attachmentsToView, setAttachmentsToView] = useState(null)
    const [attachmentsTaskId, setAttachmentsTaskId] = useState(null)

    const [hoveredTaskId, setHoveredTaskId] = useState(null)
    const [colorMenu, setColorMenu] = useState(null)

    useEffect(() => {
        if (!projectId) return
        projectFiltersApi.get(projectId)
            .then(({ data }) => {
                // Не пересоздаём массив, если фильтров нет: новая ссылка
                // заставляла перезапускаться эффект FiltersBar (его deps
                // включают activeStatuses), порождая лишние запросы.
                const ids = data?.statusIds?.length > 0 ? data.statusIds : []
                setActiveStatuses(prev =>
                    prev.length === ids.length && prev.every((v, i) => v === ids[i])
                        ? prev
                        : ids
                )

                savedPinsRef.current = {
                    filters: [...ids],
                    viewMode: data?.viewMode || null,
                    sortMode: data?.sortMode || null,
                    sortDir: data?.sortDir || null,
                }
                setPinnedFilters(ids.length > 0)
                setPinnedView(!!data?.viewMode)

                if (data?.sortMode) setSortMode(data.sortMode)
                if (data?.sortDir) setSortDir(data.sortDir)
                if (data?.viewMode) setViewMode(data.viewMode)
            })
            .catch(() => {
                setActiveStatuses(prev => (prev.length === 0 ? prev : []))
                setPinnedFilters(false)
                setPinnedView(false)
            })
    }, [projectId])

    const persistPins = async ({ filters = pinnedFilters, view = pinnedView } = {}) => {
        if (!projectId) return

        if (!filters && !view) {
            await projectFiltersApi.clear(projectId)
            savedPinsRef.current = { filters: [], viewMode: null, sortMode: null, sortDir: null }
            return
        }

        await projectFiltersApi.save(projectId, {
            statusIds: filters ? activeStatuses : [],
            sortMode: view ? sortMode : null,
            sortDir: view ? sortDir : null,
            viewMode: view ? viewMode : null,
        })

        savedPinsRef.current = {
            filters: filters ? [...activeStatuses] : [],
            viewMode: view ? viewMode : null,
            sortMode: view ? sortMode : null,
            sortDir: view ? sortDir : null,
        }
    }

    const handleToggleFilterPin = async () => {
        const next = !pinnedFilters
        setPinnedFilters(next)
        setSavingPins(true)
        try {
            await persistPins({ filters: next })
        } catch (err) {
            setPinnedFilters(!next)
            alert(err.response?.data?.message || 'Не удалось сохранить фильтр')
        } finally {
            setSavingPins(false)
        }
    }

    const handleToggleViewPin = async () => {
        const next = !pinnedView
        setPinnedView(next)
        setSavingPins(true)
        try {
            await persistPins({ view: next })
        } catch (err) {
            setPinnedView(!next)
            alert(err.response?.data?.message || 'Не удалось сохранить вид')
        } finally {
            setSavingPins(false)
        }
    }

    // Пока фильтр закреплён, изменения набора статусов сохраняются сами.
    // Если снять все галочки — закреплённый фильтр больше не нужен,
    // иначе при следующем открытии проекта вернулся бы старый набор.
    useEffect(() => {
        if (!pinnedFilters) return
        if (activeStatuses.length === 0) {
            setPinnedFilters(false)
            setSavingPins(true)
            persistPins({ filters: false })
                .catch((err) => console.error('Clear pinned filter failed:', err))
                .finally(() => setSavingPins(false))
            return
        }
        if (sameIds(savedPinsRef.current.filters, activeStatuses)) return
        persistPins({ filters: true })
            .catch((err) => console.error('Save pinned filter failed:', err))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStatuses])

    // То же для закреплённого вида: смена вида/сортировки обновляет закреп.
    useEffect(() => {
        if (!pinnedView) return
        const saved = savedPinsRef.current
        if (saved.viewMode === viewMode
            && saved.sortMode === sortMode
            && saved.sortDir === sortDir) return
        persistPins({ view: true })
            .catch((err) => console.error('Save pinned view failed:', err))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, sortMode, sortDir])

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
        // Календарный вид живёт на отдельном запросе /calendar — сообщаем
        // ему, что данные проекта изменились.
        setCalendarRevision((r) => r + 1)
    }

    const refreshTree = () => {
        dispatch(invalidateStats())
    }

    const handleAddTask = (statusId, dateIso = null) => {
        setPresetStatusId(statusId || null)
        setPresetDeadline(dateIso || null)
        setShowCreateTask(true)
    }

    // Горячая клавиша N: на странице проекта → новая задача.
    // Раньше: подписка на 'hotkey:new' (detail === 'task').
    // Без массива зависимостей — см. пояснение в BoardsPage.
    useEffect(() => {
        if (ui.consumeCreate() === 'task') handleAddTask(null)
    })

    const handleTaskCreated = () => {
        setShowCreateTask(false)
        setPresetStatusId(null)
        setPresetDeadline(null)
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
            nav(groupMode
                ? `/group/${projectId}`
                : `/boards/${boardId}/projects/${projectId}`, { replace: true })
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
            dispatch(fetchPinned())
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

    // Ручной режим хранит порядок в position. Чтобы при входе в него
    // (кнопка ↔, P или выбор «Вручную») список не прыгал со
    // приоритетного порядка на старые позиции, сначала «замораживаем»
    // текущий порядок в position. Дальше drag уже ничем не перебивается.
    const ensureManualSort = async () => {
        if (sortMode === 'manual' || !kanban) return

        const writes = []
        const columns = kanban.columns.map(col => {
            const ordered = sortTasks(col.tasks, sortMode, sortDir)
            return {
                ...col,
                tasks: ordered.map((task, index) => {
                    if (task.position === index) return task
                    writes.push(tasksApi.update(task.id, { position: index }))
                    return { ...task, position: index }
                }),
            }
        })

        // Оптимистично переставляем локально: серверные position уедут
        // следом, но пользователь не увидит промежуточной пересортировки.
        setKanban(prev => (prev ? { ...prev, columns } : prev))
        setSortMode('manual')
        // Ручной порядок всегда читается по возрастанию position;
        // иначе замороженный порядок показался бы перевёрнутым.
        setSortDir('asc')

        await Promise.allSettled(writes)
    }

    const toggleReorderMode = () => {
        const next = !reorderMode
        setReorderMode(next)
        // Перестановка имеет смысл только при ручной сортировке: иначе
        // список тут же пересортируется и drag визуально откатится.
        if (next) ensureManualSort()
    }

    // Массив хоткеев мемоизируем: useHotkeys внутри зависит от ссылки на
    // массив, и при новом массиве каждый рендер переустанавливал обработчик
    // keydown. Значения, от которых зависят сами обработчики, читаются через
    // замыкание, поэтому достаточно мемоизации по ссылкам на функции-хендлеры.
    const hotkeys = useMemo(() => [
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

        {
            combo: 'delete',
            allowInInput: false,
            handler: handleDeleteWithConfirm,
        },
        {
            combo: 'backspace',
            allowInInput: false,
            handler: handleToggleCancel,
        },

        // Ctrl+C — дублировать задачу под курсором
        {
            combo: 'ctrl+c',
            allowInInput: false,
            handler: () => { if (hoveredTaskId) handleDuplicateTask(hoveredTaskId) },
        },
        // C — тоже дублировать
        {
            combo: 'c',
            allowInInput: false,
            handler: () => { if (hoveredTaskId) handleDuplicateTask(hoveredTaskId) },
        },

        { combo: '1', handler: () => setViewMode('kanban') },
        { combo: '2', handler: () => setViewMode('list') },
        { combo: '3', handler: () => setViewMode('compact') },
        { combo: '4', handler: () => setViewMode('calendar') },

        { combo: 'p', handler: toggleReorderMode },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [hoveredTaskId, kanban, reorderMode, sortMode, sortDir])

    useHotkeys(hotkeys)

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
                    onClick={() => nav(groupMode ? '/group' : `/boards/${boardId}`)}
                    title={groupMode ? 'К групповой доске' : 'На уровень вверх — к доске'}
                >
                    {groupMode ? '↑ К групповой доске' : '↑ К доске'}
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
                        {!groupMode && (
                        <button
                            type="button"
                            className={`board-detail__pin-btn ${project.isPinned ? 'board-detail__pin-btn--active' : ''}`}
                            onClick={handleTogglePin}
                            title={project.isPinned ? 'Открепить проект от боковой панели' : 'Закрепить проект на боковой панели'}
                            aria-label={project.isPinned ? 'Открепить проект от боковой панели' : 'Закрепить проект на боковой панели'}
                            aria-pressed={project.isPinned}
                        >
                            <IconPin filled={project.isPinned} size={16} />
                        </button>
                        )}
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
                    <button
                        type="button"
                        className="btn btn-primary board-detail__new-task"
                        onClick={() => handleAddTask(null)}
                        title="Создать задачу"
                    >
                        + Задача
                    </button>

                    <ViewSwitcher
                        mode={viewMode}
                        onChange={setViewMode}
                        pinned={pinnedView}
                        onTogglePin={handleToggleViewPin}
                        saving={savingPins}
                    />

                    {effectiveMode !== 'calendar' && (
                        <SortSwitcher
                            sortMode={sortMode}
                            sortDir={sortDir}
                            onChange={({ sortMode: sm, sortDir: sd }) => {
                                if (sm === 'manual' && sortMode !== 'manual') {
                                    // Вход в ручной режим — с текущего порядка.
                                    ensureManualSort()
                                    return
                                }
                                setSortMode(sm)
                                setSortDir(sd)
                            }}
                        />
                    )}

                    <FiltersBar
                        columns={kanban.columns}
                        activeStatuses={activeStatuses}
                        onStatusToggle={(id) => setActiveStatuses(prev =>
                            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        )}
                        onClear={() => setActiveStatuses([])}
                        pinned={pinnedFilters}
                        onTogglePin={handleToggleFilterPin}
                        saving={savingPins}
                    />

                    {showReorderButton && (
                        <button
                            className={`reorder-btn ${reorderMode ? 'reorder-btn--active' : ''}`}
                            onClick={toggleReorderMode}
                            title={reorderMode ? 'Выйти из режима перестановки' : 'Включить режим перестановки'}
                        >
                            <span className="reorder-btn__icon">{reorderMode ? '✓' : '↔'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={`board-detail__scroll ${effectiveMode === 'kanban' ? 'board-detail__scroll--kanban' : ''} ${effectiveMode === 'calendar' ? 'board-detail__scroll--calendar' : ''}`}>
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
                        onAddStatus={groupMode ? undefined : () => setShowCreateStatus(true)}
                        onOpenTask={setOpenTaskId}
                        onToggleDone={handleToggleDone}
                        onOpenAttachments={handleOpenAttachments}
                        sortMode={sortMode}
                        sortDir={sortDir}
                        onHover={setHoveredTaskId}
                        onEditStatus={groupMode ? undefined : handleEditStatus}
                        onRecolorStatus={groupMode ? undefined : handleRecolorStatus}
                        onEnsureManualSort={ensureManualSort}
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
                        onEnsureManualSort={ensureManualSort}
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
                        onAddStatus={groupMode ? undefined : () => setShowCreateStatus(true)}
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
                        onEnsureManualSort={ensureManualSort}
                    />
                )}
                {effectiveMode === 'calendar' && (
                    <ProjectCalendarView
                        projectId={Number(projectId)}
                        activeStatuses={activeStatuses}
                        onOpenTask={setOpenTaskId}
                        onAddTask={(iso) => handleAddTask(null, iso)}
                        onToggleDone={handleToggleDone}
                        onTaskMoved={reloadKanban}
                        refreshToken={calendarRevision}
                    />
                )}
            </div>

            <TaskFormModal
                open={showCreateTask}
                onClose={() => { setShowCreateTask(false); setPresetStatusId(null); setPresetDeadline(null) }}
                onCreated={handleTaskCreated}
                projectId={Number(projectId)}
                boardId={Number(boardId)}
                presetStatusId={presetStatusId}
                presetDeadline={presetDeadline}
                columns={kanban.columns}
                mode="project"
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
})