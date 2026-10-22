import { useState } from 'react'
import { adminApi } from '../../api/api'
import { resolveUrl } from '../../utils/format'
import { getSwapPair, computeNewOrders } from '../../utils/adminSort'
import AdminBackgroundEditorModal from './AdminBackgroundEditorModal'
import SortArrows from './SortArrows'

function BackgroundThumb({ bg }) {
    const css = bg.cssClass || bg.code
    const style = bg.imageUrl
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.25)), url(${resolveUrl(bg.imageUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }
        : undefined

    return (
        <div
            className={`admin-bg-thumb shop-bg-preview shop-bg-preview--${css}`}
            style={style}
        >
            <span className="admin-bg-thumb__name">{bg.title}</span>
        </div>
    )
}

export default function AdminBackgroundsList({ backgrounds, onReload }) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [busyId, setBusyId] = useState(null)

    const openCreate = () => { setEditing(null); setEditorOpen(true) }
    const openEdit = (bg) => { setEditing(bg); setEditorOpen(true) }

    const move = async (index, delta) => {
        const pair = getSwapPair(backgrounds, index, delta)
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
                adminApi.updateBackground(current.id, fd1),
                adminApi.updateBackground(neighbor.id, fd2),
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
                <h3 className="admin-section__title">Фоны профиля ({backgrounds.length})</h3>
                <button className="btn btn-primary admin-section__add-btn" onClick={openCreate}>
                    + Загрузить фон
                </button>
            </div>

            <div className="admin-bg-grid">
                {backgrounds.map((bg, index) => (
                    <div key={bg.id} className="admin-bg-card">
                        <BackgroundThumb bg={bg}/>
                        <div className="admin-bg-card__body">
                            <div className="admin-bg-card__title">{bg.title}</div>
                            <div className="admin-bg-card__meta">
                                {bg.price > 0 ? `🍃 ${bg.price}` : 'Бесплатный'}
                                {bg.code && <span> · {bg.code}</span>}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="admin-shop-card-edit"
                            onClick={(e) => { e.stopPropagation(); openEdit(bg) }}
                            title="Редактировать"
                        >✎</button>
                        <SortArrows
                            onUp={() => move(index, -1)}
                            onDown={() => move(index, +1)}
                            canUp={index > 0}
                            canDown={index < backgrounds.length - 1}
                            loading={busyId === bg.id}
                        />
                    </div>
                ))}

                {backgrounds.length === 0 && (
                    <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>
                        Пока нет фонов
                    </div>
                )}
            </div>

            <AdminBackgroundEditorModal
                open={editorOpen}
                onClose={() => { setEditorOpen(false); setEditing(null) }}
                background={editing}
                onSaved={onReload}
            />
        </div>
    )
}
