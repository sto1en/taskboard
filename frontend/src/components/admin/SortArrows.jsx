export default function SortArrows({ onUp, onDown, canUp, canDown, loading }) {
    return (
        <div className="sort-arrows">
            <button
                type="button"
                className="sort-arrows__btn"
                onClick={onUp}
                disabled={!canUp || loading}
                title="Вверх"
            >
                ↑
            </button>
            <button
                type="button"
                className="sort-arrows__btn"
                onClick={onDown}
                disabled={!canDown || loading}
                title="Вниз"
            >
                ↓
            </button>
        </div>
    )
}