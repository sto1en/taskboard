import { useEffect, useMemo, useState } from 'react'
import { adminApi, shopApi } from '../../api/api'
import GiftItemThumb from './GiftItemThumb'
import WeeklyGiftPicker from './WeeklyGiftPicker'
import WeeklyGiftCart from './WeeklyGiftCart'
import {
    GIFT_TYPES,
    formatRange,
    isoDate,
    mondayOf,
    nextMonday,
} from './weeklyGiftUtils'

/**
 * Подарок недели в админке.
 *
 * Вместо выпадающих списков — витрина с иконками, как в магазине.
 * Выбранные предметы попадают в корзину, где рядом с каждым ставится дата.
 * Сохранение отправляет все строки корзины разом.
 */
export default function AdminWeeklyRewardTab() {
    const [rewards, setRewards] = useState([])
    const [catalog, setCatalog] = useState({
        TREE: [],
        FRAME: [],
        AVATAR: [],
        ACCENT: [],
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const [activeType, setActiveType] = useState('TREE')
    const [query, setQuery] = useState('')
    const [cart, setCart] = useState([])

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [r, shop] = await Promise.all([
                adminApi.listWeeklyRewards(),
                shopApi.get(),
            ])
            setRewards(r.data || [])

            const data = shop.data || {}
            setCatalog({
                TREE: data.treeSkins || [],
                FRAME: data.frames || [],
                AVATAR: data.avatars || [],
                ACCENT: data.accents || [],
            })
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const catalogMap = useMemo(() => {
        const map = new Map()
        Object.entries(catalog).forEach(([type, items]) => {
            items.forEach((item) => map.set(`${type}:${item.code}`, item))
        })
        return map
    }, [catalog])

    const selectedKeys = useMemo(
        () => new Set(cart.map((row) => row.key)),
        [cart],
    )

    /** Ближайший понедельник, которого нет ни в корзине, ни в расписании. */
    const nextFreeMonday = (usedWeeks) => {
        const d = new Date(`${nextMonday()}T00:00:00`)
        while (usedWeeks.has(isoDate(d))) {
            d.setDate(d.getDate() + 7)
        }
        return isoDate(d)
    }

    const toggleItem = (type, item) => {
        const key = `${type}:${item.code}`

        setCart((prev) => {
            if (prev.some((row) => row.key === key)) {
                return prev.filter((row) => row.key !== key)
            }

            const used = new Set([
                ...prev.map((row) => mondayOf(row.weekStart)),
                ...rewards.map((row) => row.weekStart),
            ])

            return [
                ...prev,
                {
                    key,
                    itemType: type,
                    itemCode: item.code,
                    title: item.title,
                    weekStart: nextFreeMonday(used),
                    enabled: true,
                },
            ]
        })
    }

    const updateRow = (key, patch) => {
        setCart((prev) => prev.map((row) => (
            row.key === key ? { ...row, ...patch } : row
        )))
    }

    const removeRow = (key) => {
        setCart((prev) => prev.filter((row) => row.key !== key))
    }

    const saveAll = async () => {
        if (cart.length === 0) return

        const invalid = cart.find((row) => !row.weekStart || !row.itemCode)
        if (invalid) {
            setError('У каждого предмета должна быть дата')
            return
        }

        const weeks = cart.map((row) => mondayOf(row.weekStart))
        if (new Set(weeks).size !== weeks.length) {
            setError('На одну неделю назначено несколько подарков — выбери разные даты')
            return
        }

        setSaving(true)
        setError(null)
        try {
            await Promise.all(cart.map((row) => adminApi.saveWeeklyReward({
                weekStart: row.weekStart,
                itemType: row.itemType,
                itemCode: row.itemCode,
                enabled: row.enabled,
            })))
            await load()
            setCart([])
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const editReward = (row) => {
        const key = `${row.itemType}:${row.itemCode}`
        setActiveType(row.itemType)
        setCart((prev) => {
            const without = prev.filter((r) => r.key !== key)
            return [
                ...without,
                {
                    key,
                    itemType: row.itemType,
                    itemCode: row.itemCode,
                    title: row.itemTitle,
                    weekStart: row.weekStart,
                    enabled: Boolean(row.enabled),
                },
            ]
        })
        requestAnimationFrame(() => {
            document.querySelector('.weekly-cart')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        })
    }

    const removeReward = async (row) => {
        if (!confirm(`Удалить подарок на ${formatRange(row.weekStart, row.weekEnd)}?`)) return
        try {
            await adminApi.deleteWeeklyReward(row.id)
            await load()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    return (
        <div className="admin-weekly">
            {error && <div className="profile-msg profile-msg--error">{error}</div>}

            {loading && <div className="loading">Загрузка...</div>}

            {!loading && (
                <>
                    <div className="admin-weekly__builder">
                        <section className="admin-weekly__catalog">
                            <div className="admin-weekly__section-head">
                                <div>
                                    <h3 className="admin-weekly__section-title">Витрина</h3>
                                    <p className="admin-weekly__section-sub">
                                        Выбери предметы — они попадут в корзину
                                    </p>
                                </div>
                                <span className="admin-weekly__selected">
                                    Выбрано: {cart.length}
                                </span>
                            </div>

                            <WeeklyGiftPicker
                                catalog={catalog}
                                activeType={activeType}
                                onTypeChange={setActiveType}
                                query={query}
                                onQueryChange={setQuery}
                                selectedKeys={selectedKeys}
                                onToggle={toggleItem}
                            />
                        </section>

                        <aside className="admin-weekly__cart-col">
                            <WeeklyGiftCart
                                cart={cart}
                                catalogMap={catalogMap}
                                rewards={rewards}
                                onUpdate={updateRow}
                                onRemove={removeRow}
                                onClear={() => setCart([])}
                                onSave={saveAll}
                                saving={saving}
                            />
                        </aside>
                    </div>

                    <section className="admin-weekly__list">
                        <div className="admin-weekly__section-head">
                            <div>
                                <h3 className="admin-weekly__section-title">Расписание</h3>
                                <p className="admin-weekly__section-sub">
                                    Игроки, закрывшие 5 задач за неделю, забирают подарок в магазине
                                </p>
                            </div>
                        </div>

                        {rewards.length === 0 && (
                            <div className="admin-weekly__empty">Подарки ещё не настроены</div>
                        )}

                        {rewards.length > 0 && (
                            <table className="admin-weekly__table">
                                <thead>
                                <tr>
                                    <th>Неделя</th>
                                    <th>Предмет</th>
                                    <th>Тип</th>
                                    <th>Статус</th>
                                    <th/>
                                </tr>
                                </thead>
                                <tbody>
                                {rewards.map((row) => {
                                    const item = catalogMap.get(`${row.itemType}:${row.itemCode}`)
                                        || { code: row.itemCode, title: row.itemTitle }

                                    return (
                                        <tr key={row.id}>
                                            <td>
                                                {formatRange(row.weekStart, row.weekEnd)}
                                            </td>
                                            <td>
                                                <div className="admin-weekly__item">
                                                    <GiftItemThumb
                                                        itemType={row.itemType}
                                                        item={item}
                                                        size={38}
                                                    />
                                                    <div>
                                                        <div className="admin-weekly__item-title">
                                                            {row.itemTitle}
                                                        </div>
                                                        <div className="admin-weekly__code">
                                                            {row.itemCode}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {GIFT_TYPES.find((t) => t.code === row.itemType)?.label
                                                    || row.itemType}
                                            </td>
                                            <td>
                                                <span className={`admin-weekly__status ${row.enabled ? 'admin-weekly__status--on' : ''}`}>
                                                    {row.enabled ? 'Включён' : 'Выключен'}
                                                </span>
                                            </td>
                                            <td className="admin-weekly__actions">
                                                <button
                                                    className="btn btn-ghost"
                                                    onClick={() => editReward(row)}
                                                >
                                                    Изменить
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-icon--danger"
                                                    onClick={() => removeReward(row)}
                                                    title="Удалить"
                                                >
                                                    🗑
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
