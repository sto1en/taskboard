import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../Modal/Modal'
import ConfirmModal from '../common/ConfirmModal'
import { tasksApi } from '../../api/api'
import useT from '../../hooks/useT'
import useHotkeys from '../../hooks/useHotkeys'
import useConfirmDelete from '../../hooks/useConfirmDelete'
import { useAuth } from '../../context/AuthContext'
import TaskCard from '../Task/TaskCard'

function isDoneCategory(cat) {
    return cat === 'DONE' || cat === 'ARCHIVED' || cat === 'CANCELLED'
}

// Дефолтный цвет по категории статуса — не пользовательский accent
function categoryAccent(cat) {
    switch (cat) {
        case 'ACTIVE':    return 'blue'
        case 'DONE':      return 'green'
        case 'ARCHIVED':  return 'green'
        case 'CANCELLED': return 'gray'
        case 'EXPIRED':   return 'red'
        case 'FROZEN':    return 'amber'
        default:          return 'gray'
    }
}

export default function DayTasksModal({
                                          open,
                                          date,
                                          tasks,
                                          onClose,
                                          onBack,
                                          onTaskMoved,
                                          onOpenTask,
                                          onOpenAttachments,
                                          onAddTask,
                                          columns,
                                      }) {
    const t = useT()
    const [searchParams] = useSearchParams()
    const { user, updateUser } = useAuth()

    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

    const [fullTasks, setFullTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [hoveredTaskId, setHoveredTaskId] = useState(null)
    const [doneStatusId, setDoneStatusId] = useState(null)
    const [activeStatusId, setActiveStatusId] = useState(null)
    const [cancelledStatusId, setCancelledStatusId] = useState(null)

    const tasksRef = useRef(tasks)
    tasksRef.current = tasks

    const loadedDateRef = useRef(null)

    const backTo = searchParams.get('from')

    useEffect(() => {
        if (!open) return
        if (!date) {
            setFullTasks([])
            loadedDateRef.current = null
            return
        }
        if (loadedDateRef.current === date) return

        loadedDateRef.current = date
        const list = tasksRef.current || []
        if (list.length === 0) {
            setFullTasks([])
            return
        }

        setLoading(true)
        Promise.all(
            list.map(tt =>
                tasksApi.get(tt.id).then(({ data }) => data).catch(() => null)
            )
        )
            .then(arr => setFullTasks(arr.filter(Boolean)))
            .finally(() => setLoading(false))
        // eslint-disable-next-line
    }, [open, date])

    useEffect(() => {
        if (!open) {
            loadedDateRef.current = null
            setFullTasks([])
        }
    }, [open])

    useEffect(() => {
        if (!open || fullTasks.length === 0) return

        if (columns && columns.length > 0) {
            const done = columns.find(c => c.categoryCode === 'DONE')?.statusId || null
            const active = columns.find(c => c.categoryCode === 'ACTIVE')?.statusId || null
            const cancelled = columns.find(c => c.categoryCode === 'CANCELLED')?.statusId || null
            setDoneStatusId(done)
            setActiveStatusId(active)
            setCancelledStatusId(cancelled)
            return
        }

        const first = fullTasks[0]
        if (!first?.projectId) return

        tasksApi.kanban(first.projectId)
            .then(({ data }) => {
                const cols = data.columns || []
                setDoneStatusId(cols.find(c => c.categoryCode === 'DONE')?.statusId || null)
                setActiveStatusId(cols.find(c => c.categoryCode === 'ACTIVE')?.statusId || null)
                setCancelledStatusId(cols.find(c => c.categoryCode === 'CANCELLED')?.statusId || null)
            })
            .catch(() => {})
        // eslint-disable-next-line
    }, [open, fullTasks, columns])

    const handleToggleDone = async (task) => {
        if (!task) return

        const wasDone = isDoneCategory(task.statusCategoryCode)
        const targetStatusId = wasDone ? activeStatusId : doneStatusId
        if (!targetStatusId) return

        setFullTasks(prev => prev.map(x =>
            x.id === task.id
                ? { ...x, statusId: targetStatusId, statusCategoryCode: wasDone ? 'ACTIVE' : 'DONE' }
                : x
        ))

        try {
            await tasksApi.update(task.id, { statusId: targetStatusId })
            onTaskMoved && onTaskMoved()
            window.dispatchEvent(new Event('tree:refresh'))
        } catch (err) {
            console.error('Toggle done failed:', err)
            setFullTasks(prev => prev.map(x =>
                x.id === task.id
                    ? { ...x, statusCategoryCode: wasDone ? 'DONE' : 'ACTIVE' }
                    : x
            ))
        }
    }

    const handleToggleCancel = async (task) => {
        if (!task) return

        const isCancelled = task.statusCategoryCode === 'CANCELLED'
        const targetStatusId = isCancelled ? activeStatusId : cancelledStatusId
        if (!targetStatusId) {
            alert('Нет подходящего статуса (Отменено или В процессе)')
            return
        }

        const newCategory = isCancelled ? 'ACTIVE' : 'CANCELLED'

        setFullTasks(prev => prev.map(x =>
            x.id === task.id
                ? { ...x, statusId: targetStatusId, statusCategoryCode: newCategory }
                : x
        ))

        try {
            await tasksApi.update(task.id, { statusId: targetStatusId })
            onTaskMoved && onTaskMoved()
            window.dispatchEvent(new Event('tree:refresh'))
        } catch (err) {
            console.error('Toggle cancel failed:', err)
            setFullTasks(prev => prev.map(x =>
                x.id === task.id
                    ? { ...x, statusCategoryCode: isCancelled ? 'CANCELLED' : 'ACTIVE' }
                    : x
            ))
        }
    }

    const findHoveredTask = () => {
        if (!hoveredTaskId) return null
        return fullTasks.find(x => x.id === hoveredTaskId) || null
    }

    const doDelete = async (task) => {
        if (!task) return
        try {
            await tasksApi.delete(task.id)
            setFullTasks(prev => prev.filter(x => x.id !== task.id))
            onTaskMoved && onTaskMoved()
            window.dispatchEvent(new Event('tree:refresh'))
            setHoveredTaskId(null)
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось удалить')
        }
    }

    const handleDeleteWithConfirm = () => {
        const task = findHoveredTask()
        if (!task) return
        requestDelete({
            kind: 'task',
            title: task.title,
            onConfirm: () => doDelete(task),
        })
    }

    const handleOpen = () => {
        const task = findHoveredTask()
        if (!task) return
        onOpenTask && onOpenTask(task.id)
    }

    const sorted = useMemo(() => {
        const active = []
        const done = []
        for (const task of fullTasks) {
            if (isDoneCategory(task.statusCategoryCode)) done.push(task)
            else active.push(task)
        }
        return [...active, ...done]
    }, [fullTasks])

    useHotkeys([
        {
            combo: 'space',
            allowInInput: false,
            when: () => open && !modalProps.open,
            handler: (e) => {
                const task = findHoveredTask()
                if (!task) return
                e.preventDefault()
                handleToggleDone(task)
            },
        },
        {
            combo: 'e',
            allowInInput: false,
            when: () => open && !modalProps.open,
            handler: handleOpen,
        },
        // Delete — удалить
        {
            combo: 'delete',
            allowInInput: false,
            when: () => open && !modalProps.open,
            handler: handleDeleteWithConfirm,
        },
        // Backspace — перенести в отменённые
        {
            combo: 'backspace',
            allowInInput: false,
            when: () => open && !modalProps.open,
            handler: () => {
                const task = findHoveredTask()
                if (task) handleToggleCancel(task)
            },
        },
    ])

    const titleDate = date
        ? new Date(date).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : ''

    const handleAdd = () => {
        if (onAddTask) onAddTask(date)
        onClose()
    }

    const handleBack = () => {
        if (onBack) onBack()
        else onClose()
    }

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={titleDate}
                footer={
                    <>
                        {backTo && (
                            <button className="btn btn-ghost" onClick={handleBack}>
                                ← Назад
                            </button>
                        )}
                        <button className="btn btn-ghost" onClick={onClose}>
                            Закрыть
                        </button>
                        <button className="btn btn-primary" onClick={handleAdd}>
                            + Добавить задачу
                        </button>
                    </>
                }
            >
                {loading && <div className="loading">{t.loading}</div>}

                {!loading && sorted.length === 0 && (
                    <div className="day-tasks-modal__empty">
                        {t.noTasks || 'Нет задач'}
                    </div>
                )}

                {!loading && sorted.length > 0 && (
                    <div className="day-tasks-modal__list">
                        {sorted.map(task => (
                            <div
                                key={task.id}
                                className="day-tasks-modal__item"
                                onMouseEnter={() => setHoveredTaskId(task.id)}
                                onMouseLeave={() => setHoveredTaskId(null)}
                            >
                                <TaskCard
                                    task={{
                                        ...task,
                                        statusAccentCode: categoryAccent(task.statusCategoryCode),
                                    }}
                                    doneStatusId={doneStatusId}
                                    activeStatusId={activeStatusId}
                                    onOpenTask={onOpenTask}
                                    onToggleDone={(taskId) => {
                                        const full = fullTasks.find(x => x.id === taskId)
                                        if (full) handleToggleDone(full)
                                    }}
                                    onTaskMoved={() => {
                                        onTaskMoved && onTaskMoved()
                                    }}
                                    onOpenAttachments={onOpenAttachments}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            <ConfirmModal {...modalProps} />
        </>
    )
}