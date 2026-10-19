// frontend/src/components/shop/ShopPrice.jsx

/**
 * Ценник магазина.
 *
 * Три состояния:
 *   • не куплено   — текущая цена (+ зачёркнутая старая, если есть скидка)
 *   • куплено      — сколько листьев за предмет реально отдали
 *   • подарено     — pricePaid == null (награда за ачивку), цену не показываем
 *
 * Раньше «Куплено за 🍃 N» рисовалось двумя строками в узком футере карточки
 * и упиралось в кнопку. Теперь слово «Куплено» — бейдж в углу карточки
 * (см. .shop-badge--owned), а здесь остаётся одна строка с ценой.
 */

import { formatPrice } from '../../utils/format'
import useT from '../../hooks/useT'
import LeafIcon from './LeafIcon'

export default function ShopPrice({ item, owned = false, showDiscount = false }) {
    const t = useT()
    const free = !item.price || item.price === 0

    if (owned) {
        if (item.pricePaid == null) {
            return (
                <span className="shop-card__price shop-card__price--gift" title={t.shopGifted}>
                    🎁
                </span>
            )
        }
        return (
            <span className="shop-card__price shop-card__price--paid" title={t.shopPaidFor(item.pricePaid)}>
                <span className="shop-card__price-current">
                    {item.pricePaid === 0
                        ? t.shopFree
                        : <><LeafIcon/>{formatPrice(item.pricePaid)}</>}
                </span>
            </span>
        )
    }

    return (
        <span className="shop-card__price">
            {showDiscount && (
                <span className="shop-card__price-old">
                    <LeafIcon size={11}/>{formatPrice(item.oldPrice)}
                </span>
            )}
            <span className="shop-card__price-current">
                {free ? t.shopFree : <><LeafIcon/>{formatPrice(item.price)}</>}
            </span>
        </span>
    )
}
