import { useMemo } from 'react'
import GiftItemThumb from './GiftItemThumb'
import {
    addDays,
    formatRange,
    formatWeekday,
    mondayOf,
    pluralize,
} from './weeklyGiftUtils'

/**
 * «Корзина» подарков: выбранные предметы + дата недели рядом с каждым.
 * Сохраняются все строки сразу, поэтому администратор может запланировать
 * несколько недель за один заход.
 */
export default function WeeklyGiftCart({
                                            cart,
                                            catalogMap,
                                            rewards,
                                            onUpdate,
                                            onRemove,
                                            onClear,
                                            onSave,
                                            saving,
                                        }) {
    const existingByWeek = useMemo(() => {
        const map = new Map()
        rewards.forEach((r) => map.set(r.weekStart, r))
        return map
    }, [rewards])

    const duplicateWeeks = useMemo(() => {
        const seen = new Set()
        const dup = new Set()
        cart.forEach((row) => {
            const monday = mondayOf(row.weekStart)
            if (!monday) return
            if (seen.has(monday)) dup.add(monday)
            seen.add(monday)
        })
        return dup
    }, [cart])

    const canSave = cart.length > 0 && !saving && duplicateWeeks.size === 0

    return (
        <div className="weekly-cart">
            <div className="weekly-cart__head">
                <div>
                    <h3 className="weekly-cart__title">Корзина</h3>
                    <p className="weekly-cart__subtitle">
                        {cart.length === 0
                            ? 'Выбери предметы слева'
                            : `${cart.length} ${pluralize(cart.length, ['предмет', 'предмета', 'предметов'])}`}
                    </p>
                </div>
                {cart.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-ghost weekly-cart__clear"
                        onClick={onClear}
                        disabled={saving}
                    >
                        Очистить
                    </button>
                )}
            </div>

            {cart.length === 0 ? (
                <div className="weekly-cart__empty">
                    <span className="weekly-cart__empty-icon" aria-hidden="true">🛒</span>
                    <p>Кликни по иконке предмета — он появится здесь.</p>
                    <p className="weekly-cart__empty-hint">
                        Дату можно поставить рядом с каждым предметом.
                    </p>
                </div>
            ) : (
                <div className="weekly-cart__rows">
                    {cart.map((row) => {
                        const monday = mondayOf(row.weekStart)
                        const existing = existingByWeek.get(monday)
                        const duplicate = duplicateWeeks.has(monday)
                        const item = catalogMap.get(row.key)

                        return (
                            <div
                                key={row.key}
                                className={`weekly-cart__row ${duplicate ? 'weekly-cart__row--error' : ''}`}
                            >
                                <GiftItemThumb
                                    itemType={row.itemType}
                                    item={item}
                                    size={44}
                                />

                                <div className="weekly-cart__item">
                                    <div className="weekly-cart__item-title">
                                        {row.title || item?.title || row.itemCode}
                                    </div>
                                    <div className="weekly-cart__item-meta">
                                        {row.itemType} · {row.itemCode}
                                    </div>
                                </div>

                                <div className="weekly-cart__date">
                                    <label className="weekly-cart__date-label">
                                        <span>Неделя</span>
                                        <input
                                            type="date"
                                            className={`input ${duplicate ? 'input--error' : ''}`}
                                            value={row.weekStart}
                                            onChange={(e) => onUpdate(row.key, {
                                                weekStart: e.target.value,
                                            })}
                                            disabled={saving}
                                        />
                                    </label>
                                    {monday && (
                                        <div className="weekly-cart__date-hint">
                                            {formatWeekday(monday)} · {formatRange(monday, addDays(monday, 6))}
                                        </div>
                                    )}
                                    {duplicate && (
                                        <div className="weekly-cart__date-error">
                                            На эту неделю уже есть предмет в корзине
                                        </div>
                                    )}
                                    {!duplicate && existing && (
                                        <div className="weekly-cart__replace">
                                            Заменит: {existing.itemTitle}
                                        </div>
                                    )}
                                </div>

                                <label className="weekly-cart__enabled">
                                    <input
                                        type="checkbox"
                                        checked={row.enabled}
                                        onChange={(e) => onUpdate(row.key, {
                                            enabled: e.target.checked,
                                        })}
                                        disabled={saving}
                                    />
                                    <span>Вкл.</span>
                                </label>

                                <button
                                    type="button"
                                    className="btn btn-icon btn-icon--danger weekly-cart__remove"
                                    onClick={() => onRemove(row.key)}
                                    disabled={saving}
                                    title="Убрать из корзины"
                                >
                                    ×
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="weekly-cart__footer">
                <div className="weekly-cart__hint">
                    Одна неделя — один подарок. Если дата совпадает с уже
                    сохранённой, подарок будет заменён.
                </div>
                <button
                    type="button"
                    className="btn btn-primary weekly-cart__save"
                    onClick={onSave}
                    disabled={!canSave}
                >
                    {saving
                        ? 'Сохранение...'
                        : cart.length > 0
                            ? `Сохранить (${cart.length})`
                            : 'Сохранить'}
                </button>
            </div>
        </div>
    )
}
