import { useEffect, useState } from 'react'
import Modal from '../Modal/Modal'
import { tasksApi } from '../../api/api'
import { splitDeadline, buildDeadline } from '../../utils/format'
import useT from '../../hooks/useT'

export default function RescheduleModal({ open, task, onClose, onUpdated }) {
    const t = useT()
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [hasTime, setHasTime] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!open || !task) return
        const { date: d, time: tm, hasTime: ht } = splitDeadline(task.deadline)
        setDate(d || '')
        setTime(tm || '')
        setHasTime(ht)
        setError(null)
    }, [open, task])

    if (!open || !task) return null

    const apply = async () => {
        if (!date) return
        setLoading(true)
        setError(null)
        try {
            const deadline = buildDeadline(date, time, hasTime)
            await tasksApi.update(task.id, { deadline })
            window.dispatchEvent(new Event('tasks:refresh'))
            onUpdated && onUpdated()
            onClose()
        } catch (e) {
            setError(e.response?.data?.message || 'Ошибка')
        } finally {
            setLoading(false)
        }
    }

    // Перенос на N дней вперёд
    const shiftDays = (days) => {
        const base = date ? new Date(date + 'T00:00:00') : new Date()
        base.setDate(base.getDate() + days)
        const yyyy = base.getFullYear()
        const mm = String(base.getMonth() + 1).padStart(2, '0')
        const dd = String(base.getDate()).padStart(2, '0')
        setDate(`${yyyy}-${mm}-${dd}`)
    }

    // Перенос на N часов — включаем время, если было выключено
    const shiftHours = (hours) => {
        const baseTime = time || '09:00'
        const [h, m] = baseTime.split(':').map(Number)
        const d = new Date()
        d.setHours(h + hours)
        d.setMinutes(m)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        setTime(`${hh}:${mm}`)
        setHasTime(true)
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Перенести задачу"
            footer={
                <>
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Отмена
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={apply}
                        disabled={loading || !date}
                    >
                        {loading ? '...' : 'Перенести'}
                    </button>
                </>
            }
        >
            <div className="reschedule-modal">
                <div className="reschedule-modal__task">
                    {task.title}
                </div>

                <div className="reschedule-modal__quick">
                    <button type="button" className="reschedule-modal__quick-btn" onClick={() => shiftDays(1)}>
                        +1 день
                    </button>
                    <button type="button" className="reschedule-modal__quick-btn" onClick={() => shiftDays(3)}>
                        +3 дня
                    </button>
                    <button type="button" className="reschedule-modal__quick-btn" onClick={() => shiftDays(7)}>
                        +1 неделя
                    </button>
                    <button type="button" className="reschedule-modal__quick-btn" onClick={() => shiftHours(24)}>
                        +24 часа
                    </button>
                </div>

                <div className="modal__row">
                    <div className="modal__field">
                        <label className="modal__label">Дата</label>
                        <input
                            className="input"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    {hasTime && (
                        <div className="modal__field">
                            <label className="modal__label">Время</label>
                            <input
                                className="input"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <label className="task-detail__toggle">
                    <input
                        type="checkbox"
                        checked={hasTime}
                        onChange={(e) => setHasTime(e.target.checked)}
                    />
                    <span>Указать время</span>
                </label>

                {error && <div className="modal__error">{error}</div>}
            </div>
        </Modal>
    )
}