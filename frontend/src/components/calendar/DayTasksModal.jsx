import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../Modal/Modal'
import { tasksApi } from '../../api/api'
import useT from '../../hooks/useT'
import TaskCard from '../Task/TaskCard'

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
                                      }) {
    const t = useT()
    const [searchParams] = useSearchParams()
    const [fullTasks, setFullTasks] = useState([])
    const [loading, setLoading] = useState(false)

    const backTo = searchParams.get('from')

    useEffect(() => {
        if (!open || !date) return
        if (!tasks || tasks.length === 0) {
            setFullTasks([])
            return
        }
        setLoading(true)
        Promise.all(
            tasks.map(tt =>
                tasksApi.get(tt.id).then(({ data }) => data).catch(() => null)
            )
        )
            .then(arr => setFullTasks(arr.filter(Boolean)))
            .finally(() => setLoading(false))
    }, [open, date, tasks])

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

            {!loading && fullTasks.length === 0 && (
                <div className="day-tasks-modal__empty">
                    {t.noTasks || 'Нет задач'}
                </div>
            )}

            {!loading && fullTasks.length > 0 && (
                <div className="day-tasks-modal__list">
                    {fullTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onOpenTask={onOpenTask}
                            onTaskMoved={onTaskMoved}
                            onOpenAttachments={onOpenAttachments}
                        />
                    ))}
                </div>
            )}
        </Modal>
    )
}