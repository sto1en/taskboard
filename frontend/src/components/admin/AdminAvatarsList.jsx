import { useState } from 'react'
import AvatarCard from '../Shop/AvatarCard'
import AdminAvatarEditorModal from './AdminAvatarEditorModal'
import SortArrows from './SortArrows'
import { adminApi } from '../../api/api'
import { getSwapPair, computeNewOrders } from '../../utils/adminSort'

export default function AdminAvatarsList({ avatars, categories, onReload }) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [editingAvatar, setEditingAvatar] = useState(null)
    const [busyId, setBusyId] = useState(null)

    const openCreate = () => { setEditingAvatar(null); setEditorOpen(true) }
    const openEdit = (a) => { setEditingAvatar(a); setEditorOpen(true) }

    const move = async (index, delta) => {
        const pair = getSwapPair(avatars, index, delta)
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
                adminApi.updateAvatar(current.id, fd1),
                adminApi.updateAvatar(neighbor.id, fd2),
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
                <h3 className="admin-section__title">Аватарки ({avatars.length})</h3>
                <button className="btn btn-primary admin-section__add-btn" onClick={openCreate}>
                    + Создать аватарку
                </button>
            </div>

            <div className="shop__grid">
                {avatars.map((a, index) => (
                    <div key={a.id} className="admin-shop-card-wrap">
                        <AvatarCard
                            item={a}
                            onBuy={() => {}}
                            onEquip={() => {}}
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
                            canDown={index < avatars.length - 1}
                            loading={busyId === a.id}
                        />
                    </div>
                ))}

                {avatars.length === 0 && (
                    <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>Пока нет аватарок</div>
                )}
            </div>

            <AdminAvatarEditorModal
                open={editorOpen}
                onClose={() => { setEditorOpen(false); setEditingAvatar(null) }}
                avatar={editingAvatar}
                categories={categories}
                onSaved={onReload}
            />
        </div>
    )
}