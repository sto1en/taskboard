export default function AchievementCard({ achievement }) {
    const accent = `var(--accent-${achievement.accentCode || 'blue'})`
    const locked = !achievement.unlocked
    const reward = achievement.reward || 0

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
                {reward > 0 && (
                    <div className="achievement-card__reward">
                        Награда: 🍃 {reward}
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