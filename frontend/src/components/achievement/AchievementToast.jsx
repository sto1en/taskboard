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
        }, 6000)
        return () => clearTimeout(timer)
    }, [current, onDismiss])

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
        <div className="achievement-toast">
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