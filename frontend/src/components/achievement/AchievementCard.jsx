export default function AchievementCard({ achievement }) {
    const accent = `var(--accent-${achievement.accentCode || 'blue'})`
    const locked = !achievement.unlocked
    const reward = achievement.reward || 0
    const hasItem = !!achievement.rewardItemType && !!achievement.rewardItemCode

    const itemIcon = {
        ACCENT: '🎨',
        FRAME:  '🖼️',
        AVATAR: '👤',
        TREE:   '🌳',
    }[achievement.rewardItemType] || '🎁'

    const itemLabel = {
        ACCENT: 'Акцент',
        FRAME:  'Рамка',
        AVATAR: 'Аватарка',
        TREE:   'Дерево',
    }[achievement.rewardItemType] || 'Предмет'

    return (
        <div
            className={`achievement-card ${locked ? 'achievement-card--locked' : ''}`}
            style={{ '--ach-accent': accent }}
            title={achievement.description}
        >
            <div className="achievement-card__icon">
                {locked ? '🔒' : achievement.icon}
            </div>
            <div className="achievement-card__body">
                <div className="achievement-card__title">{achievement.title}</div>
                <div className="achievement-card__desc">{achievement.description}</div>

                {/* Листья */}
                {reward > 0 && (
                    <div className="achievement-card__reward">
                        Награда: 🍃 {reward}
                    </div>
                )}

                {/* Предмет-награда */}
                {hasItem && (
                    <div className="achievement-card__reward achievement-card__reward--item">
                        <span className="achievement-card__reward-icon">{itemIcon}</span>
                        <span className="achievement-card__reward-label">
                            {itemLabel}
                            {achievement.rewardItemTitle && (
                                <> · <b>{achievement.rewardItemTitle}</b></>
                            )}
                        </span>
                    </div>
                )}

                {achievement.unlocked && achievement.unlockedAt && (
                    <div className="achievement-card__date">
                        Получено {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    )
}