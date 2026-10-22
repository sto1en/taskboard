// frontend/src/utils/shopCart.js

/**
 * Корзина магазина.
 *
 * Живёт в localStorage отдельно для каждого аккаунта: гостю корзина не нужна,
 * а после перелогина чужой набор товаров показывать нельзя. Храним минимум
 * полей для отрисовки (тип, id, название, цена, превью), но цену при оплате
 * всё равно пересчитывает сервер — см. POST /api/shop/cart/checkout.
 */

const PREFIX = 'taskboard.shop.cart.v1'

/** Типы позиций корзины совпадают с типами /api/shop/cart/checkout. */
export const CART_TYPE_LABEL = {
    avatar: 'Аватарка',
    frame: 'Рамка',
    tree: 'Дерево',
    accent: 'Акцент',
    background: 'Фон профиля',
}

export function cartKey(userId) {
    return `${PREFIX}.${userId ?? 'guest'}`
}

export function cartItemId(type, id) {
    return `${type}:${id}`
}

export function readCart(userId) {
    try {
        const raw = localStorage.getItem(cartKey(userId))
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        return parsed
            .filter(it => it && it.type && it.id != null)
            .map(it => ({
                type: String(it.type),
                id: it.id,
                title: it.title || 'Товар',
                price: Number(it.price) || 0,
                imageUrl: it.imageUrl || null,
                emoji: it.emoji || null,
                hexColor: it.hexColor || null,
                hexColorSecondary: it.hexColorSecondary || null,
                isGradient: Boolean(it.isGradient),
            }))
    } catch {
        return []
    }
}

export function writeCart(userId, items) {
    try {
        if (!items || items.length === 0) {
            localStorage.removeItem(cartKey(userId))
        } else {
            localStorage.setItem(cartKey(userId), JSON.stringify(items))
        }
    } catch {
        /* приватный режим / переполнение — корзина просто не сохранится */
    }
}

export function cartTotal(items) {
    return (items || []).reduce((sum, it) => sum + (Number(it.price) || 0), 0)
}

/** Превращает карточку магазина в позицию корзины. */
export function toCartItem(item, type) {
    return {
        type,
        id: item.id,
        title: item.title,
        price: Number(item.price) || 0,
        imageUrl: item.imageUrl || null,
        emoji: item.emoji || null,
        hexColor: item.hexColor || null,
        hexColorSecondary: item.hexColorSecondary || null,
        isGradient: Boolean(item.isGradient),
    }
}
