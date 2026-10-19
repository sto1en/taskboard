import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    fetchRescheduleCandidates,
    invalidateTasks,
    selectRescheduleCandidates,
} from '../../store/slices/tasksSlice'
import { tasksApi } from '../../api/api'
import { formatDeadline } from '../../utils/format'
import useT from '../../hooks/useT'
import RescheduleModal from './RescheduleModal'

export default function RescheduleBanner() {
    // Кандидаты на перенос — серверный стейт из Redux (раньше: локальный
    // useState + событие 'tasks:refresh').
    const dispatch = useDispatch()
    const candidates = useSelector(selectRescheduleCandidates)

    // Задачи, скрытые локально в текущей сессии: snooze/удаление убирают
    // элемент из баннера без ожидания refetch. Это эфемерное UI-состояние,
    // поэтому и живёт локально, а серверный список — в Redux.
    const [hiddenIds, setHiddenIds] = useState([])
    const [dismissed, setDismissed] = useState(false)
    const [openTask, setOpenTask] = useState(null)

    // Первичная загрузка кандидатов.
    useEffect(() => {
        dispatch(fetchRescheduleCandidates())
    }, [dispatch])

    const tasks = candidates.filter((t) => !hiddenIds.includes(t.id))

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
            setHiddenIds((prev) => [...prev, first.id])
        } catch {}
    }

    const removeTask = async () => {
        if (!confirm(`Удалить задачу «${first.title}»?`)) return
        try {
            await tasksApi.delete(first.id)
            dispatch(invalidateTasks())
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
                    dispatch(invalidateTasks())
                }}
            />
        </>
    )
}