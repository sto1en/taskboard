import { useState } from 'react'
import AccentCard from '../shop/AccentCard'
import AdminAccentEditorModal from './AdminAccentEditorModal'
import SortArrows from './SortArrows'
import { adminApi } from '../../api/api'
import { getSwapPair, computeNewOrders } from '../../utils/adminSort'

export default function AdminAccentsList({ accents, categories, onReload }) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [busyId, setBusyId] = useState(null)

    const openCreate = () => { setEditing(null); setEditorOpen(true) }
    const openEdit = (a) => { setEditing(a); setEditorOpen(true) }

    const move = async (index, delta) => {
        const pair = getSwapPair(accents, index, delta)
        if (!pair) return
        const [current, neighbor] = pair
        const { currentNew, neighborNew } = computeNewOrders(current, neighbor)

        setBusyId(current.id)
        try {
            const fd1 = new FormData()
            fd1.append('sortOrder', String(currentNew))
            const fd2 = new FormData()
            fd2.append('sortOrder', String(neighborNew))

            await Promise.all([
                adminApi.updateAccent(current.id, fd1),
                adminApi.updateAccent(neighbor.id, fd2),
            ])
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось переместить')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="admin-section">
            <div className="admin-section__head">
                <h3 className="admin-section__title">Акценты ({accents.length})</h3>
                <button className="btn btn-primary admin-section__add-btn" onClick={openCreate}>
                    + Создать акцент
                </button>
            </div>

            <div className="shop__grid">
                {accents.map((a, index) => (
                    <div key={a.id} className="admin-shop-card-wrap">
                        <AccentCard
                            item={a}
                            onBuy={() => {}}
                            onEquip={() => {}}
                            onUnequip={() => {}}
                        />
                        <button
                            type="button"
                            className="admin-shop-card-edit"
                            onClick={(e) => {
                                e.stopPropagation()
                                openEdit(a)
                            }}
                            title="Редактировать"
                        >✎</button>
                        <SortArrows
                            onUp={() => move(index, -1)}
                            onDown={() => move(index, +1)}
                            canUp={index > 0}
                            canDown={index < accents.length - 1}
                            loading={busyId === a.id}
                        />
                    </div>
                ))}

                {accents.length === 0 && (
                    <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>Пока нет акцентов</div>
                )}
            </div>

            <AdminAccentEditorModal
                open={editorOpen}
                onClose={() => { setEditorOpen(false); setEditing(null) }}
                accent={editing}
                categories={categories}
                onSaved={onReload}
            />
        </div>
    )
}