import { useEffect, useMemo, useState } from 'react'
import { adminApi, shopApi } from '../../api/api'

const TYPES = [
    { code: 'TREE', label: 'Деревья' },
    { code: 'FRAME', label: 'Рамки' },
    { code: 'AVATAR', label: 'Аватарки' },
    { code: 'ACCENT', label: 'Акценты' },
]

function isoDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function nextMonday() {
    const d = new Date()
    const diff = (8 - d.getDay()) % 7 || 7
    d.setDate(d.getDate() + diff)
    return isoDate(d)
}

function formatRange(start, end) {
    const fmt = (iso) => {
        if (!iso) return ''
        const d = new Date(`${iso}T00:00:00`)
        return Number.isNaN(d.getTime())
            ? iso
            : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return `${fmt(start)} — ${fmt(end)}`
}

export default function AdminWeeklyRewardTab() {
    const [rewards, setRewards] = useState([])
    const [catalog, setCatalog] = useState({ TREE: [], FRAME: [], AVATAR: [], ACCENT: [] })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const [weekStart, setWeekStart] = useState(nextMonday())
    const [itemType, setItemType] = useState('TREE')
    const [itemCode, setItemCode] = useState('')
    const [enabled, setEnabled] = useState(true)

    const items = useMemo(
        () => catalog[itemType] || [],
        [catalog, itemType],
    )

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

    // При смене типа подставляем первый доступный предмет.
    useEffect(() => {
        if (items.length === 0) {
            setItemCode('')
            return
        }
        if (!items.some(i => i.code === itemCode)) {
            setItemCode(items[0].code)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemType, items])

    const submit = async () => {
        if (!weekStart) {
            setError('Укажи дату недели')
            return
        }
        if (!itemCode) {
            setError('Выбери предмет')
            return
        }
        setSaving(true)
        setError(null)
        try {
            await adminApi.saveWeeklyReward({
                weekStart,
                itemType,
                itemCode,
                enabled,
            })
            await load()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const editRow = (row) => {
        setWeekStart(row.weekStart)
        setItemType(row.itemType)
        setItemCode(row.itemCode)
        setEnabled(Boolean(row.enabled))
    }

    const removeRow = async (row) => {
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

            <div className="admin-weekly__form">
                <div className="admin-weekly__form-title">Настроить подарок</div>
                <div className="admin-weekly__grid">
                    <label className="admin-weekly__field">
                        <span>Неделя (понедельник)</span>
                        <input
                            type="date"
                            className="input"
                            value={weekStart}
                            onChange={e => setWeekStart(e.target.value)}
                        />
                    </label>
                    <label className="admin-weekly__field">
                        <span>Тип</span>
                        <select
                            className="input"
                            value={itemType}
                            onChange={e => setItemType(e.target.value)}
                        >
                            {TYPES.map(t => (
                                <option key={t.code} value={t.code}>{t.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-weekly__field admin-weekly__field--wide">
                        <span>Предмет</span>
                        <select
                            className="input"
                            value={itemCode}
                            onChange={e => setItemCode(e.target.value)}
                        >
                            {items.length === 0 && <option value="">Нет предметов</option>}
                            {items.map(i => (
                                <option key={i.code} value={i.code}>
                                    {i.title} · {i.code}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-weekly__check">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={e => setEnabled(e.target.checked)}
                        />
                        <span>Включён</span>
                    </label>
                </div>
                <div className="admin-weekly__hint">
                    Игроки, закрывшие 5 задач за эту неделю, смогут забрать предмет
                    в магазине. Одна и та же неделя перезаписывается.
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submit}
                    disabled={saving || loading}
                >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>

            <div className="admin-weekly__list">
                <div className="admin-weekly__list-title">Расписание</div>
                {loading && <div className="loading">Загрузка...</div>}
                {!loading && rewards.length === 0 && (
                    <div className="admin-weekly__empty">Подарки ещё не настроены</div>
                )}
                {!loading && rewards.length > 0 && (
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
                        {rewards.map(row => (
                            <tr key={row.id}>
                                <td>{formatRange(row.weekStart, row.weekEnd)}</td>
                                <td>{row.itemTitle}<span className="admin-weekly__code">{row.itemCode}</span></td>
                                <td>{TYPES.find(t => t.code === row.itemType)?.label || row.itemType}</td>
                                <td>
                                    <span className={`admin-weekly__status ${row.enabled ? 'admin-weekly__status--on' : ''}`}>
                                        {row.enabled ? 'Включён' : 'Выключен'}
                                    </span>
                                </td>
                                <td className="admin-weekly__actions">
                                    <button className="btn btn-ghost" onClick={() => editRow(row)}>
                                        Изменить
                                    </button>
                                    <button className="btn btn-icon btn-icon--danger" onClick={() => removeRow(row)}>
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
