export default function DayLoadBar({ level }) {
    if (!level || level === 'empty') return null

    const map = {
        low:    { color: 'var(--success)', label: 'Низкая' },
        medium: { color: 'var(--accent-amber, #ffab00)', label: 'Средняя' },
        high:   { color: 'var(--danger)', label: 'Высокая' },
    }

    const cfg = map[level] || map.low

    return (
        <span
            className={`calendar__load-bar calendar__load-bar--${level}`}
            title={`Загрузка: ${cfg.label}`}
            style={{ background: cfg.color }}
        />
    )
}