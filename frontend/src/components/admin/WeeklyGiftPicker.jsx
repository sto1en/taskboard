import { useMemo } from 'react'
import GiftItemThumb from './GiftItemThumb'
import { GIFT_TYPES } from './weeklyGiftUtils'

/**
 * «Витрина» подарка недели: те же предметы, что в магазине, но клик по
 * плитке не покупает, а кладёт предмет в корзину справа.
 */
export default function WeeklyGiftPicker({
                                              catalog,
                                              activeType,
                                              onTypeChange,
                                              query,
                                              onQueryChange,
                                              selectedKeys,
                                              onToggle,
                                          }) {
    const filtered = useMemo(() => {
        const items = catalog[activeType] || []
        const q = query.trim().toLowerCase()
        if (!q) return items
        return items.filter((item) =>
            (item.title || '').toLowerCase().includes(q)
            || (item.code || '').toLowerCase().includes(q),
        )
    }, [catalog, activeType, query])

    return (
        <div className="weekly-picker">
            <div className="weekly-picker__tabs">
                {GIFT_TYPES.map((type) => (
                    <button
                        key={type.code}
                        type="button"
                        className={`weekly-picker__tab ${activeType === type.code ? 'weekly-picker__tab--active' : ''}`}
                        onClick={() => onTypeChange(type.code)}
                    >
                        <span aria-hidden="true">{type.icon}</span>
                        <span>{type.label}</span>
                        <span className="weekly-picker__tab-count">
                            {(catalog[type.code] || []).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="weekly-picker__search-row">
                <input
                    className="input weekly-picker__search"
                    placeholder="Поиск по названию или коду"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
            </div>

            <div className="weekly-picker__grid">
                {filtered.map((item) => {
                    const key = `${activeType}:${item.code}`
                    const selected = selectedKeys.has(key)

                    return (
                        <button
                            key={key}
                            type="button"
                            className={`weekly-picker__tile ${selected ? 'weekly-picker__tile--selected' : ''}`}
                            onClick={() => onToggle(activeType, item)}
                            aria-pressed={selected}
                            title={selected ? 'Убрать из корзины' : 'Добавить в корзину'}
                        >
                            <span className="weekly-picker__tile-preview">
                                <GiftItemThumb
                                    itemType={activeType}
                                    item={item}
                                    size={54}
                                />
                            </span>
                            <span className="weekly-picker__tile-title">{item.title}</span>
                            <span className="weekly-picker__tile-code">{item.code}</span>
                            {selected && (
                                <span className="weekly-picker__tile-check" aria-hidden="true">✓</span>
                            )}
                        </button>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="weekly-picker__empty">
                        {(catalog[activeType] || []).length === 0
                            ? 'В магазине пока нет предметов этого типа'
                            : 'Ничего не найдено'}
                    </div>
                )}
            </div>
        </div>
    )
}
