// frontend/src/components/shop/ShopCartDrawer.jsx

import { formatPrice, resolveUrl } from '../../utils/format'
import { CART_TYPE_LABEL, cartTotal } from '../../utils/shopCart'
import useT from '../../hooks/useT'

/**
 * Выдвижная корзина магазина.
 *
 * Позиции складываются на клиенте, а оплата — один запрос на сервер
 * (одна транзакция: либо покупается всё, либо ничего). Поэтому кнопка
 * «Оформить» блокируется, если листьев заведомо не хватает.
 */
export default function ShopCartDrawer({
    open,
    items,
    leaves,
    busy,
    error,
    success,
    onClose,
    onRemove,
    onClear,
    onCheckout,
}) {
    const t = useT()
    const total = cartTotal(items)
    const empty = items.length === 0
    const notEnough = total > (leaves ?? 0)

    if (!open) return null

    const art = (item) => {
        const src = resolveUrl(item.imageUrl)
        if (src) {
            return <img className="cart-row__img" src={src} alt="" loading="lazy"/>
        }
        if (item.hexColor) {
            return (
                <span
                    className="cart-row__swatch"
                    style={{
                        background: item.isGradient && item.hexColorSecondary
                            ? `linear-gradient(120deg, ${item.hexColor} 0%, ${item.hexColorSecondary} 100%)`
                            : item.hexColor,
                    }}
                    aria-hidden="true"
                />
            )
        }
        return <span className="cart-row__emoji" aria-hidden="true">{item.emoji || '🛍️'}</span>
    }

    return (
        <div className="cart-drawer" onClick={onClose}>
            <aside
                className="cart-drawer__panel"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t.cartTitle}
            >
                <header className="cart-drawer__head">
                    <div>
                        <h2 className="cart-drawer__title">🛒 {t.cartTitle}</h2>
                        <div className="cart-drawer__sub">
                            {empty
                                ? t.cartEmpty
                                : `${items.length} ${items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}`}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="cart-drawer__close"
                        onClick={onClose}
                        aria-label={t.cartClose}
                    >✕</button>
                </header>

                {empty ? (
                    <div className="cart-drawer__empty">
                        <span className="cart-drawer__empty-icon" aria-hidden="true">🧺</span>
                        <p>{t.cartEmptyHint}</p>
                    </div>
                ) : (
                    <div className="cart-drawer__list">
                        {items.map(item => (
                            <div key={`${item.type}:${item.id}`} className="cart-row">
                                <span className="cart-row__art">{art(item)}</span>
                                <span className="cart-row__body">
                                    <span className="cart-row__title" title={item.title}>{item.title}</span>
                                    <span className="cart-row__type">{CART_TYPE_LABEL[item.type] || 'Товар'}</span>
                                </span>
                                <span className="cart-row__price">
                                    {item.price > 0 ? `🍃 ${formatPrice(item.price)}` : t.shopFree}
                                </span>
                                <button
                                    type="button"
                                    className="cart-row__remove"
                                    onClick={() => onRemove(item)}
                                    aria-label={t.cartRemove}
                                    title={t.cartRemove}
                                >✕</button>
                            </div>
                        ))}
                    </div>
                )}

                {error && <div className="cart-drawer__notice cart-drawer__notice--error">{error}</div>}
                {success && <div className="cart-drawer__notice cart-drawer__notice--ok">{success}</div>}

                <footer className="cart-drawer__foot">
                    <div className="cart-drawer__sum">
                        <span>{t.cartTotal}</span>
                        <b>🍃 {formatPrice(total)}</b>
                    </div>
                    <div className="cart-drawer__balance">
                        {t.cartBalance}: <b>🍃 {formatPrice(leaves ?? 0)}</b>
                        {!empty && !notEnough && (
                            <span className="cart-drawer__after">
                                · {t.cartAfter}: 🍃 {formatPrice((leaves ?? 0) - total)}
                            </span>
                        )}
                    </div>
                    {notEnough && !empty && (
                        <div className="cart-drawer__notice cart-drawer__notice--error">
                            {t.cartNotEnough}
                        </div>
                    )}

                    <div className="cart-drawer__actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClear}
                            disabled={empty || busy}
                        >
                            {t.cartClear}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary cart-drawer__checkout"
                            onClick={onCheckout}
                            disabled={empty || busy || notEnough}
                        >
                            {busy ? t.loading : t.cartCheckout}
                        </button>
                    </div>
                </footer>
            </aside>
        </div>
    )
}
