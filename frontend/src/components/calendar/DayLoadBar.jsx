export default function DayLoadBar({ level }) {
    if (!level || level === 'empty') return null

    // Сколько палочек рисовать
    const barsMap = { low: 1, medium: 2, high: 3 }
    const count = barsMap[level] || 0

    // Цвет по уровню
    const colorMap = {
        low:    'var(--success)',                 // зелёный
        medium: 'var(--accent-amber, #ffab00)',   // янтарный
        high:   'var(--danger)',                  // красный
    }
    const color = colorMap[level] || 'var(--text-muted)'

    const labelMap = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' }

    return (
        <span
            className="calendar__load-bars"
            title={`Загрузка: ${labelMap[level] || ''}`}
            style={{ '--load-color': color }}
        >
            {Array.from({ length: count }).map((_, i) => (
                <span
                    key={i}
                    className="calendar__load-bar"
                    style={{ height: 4 + i * 3 }}
                />
            ))}
        </span>
    )
}