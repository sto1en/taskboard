// frontend/src/components/shop/SortToggle.jsx

/**
 * Сортировка магазина.
 *
 * Режимы:
 *   popular — «популярность + новые» (по умолчанию: что чаще покупают)
 *   price   — цена ↑ / ↓
 *   type    — по первой букве названия типа (карточки мультитиповых
 *             предметов повторяются под каждым типом)
 *   default — исходный порядок магазина
 *
 * Повторный клик по активному режиму «price» переворачивает направление,
 * по остальным — возвращает к популярности.
 */

import useT from '../../hooks/useT'

const MODES = ['popular', 'price', 'type', 'default']

export default function SortToggle({ sortBy, sortDir, onChange }) {
    const t = useT()

    const label = (() => {
        if (sortBy === 'price') return sortDir === 'asc' ? t.shopSortPriceAsc : t.shopSortPriceDesc
        if (sortBy === 'type') return t.shopSortType
        if (sortBy === 'default') return t.shopSortDefault
        return t.shopSortPopular
    })()

    const icon = (() => {
        if (sortBy === 'price') return sortDir === 'asc' ? '↑' : '↓'
        if (sortBy === 'type') return 'А'
        if (sortBy === 'default') return '⇅'
        return '🔥'
    })()

    const handleClick = () => {
        if (sortBy === 'popular') {
            onChange('price', 'asc')
        } else if (sortBy === 'price') {
            if (sortDir === 'asc') onChange('price', 'desc')
            else onChange('type', 'asc')
        } else if (sortBy === 'type') {
            onChange('default', 'asc')
        } else {
            onChange('popular', 'desc')
        }
    }

    const handleSelect = (e) => {
        const value = e.target.value
        if (value === 'price-asc') onChange('price', 'asc')
        else if (value === 'price-desc') onChange('price', 'desc')
        else if (value === 'type') onChange('type', 'asc')
        else if (value === 'default') onChange('default', 'asc')
        else onChange('popular', 'desc')
    }

    const selectValue =
        sortBy === 'price' ? `price-${sortDir}` : (sortBy === 'type' ? 'type' : sortBy)

    return (
        <div className="sort-toggle-wrap">
            <select
                className="sort-toggle__select"
                value={selectValue}
                onChange={handleSelect}
                aria-label={t.shopSortCycle}
                title={t.shopSortCycle}
            >
                <option value="popular">{t.shopSortPopular}</option>
                <option value="price-asc">{t.shopSortPriceAsc}</option>
                <option value="price-desc">{t.shopSortPriceDesc}</option>
                <option value="type">{t.shopSortType}</option>
                <option value="default">{t.shopSortDefault}</option>
            </select>

            {/* Быстрый цикл: один клик листает режимы, select даёт явный выбор. */}
            <button
                type="button"
                className={`sort-toggle ${sortBy !== 'default' ? 'sort-toggle--active' : ''}`}
                onClick={handleClick}
                title={t.shopSortCycle}
            >
                <span className="sort-toggle__icon">{icon}</span>
                <span className="sort-toggle__label">{label}</span>
            </button>
        </div>
    )
}

export { MODES }
