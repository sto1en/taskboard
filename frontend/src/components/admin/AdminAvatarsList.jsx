import { useState } from 'react'
import { resolveUrl } from '../../utils/format'
import AdminAvatarEditorModal from './AdminAvatarEditorModal'

export default function AdminAvatarsList({ avatars, categories, onReload }) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [editingAvatar, setEditingAvatar] = useState(null)

    const openCreate = () => {
        setEditingAvatar(null)
        setEditorOpen(true)
    }

    const openEdit = (a) => {
        setEditingAvatar(a)
        setEditorOpen(true)
    }

    return (
        <div className="admin-section">
            <div className="admin-section__head">
                <h3 className="admin-section__title">Аватарки ({avatars.length})</h3>
                <button className="btn btn-primary admin-section__add-btn" onClick={openCreate}>
                    + Создать аватарку
                </button>
            </div>

            <div className="admin-avatars-grid">
                {avatars.map(a => (
                    <div key={a.id} className="admin-avatar-card">
                        <div className="admin-avatar-card__preview">
                            {a.imageUrl ? (
                                <img src={resolveUrl(a.imageUrl)} alt={a.title} />
                            ) : a.emoji ? (
                                <span className="admin-avatar-card__emoji">{a.emoji}</span>
                            ) : (
                                <span className="admin-avatar-card__placeholder">?</span>
                            )}
                        </div>
                        <div className="admin-avatar-card__body">
                            <div className="admin-avatar-card__title">{a.title}</div>
                            <div className="admin-avatar-card__meta">
                                <span className="admin-avatar-card__code">#{a.code}</span>
                                {a.categoryTitle && (
                                    <span className="admin-avatar-card__cat">{a.categoryTitle}</span>
                                )}
                            </div>
                            <div className="admin-avatar-card__price">🍃 {a.price}</div>
                        </div>
                        <div className="admin-avatar-card__actions">
                            <button
                                className="admin-avatar-card__btn"
                                onClick={() => openEdit(a)}
                                title="Изменить"
                            >✎</button>
                        </div>
                    </div>
                ))}

                {avatars.length === 0 && (
                    <div className="admin-empty">Пока нет аватарок</div>
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