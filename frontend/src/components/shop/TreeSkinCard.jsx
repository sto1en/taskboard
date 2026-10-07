export default function TreeSkinCard({ item, onBuy, onEquip, onUnequip }) {
    const owned = item.owned
    const active = item.active

    return (
        <div className={`shop-card ${active ? 'shop-card--active' : ''}`}>
            <div className="shop-card__preview">
                <div className={`tree-skin-preview tree-skin-preview--${item.code}`}>
                    <span className="tree-skin-preview__emoji">
                        {item.code === 'xmas' ? '🎄'
                            : item.code === 'apple' ? '🍎'
                                : item.code === 'palm' ? '🌴'
                                    : item.code === 'birch' ? '🌳'
                                        : item.code === 'sakura' ? '🌸'
                                            : item.code === 'neon' ? '✨'
                                                : item.code === 'crystal' ? '💎'
                                                    : '🌳'}
                    </span>
                </div>
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title">{item.title}</div>
                <div className="shop-card__desc">{item.description}</div>
                <div className="shop-card__footer">
                    {!owned && (
                        <>
                            <span className="shop-card__price">
                                {item.price === 0 ? 'Бесплатно' : `🍃 ${item.price}`}
                            </span>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                {item.price === 0 ? 'Получить' : 'Купить'}
                            </button>
                        </>
                    )}
                    {owned && !active && (
                        <button className="btn btn-primary shop-card__btn" onClick={onEquip}>Надеть</button>
                    )}
                    {owned && active && (
                        <button className="btn btn-ghost shop-card__btn" onClick={onUnequip}>Снять</button>
                    )}
                </div>
            </div>
        </div>
    )
}