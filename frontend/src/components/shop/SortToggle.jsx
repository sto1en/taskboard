export default function SortToggle({ sortBy, sortDir, onChange }) {
    const isPrice = sortBy === 'price'
    const isAsc = sortDir === 'asc'

    let label = 'По порядку'
    let icon = '⇅'
    if (isPrice && isAsc) {
        label = 'Цена ↑'
        icon = '↑'
    } else if (isPrice && !isAsc) {
        label = 'Цена ↓'
        icon = '↓'
    }

    const handleClick = () => {
        if (!isPrice) {
            onChange('price', 'asc')
        } else if (isAsc) {
            onChange('price', 'desc')
        } else {
            onChange('default', 'asc')
        }
    }

    return (
        <button
            type="button"
            className={`sort-toggle ${isPrice ? 'sort-toggle--active' : ''}`}
            onClick={handleClick}
            title="Сортировка: по порядку → цена ↑ → цена ↓"
        >
            <span className="sort-toggle__icon">{icon}</span>
            <span className="sort-toggle__label">{label}</span>
        </button>
    )
}