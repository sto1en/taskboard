import { useState } from 'react'
import FrameCard from '../Shop/FrameCard'
import AdminFrameEditorModal from './AdminFrameEditorModal'
import SortArrows from './SortArrows'
import { adminApi } from '../../api/api'
import { getSwapPair, computeNewOrders } from '../../utils/adminSort'

export default function AdminFramesList({ frames, categories, onReload }) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [busyId, setBusyId] = useState(null)

    const openCreate = () => { setEditing(null); setEditorOpen(true) }
    const openEdit = (f) => { setEditing(f); setEditorOpen(true) }

    const move = async (index, delta) => {
        const pair = getSwapPair(frames, index, delta)
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
                adminApi.updateFrame(current.id, fd1),
                adminApi.updateFrame(neighbor.id, fd2),
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
                <h3 className="admin-section__title">Рамки ({frames.length})</h3>
                <button className="btn btn-primary admin-section__add-btn" onClick={openCreate}>
                    + Создать рамку
                </button>
            </div>

            <div className="shop__grid">
                {frames.map((f, index) => (
                    <div key={f.id} className="admin-shop-card-wrap">
                        <FrameCard
                            item={f}
                            onBuy={() => {}}
                            onEquip={() => {}}
                            onUnequip={() => {}}
                        />
                        <button
                            type="button"
                            className="admin-shop-card-edit"
                            onClick={(e) => {
                                e.stopPropagation()
                                openEdit(f)
                            }}
                            title="Редактировать"
                        >✎</button>
                        <SortArrows
                            onUp={() => move(index, -1)}
                            onDown={() => move(index, +1)}
                            canUp={index > 0}
                            canDown={index < frames.length - 1}
                            loading={busyId === f.id}
                        />
                    </div>
                ))}

                {frames.length === 0 && (
                    <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>Пока нет рамок</div>
                )}
            </div>

            <AdminFrameEditorModal
                open={editorOpen}
                onClose={() => { setEditorOpen(false); setEditing(null) }}
                frame={editing}
                categories={categories}
                onSaved={onReload}
            />
        </div>
    )
}