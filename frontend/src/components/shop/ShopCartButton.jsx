// frontend/src/components/shop/ShopCartButton.jsx

/**
 * Кнопка «в корзину» рядом с «Купить».
 *
 * Корзина живёт на странице магазина (ShopPage), карточки только получают
 * обработчик и флаг «уже добавлено» — так один и тот же компонент карточки
 * работает и в админке, и без корзины.
 */
export default function ShopCartButton({ inCart, onClick }) {
    return (
        <button
            type="button"
            className={`btn btn-ghost shop-card__cart ${inCart ? 'shop-card__cart--in' : ''}`}
            onClick={onClick}
            title={inCart ? 'Убрать из корзины' : 'Добавить в корзину'}
            aria-label={inCart ? 'Убрать из корзины' : 'Добавить в корзину'}
        >
            {inCart ? '✓' : '🛒'}
        </button>
    )
}
