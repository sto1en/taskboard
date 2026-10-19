import ShopPreview from './ShopPreview'
import ShopPrice from './ShopPrice'
import useT from '../../hooks/useT'

const NEW_DAYS = 7

function isNew(createdAt) {
    if (!createdAt) return false
    const created = new Date(createdAt).getTime()
    return (Date.now() - created) < NEW_DAYS * 24 * 60 * 60 * 1000
}

function hasDiscount(price, oldPrice) {
    return oldPrice != null && oldPrice > price
}

export default function AvatarCard({ item, onBuy, onEquip, userFrame }) {
    const t = useT()
    const owned = item.owned
    const active = item.active

    const showNew = isNew(item.createdAt)
    const showDiscount = hasDiscount(item.price, item.oldPrice)
    const discountPct = showDiscount
        ? Math.round((1 - item.price / item.oldPrice) * 100)
        : 0

    return (
        <div className={`shop-card ${active ? 'shop-card--active' : ''}`}>
            {(showNew || showDiscount || owned) && (
                <div className="shop-card__badges shop-card__badges--right">
                    {owned && (
                        <span className="shop-badge shop-badge--owned">{t.shopOwned}</span>
                    )}
                    {showNew && <span className="shop-badge shop-badge--new">Новинка</span>}
                    {showDiscount && (
                        <span className="shop-badge shop-badge--discount">−{discountPct}%</span>
                    )}
                </div>
            )}

            <div className="shop-card__preview">
                <ShopPreview kind="avatars" item={item} userFrame={userFrame} />
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

                {item.description && (
                    <div className="shop-card__desc">{item.description}</div>
                )}

                <div className="shop-card__footer">
                    {!owned && (
                        <>
                            <ShopPrice item={item} showDiscount={showDiscount}/>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                {t.shopBuy}
                            </button>
                        </>
                    )}
                    {owned && !active && (
                        <>
                            <ShopPrice item={item} owned/>
                            <button className="btn btn-primary shop-card__btn" onClick={onEquip}>
                                {t.shopEquip}
                            </button>
                        </>
                    )}
                    {owned && active && (
                        <>
                            <ShopPrice item={item} owned/>
                            <span className="shop-card__badge">{t.shopActive}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}