import { resolveUrl } from '../../utils/format'

const NEW_DAYS = 7

function isNew(createdAt) {
    if (!createdAt) return false
    const created = new Date(createdAt).getTime()
    return (Date.now() - created) < NEW_DAYS * 24 * 60 * 60 * 1000
}

function hasDiscount(price, oldPrice) {
    return oldPrice != null && oldPrice > price
}

export default function FrameCard({ item, onBuy, onEquip, onUnequip }) {
    const owned = item.owned
    const active = item.active

    const showNew = isNew(item.createdAt)
    const showDiscount = hasDiscount(item.price, item.oldPrice)
    const discountPct = showDiscount
        ? Math.round((1 - item.price / item.oldPrice) * 100)
        : 0

    const imageUrl = item.imageUrl ? resolveUrl(item.imageUrl) : null

    return (
        <div className={`shop-card ${active ? 'shop-card--active' : ''}`}>
            {(showNew || showDiscount) && (
                <div className="shop-card__badges">
                    {showNew && <span className="shop-badge shop-badge--new">Новинка</span>}
                    {showDiscount && (
                        <span className="shop-badge shop-badge--discount">−{discountPct}%</span>
                    )}
                </div>
            )}

            <div className="shop-card__preview">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="shop-card__preview-img"
                        draggable={false}
                    />
                ) : (
                    <div
                        className={`avatar-frame ${item.cssClass || ''}`}
                        style={{ width: 80, height: 80 }}
                    >
                        <div className="avatar-frame__inner">
                            <span className="avatar-frame__initial">Т</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title">{item.title}</div>

                {item.categories && item.categories.length > 0 && (
                    <div className="shop-card__categories">
                        {item.categories.map(c => (
                            <span key={c.id} className="shop-card__category">
                                {c.title}
                            </span>
                        ))}
                    </div>
                )}

                <div className="shop-card__desc">{item.description}</div>

                <div className="shop-card__footer">
                    {!owned && (
                        <>
                            <span className="shop-card__price">
                                {showDiscount && (
                                    <span className="shop-card__price-old">🍃 {item.oldPrice}</span>
                                )}
                                <span className="shop-card__price-current">🍃 {item.price}</span>
                            </span>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                Купить
                            </button>
                        </>
                    )}
                    {owned && !active && (
                        <button className="btn btn-primary shop-card__btn" onClick={onEquip}>
                            Надеть
                        </button>
                    )}
                    {owned && active && (
                        <button className="btn btn-ghost shop-card__btn" onClick={onUnequip}>
                            Снять
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}