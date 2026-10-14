export default function ShopEmptyState({ onReset, message }) {
    return (
        <div className="shop-empty">
            <div className="shop-empty__icon">🔍</div>
            <div className="shop-empty__text">
                {message || 'В этой категории пока ничего нет'}
            </div>
            {onReset && (
                <button className="btn btn-primary shop-empty__btn" onClick={onReset}>
                    Сбросить фильтр
                </button>
            )}
        </div>
    )
}