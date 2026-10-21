import ShopPreview, { accentVars } from './ShopPreview'
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

export default function AccentCard({ item, onBuy, onEquip, onUnequip }) {
    const t = useT()
    const owned = item.owned
    const active = item.active

    const showNew = isNew(item.createdAt)
    const showDiscount = hasDiscount(item.price, item.oldPrice)
    const discountPct = showDiscount
        ? Math.round((1 - item.price / item.oldPrice) * 100)
        : 0
    const free = !item.price || item.price === 0
    // The holographic accent gets an animated rainbow outline when equipped.
    // Other accents keep a solid outline in their own accent color.
    const isHolo = item.code === 'hologram' || item.isHologram === true

    return (
        <div
            className={`shop-card shop-card--accent ${active ? 'shop-card--active' : ''} ${item.isRare ? 'shop-card--rare' : ''} ${isHolo ? 'shop-card--holo' : ''}`}
            data-accent={item.code}
            style={accentVars(item)}
        >
            {(showNew || showDiscount || item.isRare || owned || item.rewardOnly) && (
                <div className="shop-card__badges shop-card__badges--right">
                    {owned && (
                        <span className="shop-badge shop-badge--owned">{t.shopOwned}</span>
                    )}
                    {item.rewardOnly && (
                        <span className="shop-badge shop-badge--reward">{t.shopRewardOnly}</span>
                    )}
                    {item.isRare && (
                        <span className="shop-badge shop-badge--rare">{t.shopRare}</span>
                    )}
                    {showNew && <span className="shop-badge shop-badge--new">Новинка</span>}
                    {showDiscount && (
                        <span className="shop-badge shop-badge--discount">−{discountPct}%</span>
                    )}
                </div>
            )}

            <div className="shop-card__preview">
                <ShopPreview kind="accents" item={item} />
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
                    {!owned && item.rewardOnly && (
                        <span
                            className="shop-card__price shop-card__price--gift"
                            title={t.shopNotForSale}
                        >
                            🎁 {t.shopRewardOnly}
                        </span>
                    )}
                    {!owned && !item.rewardOnly && (
                        <>
                            <ShopPrice item={item} showDiscount={showDiscount}/>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                {free ? t.shopGet : t.shopBuy}
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
                            <button className="btn btn-ghost shop-card__btn" onClick={onUnequip}>
                                {t.shopUnequip}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}