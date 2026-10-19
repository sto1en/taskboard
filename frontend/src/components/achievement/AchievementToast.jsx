import { useEffect, useRef, useState } from 'react'

export default function AchievementToast({ queue, onDismiss }) {
    const [current, setCurrent] = useState(null)
    const timerRef = useRef(null)
    const remainingRef = useRef(8000)
    const startedAtRef = useRef(0)

    useEffect(() => {
        if (current || !queue || queue.length === 0) return
        setCurrent(queue[0])
        remainingRef.current = 8000
    }, [queue, current])

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const startTimer = (ms) => {
        clearTimer()
        startedAtRef.current = Date.now()
        timerRef.current = setTimeout(() => {
            onDismiss && onDismiss(current.id)
            setCurrent(null)
        }, ms)
    }

    useEffect(() => {
        if (!current) return
        startTimer(remainingRef.current)
        return clearTimer
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current])

    // Пауза при наведении: 8 секунд — достаточно, чтобы прочитать,
    // но если пользователь завис на тосте, он не должен исчезнуть.
    const handleMouseEnter = () => {
        if (!current) return
        remainingRef.current = Math.max(
            1200,
            remainingRef.current - (Date.now() - startedAtRef.current),
        )
        clearTimer()
    }

    const handleMouseLeave = () => {
        if (!current) return
        startTimer(remainingRef.current)
    }

    if (!current) return null

    const reward = current.reward || 0
    const hasItem = !!current.rewardItemType && !!current.rewardItemCode

    const itemIcon = {
        ACCENT: '🎨',
        FRAME:  '🖼️',
        AVATAR: '👤',
        TREE:   '🌳',
    }[current.rewardItemType] || '🎁'

    const itemLabel = {
        ACCENT: 'Акцент',
        FRAME:  'Рамка',
        AVATAR: 'Аватарка',
        TREE:   'Дерево',
    }[current.rewardItemType] || 'Предмет'

    return (
        <div
            className="achievement-toast"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="achievement-toast__icon">{current.icon}</div>
            <div className="achievement-toast__body">
                <div className="achievement-toast__title">Новое достижение!</div>

                {/* Название ачивки — крупно */}
                <div className="achievement-toast__name">{current.title}</div>

                {/* Описание */}
                <div className="achievement-toast__desc">{current.description}</div>

                {/* Награды */}
                {(reward > 0 || hasItem) && (
                    <div className="achievement-toast__rewards">
                        {reward > 0 && (
                            <span className="achievement-toast__reward-chip">
                                🍃 +{reward}
                            </span>
                        )}
                        {hasItem && (
                            <span className="achievement-toast__reward-chip achievement-toast__reward-chip--item">
                                {itemIcon} {itemLabel}
                                {current.rewardItemTitle && (
                                    <> · <b>{current.rewardItemTitle}</b></>
                                )}
                            </span>
                        )}
                    </div>
                )}
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