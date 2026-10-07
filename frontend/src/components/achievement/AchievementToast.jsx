import { useEffect, useState } from 'react'

export default function AchievementToast({ queue, onDismiss }) {
    const [current, setCurrent] = useState(null)

    useEffect(() => {
        if (current || !queue || queue.length === 0) return
        setCurrent(queue[0])
    }, [queue, current])

    useEffect(() => {
        if (!current) return
        const timer = setTimeout(() => {
            onDismiss && onDismiss(current.id)
            setCurrent(null)
        }, 5000)
        return () => clearTimeout(timer)
    }, [current, onDismiss])

    if (!current) return null

    return (
        <div className="achievement-toast">
            <div className="achievement-toast__icon">{current.icon}</div>
            <div className="achievement-toast__body">
                <div className="achievement-toast__title">Новое достижение!</div>
                <div className="achievement-toast__name">{current.title}</div>
                <div className="achievement-toast__desc">{current.description}</div>
            </div>
            <button
                className="achievement-toast__close"
                onClick={() => {
                    onDismiss && onDismiss(current.id)
                    setCurrent(null)
                }}
            >×</button>
        </div>
    )
}