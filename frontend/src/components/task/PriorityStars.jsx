/**
 * Приоритет в виде 1–3 звёзд.
 *
 * Почему звёзды: в меню было три текстовых варианта («Обычный», «Высокий»,
 * «Срочный»), из-за чего выбор занимал лишние клики и скролл. Звёзды
 * читаются быстрее и занимают одну строку.
 *
 * Маппинг на существующее поле backend (short priority):
 *   1 звезда  → -1 (низкий, «пох»)
 *   2 звезды  →  0 (обычный, дефолт)
 *   3 звезды  →  2 (важный; старое значение 1 тоже показываем как 3)
 */
export const PRIORITY_LOW = -1
export const PRIORITY_NORMAL = 0
export const PRIORITY_HIGH = 2

export function priorityToStars(priority) {
    const value = Number(priority)
    if (!Number.isFinite(value)) return 2
    if (value <= PRIORITY_LOW) return 1
    if (value <= PRIORITY_NORMAL) return 2
    return 3
}

export function starsToPriority(stars) {
    if (stars <= 1) return PRIORITY_LOW
    if (stars >= 3) return PRIORITY_HIGH
    return PRIORITY_NORMAL
}

export function PriorityStars({ priority, className = '', title }) {
    const stars = priorityToStars(priority)
    const label = stars === 1 ? 'Низкий приоритет' : stars === 2 ? 'Обычный приоритет' : 'Важная задача'

    return (
        <span
            className={`priority-stars ${className}`.trim()}
            title={title || label}
            aria-label={label}
        >
            {[1, 2, 3].map(n => (
                <span
                    key={n}
                    className={`priority-stars__star ${n <= stars ? 'priority-stars__star--on' : ''}`}
                    aria-hidden="true"
                >
                    {n <= stars ? '★' : '☆'}
                </span>
            ))}
        </span>
    )
}

export function PriorityPicker({ value, onChange, className = '' }) {
    const stars = priorityToStars(value)

    return (
        <div className={`priority-picker ${className}`.trim()} role="radiogroup" aria-label="Приоритет">
            {[1, 2, 3].map(n => (
                <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    className={`priority-picker__btn ${n <= stars ? 'priority-picker__btn--on' : ''}`}
                    onClick={() => onChange(starsToPriority(n))}
                    title={n === 1 ? 'Низкий — можно не спешить' : n === 2 ? 'Обычный — как все' : 'Важная задача'}
                >
                    ★
                </button>
            ))}
            <span className="priority-picker__hint">
                {stars === 1 ? 'низкий' : stars === 2 ? 'обычный' : 'важно'}
            </span>
        </div>
    )
}

export default PriorityStars
