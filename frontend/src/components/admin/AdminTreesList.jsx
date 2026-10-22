import { useState } from 'react'
import { TREE_KIND_OPTIONS } from '../layout/TreeAvatar'
import TreeThumb from '../shop/TreeThumb'
import SortArrows from './SortArrows'
import AdminTreeEditorModal from './AdminTreeEditorModal'
import { adminApi } from '../../api/api'
import { getSwapPair, computeNewOrders } from '../../utils/adminSort'

export default function AdminTreesList({ trees, categories, onReload }) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [busyId, setBusyId] = useState(null)

    const usedCodes = trees.map((t) => t.code)
    const availableCount = TREE_KIND_OPTIONS.filter((k) => !usedCodes.includes(k.code)).length

    const openCreate = () => {
        if (availableCount === 0) return
        setEditing(null)
        setEditorOpen(true)
    }
    const openEdit = (tree) => {
        setEditing(tree)
        setEditorOpen(true)
    }

    const move = async (index, delta) => {
        const pair = getSwapPair(trees, index, delta)
        if (!pair) return

        const [current, neighbor] = pair
        const { currentNew, neighborNew } = computeNewOrders(current, neighbor)

        setBusyId(current.id)
        try {
            await Promise.all([
                adminApi.updateTree(current.id, { sortOrder: currentNew }),
                adminApi.updateTree(neighbor.id, { sortOrder: neighborNew }),
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
                <div>
                    <h3 className="admin-section__title">Деревья ({trees.length})</h3>
                    {availableCount === 0 && (
                        <p className="admin-section__hint">
                            Все виды деревьев уже добавлены — можно менять цены, описания и типы.
                        </p>
                    )}
                </div>
                <button
                    className="btn btn-primary admin-section__add-btn"
                    onClick={openCreate}
                    disabled={availableCount === 0}
                    title={availableCount === 0 ? 'Не осталось свободных видов деревьев' : undefined}
                >
                    + Создать дерево
                </button>
            </div>

            <div className="shop__grid">
                {trees.map((tree, index) => (
                    <div key={tree.id} className="admin-shop-card-wrap">
                        <article className="admin-tree-card">
                            <div className="admin-tree-card__preview">
                                <TreeThumb kind={tree.code} size={116} />
                            </div>

                            <div className="admin-tree-card__body">
                                <div className="admin-tree-card__title-row">
                                    <h4 className="admin-tree-card__title">{tree.title}</h4>
                                    <code className="admin-tree-card__code">{tree.code}</code>
                                </div>

                                <p className="admin-tree-card__desc">
                                    {tree.description || 'Без описания'}
                                </p>

                                {(tree.categories || []).length > 0 && (
                                    <div className="admin-tree-card__cats">
                                        {tree.categories.map((c) => (
                                            <span key={c.id} className="admin-tree-card__cat">
                                                {c.title}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="admin-tree-card__footer">
                                    <span className="admin-tree-card__price">
                                        🍃 {tree.price ?? 0}
                                    </span>
                                    <span className="admin-tree-card__order">
                                        #{tree.sortOrder ?? 0}
                                    </span>
                                </div>
                            </div>
                        </article>

                        <button
                            type="button"
                            className="admin-shop-card-edit"
                            onClick={(e) => {
                                e.stopPropagation()
                                openEdit(tree)
                            }}
                            title="Редактировать"
                        >
                            ✎
                        </button>

                        <SortArrows
                            onUp={() => move(index, -1)}
                            onDown={() => move(index, +1)}
                            canUp={index > 0}
                            canDown={index < trees.length - 1}
                            loading={busyId === tree.id}
                        />
                    </div>
                ))}

                {trees.length === 0 && (
                    <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>
                        Пока нет деревьев
                    </div>
                )}
            </div>

            <AdminTreeEditorModal
                open={editorOpen}
                onClose={() => {
                    setEditorOpen(false)
                    setEditing(null)
                }}
                tree={editing}
                categories={categories}
                usedCodes={usedCodes}
                onSaved={onReload}
            />
        </div>
    )
}
