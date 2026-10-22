import ShopPrice from './ShopPrice'
import ShopCartButton from './ShopCartButton'
import useT from '../../hooks/useT'
import { resolveUrl } from '../../utils/format'

const NEW_DAYS = 7

function isNew(createdAt) {
    if (!createdAt) return false
    return (Date.now() - new Date(createdAt).getTime()) < NEW_DAYS * 24 * 60 * 60 * 1000
}

function hasDiscount(price, oldPrice) {
    return oldPrice != null && oldPrice > price
}

/**
 * Карточка фона профиля.
 *
 * Фон рисуется либо загруженной картинкой (imageUrl), либо готовым
 * градиентом из profile.css по cssClass (rose, ocean, ...).
 */
export default function BackgroundCard({ item, onBuy, onEquip, onAddToCart, inCart }) {
    const t = useT()
    const owned = item.owned
    const active = item.active
    const free = !item.price || item.price === 0
    const showNew = isNew(item.createdAt)
    const showDiscount = hasDiscount(item.price, item.oldPrice)
    const discountPct = showDiscount
        ? Math.round((1 - item.price / item.oldPrice) * 100)
        : 0
    const cssClass = item.cssClass || item.code

    const previewStyle = item.imageUrl
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.25)), url(${resolveUrl(item.imageUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }
        : undefined

    return (
        <div
            className={`shop-card shop-card--background ${active ? 'shop-card--active' : ''}`}
            style={{ '--accent-color': 'var(--accent)' }}
        >
            {(showNew || showDiscount || owned) && (
                <div className="shop-card__badges shop-card__badges--right">
                    {owned && <span className="shop-badge shop-badge--owned">{t.shopOwned}</span>}
                    {showNew && <span className="shop-badge shop-badge--new">Новинка</span>}
                    {showDiscount && (
                        <span className="shop-badge shop-badge--discount">−{discountPct}%</span>
                    )}
                </div>
            )}

            <div
                className={`shop-card__preview shop-bg-preview shop-bg-preview--${cssClass}`}
                style={previewStyle}
            >
                <span className="shop-bg-preview__name">{item.title}</span>
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title">{item.title}</div>
                <div className="shop-card__desc">{item.description}</div>

                <div className="shop-card__footer">
                    {!owned && (
                        <>
                            <ShopPrice item={item} showDiscount={showDiscount}/>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                {free ? t.shopGet : t.shopBuy}
                            </button>
                            {onAddToCart && (
                                <ShopCartButton inCart={inCart} onClick={onAddToCart}/>
                            )}
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
                            <span className="shop-card__price shop-card__price--paid">
                                На профиле
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
