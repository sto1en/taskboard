import { useEffect, useState } from 'react'
import { tasksApi } from '../../api/api'
import { formatDeadline } from '../../utils/format'
import useT from '../../hooks/useT'
import RescheduleModal from './RescheduleModal'

export default function RescheduleBanner() {
    const [tasks, setTasks] = useState([])
    const [dismissed, setDismissed] = useState(false)
    const [openTask, setOpenTask] = useState(null)

    const load = () => {
        tasksApi.rescheduleCandidates()
            .then(({ data }) => setTasks(data || []))
            .catch(() => setTasks([]))
    }

    useEffect(() => {
        load()
        const onRefresh = () => load()
        window.addEventListener('tasks:refresh', onRefresh)
        return () => window.removeEventListener('tasks:refresh', onRefresh)
    }, [])

    if (dismissed || tasks.length === 0) return null

    const first = tasks[0]
    const tooMany = (first.rescheduleCount || 0) >= 5

    const openReschedule = async () => {
        try {
            const { data } = await tasksApi.get(first.id)
            setOpenTask(data)
        } catch {}
    }

    const snooze = async () => {
        try {
            await tasksApi.snoozeReschedule(first.id, 24)
            setTasks(prev => prev.slice(1))
        } catch {}
    }

    const removeTask = async () => {
        if (!confirm(`Удалить задачу «${first.title}»?`)) return
        try {
            await tasksApi.delete(first.id)
            setTasks(prev => prev.slice(1))
            window.dispatchEvent(new Event('tasks:refresh'))
        } catch {}
    }

    return (
        <>
            <div className="reschedule-banner">
                <div className="reschedule-banner__text">
                    ⏰ Задача <b>«{first.title}»</b> просрочена ({formatDeadline(first.deadline)}).
                    {tasks.length > 1 && <> и ещё {tasks.length - 1}.</>}
                    {tooMany && (
                        <div className="reschedule-banner__warn">
                            Вы переносили её уже {first.rescheduleCount} раз. Может, удалить?
                        </div>
                    )}
                </div>
                <div className="reschedule-banner__actions">
                    <button className="btn btn-primary reschedule-banner__btn" onClick={openReschedule}>
                        Перенести
                    </button>
                    <button className="btn btn-ghost reschedule-banner__btn" onClick={snooze}>
                        Позже
                    </button>
                    {tooMany && (
                        <button className="btn btn-danger reschedule-banner__btn" onClick={removeTask}>
                            Удалить
                        </button>
                    )}
                    <button
                        className="reschedule-banner__close"
                        onClick={() => setDismissed(true)}
                        title="Скрыть"
                    >×</button>
                </div>
            </div>

            <RescheduleModal
                open={!!openTask}
                task={openTask}
                onClose={() => setOpenTask(null)}
                onUpdated={() => {
                    setTasks(prev => prev.slice(1))
                    window.dispatchEvent(new Event('tasks:refresh'))
                }}
            />
        </>
    )
}