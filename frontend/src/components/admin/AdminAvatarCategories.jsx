import { useState } from 'react'
import { adminApi } from '../../api/api'

export default function AdminAvatarCategories({ categories, onReload }) {
    const [editing, setEditing] = useState(null)   // { id, title, sortOrder }
    const [creating, setCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [error, setError] = useState(null)

    const startEdit = (c) => {
        setEditing({ id: c.id, title: c.title, sortOrder: c.sortOrder })
        setError(null)
    }

    const saveEdit = async () => {
        if (!editing.title.trim()) return
        try {
            await adminApi.updateAvatarCategory(editing.id, {
                title: editing.title.trim(),
                sortOrder: Number(editing.sortOrder),
            })
            setEditing(null)
            onReload()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    const remove = async (c) => {
        if (!confirm(`Удалить тип «${c.title}»? Аватарки останутся, но без типа.`)) return
        try {
            await adminApi.deleteAvatarCategory(c.id)
            onReload()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    const create = async () => {
        if (!newTitle.trim()) return
        try {
            await adminApi.createAvatarCategory({
                title: newTitle.trim(),
                sortOrder: (categories.length + 1) * 10,
            })
            setNewTitle('')
            setCreating(false)
            onReload()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    return (
        <div className="admin-section">
            <div className="admin-section__head">
                <h3 className="admin-section__title">Типы аватарок</h3>
                <button className="btn btn-ghost admin-section__add-btn" onClick={() => setCreating(true)}>
                    + Добавить тип
                </button>
            </div>

            {error && <div className="profile-msg profile-msg--error">{error}</div>}

            <div className="admin-categories-list">
                {categories.map(c => (
                    editing?.id === c.id ? (
                        <div key={c.id} className="admin-category-row admin-category-row--editing">
                            <input
                                className="input"
                                value={editing.title}
                                onChange={(e) => setEditing(f => ({ ...f, title: e.target.value }))}
                                autoFocus
                            />
                            <input
                                className="input admin-category-row__order"
                                type="number"
                                value={editing.sortOrder}
                                onChange={(e) => setEditing(f => ({ ...f, sortOrder: e.target.value }))}
                            />
                            <button className="btn btn-primary" onClick={saveEdit}>ОК</button>
                            <button className="btn btn-ghost" onClick={() => setEditing(null)}>×</button>
                        </div>
                    ) : (
                        <div key={c.id} className="admin-category-row">
                            <span className="admin-category-row__title">{c.title}</span>
                            <span className="admin-category-row__code">{c.code}</span>
                            <span className="admin-category-row__count">{c.avatarCount} шт.</span>
                            <button className="admin-category-row__btn" onClick={() => startEdit(c)} title="Изменить">✎</button>
                            <button className="admin-category-row__btn admin-category-row__btn--danger" onClick={() => remove(c)} title="Удалить">🗑</button>
                        </div>
                    )
                ))}

                {creating && (
                    <div className="admin-category-row admin-category-row--editing">
                        <input
                            className="input"
                            placeholder="Название типа (напр. Аниме)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && create()}
                            autoFocus
                        />
                        <button className="btn btn-primary" onClick={create}>Создать</button>
                        <button className="btn btn-ghost" onClick={() => setCreating(false)}>×</button>
                    </div>
                )}

                {categories.length === 0 && !creating && (
                    <div className="admin-empty">Пока нет типов</div>
                )}
            </div>
        </div>
    )
}