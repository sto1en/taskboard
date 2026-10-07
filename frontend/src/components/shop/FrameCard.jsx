export default function FrameCard({ item, onBuy, onEquip, onUnequip }) {
    const owned = item.owned
    const active = item.active

    return (
        <div className={`shop-card ${active ? 'shop-card--active' : ''}`}>
            <div className="shop-card__preview">
                <div className={`avatar-frame ${item.cssClass || ''}`}
                     style={{ width: 80, height: 80 }}>
                    <div className="avatar-frame__inner">
                        <span className="avatar-frame__initial">Т</span>
                    </div>
                </div>
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title">{item.title}</div>
                <div className="shop-card__desc">{item.description}</div>
                <div className="shop-card__footer">
                    {!owned && (
                        <>
                            <span className="shop-card__price">🍃 {item.price}</span>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>Купить</button>
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