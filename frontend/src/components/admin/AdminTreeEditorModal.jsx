import { useEffect, useMemo, useState } from 'react'
import Modal from '../modal/Modal'
import { adminApi } from '../../api/api'
import { TREE_KIND_OPTIONS } from '../layout/TreeAvatar'
import TreeThumb from '../shop/TreeThumb'
import CategoryMultiSelect from './CategoryMultiSelect'

/**
 * Редактор скина дерева.
 *
 * Внешний вид дерева нельзя нарисовать в админке — он задаётся SVG-видом
 * (code). Поэтому при создании выбираем ещё не занятый вид, а при
 * редактировании code показываем только для справки.
 */
export default function AdminTreeEditorModal({
                                                  open,
                                                  onClose,
                                                  tree,
                                                  categories,
                                                  usedCodes = [],
                                                  onSaved,
                                              }) {
    const isEdit = !!tree

    const availableKinds = useMemo(
        () => TREE_KIND_OPTIONS.filter((k) => !usedCodes.includes(k.code)),
        [usedCodes],
    )
    const firstAvailableCode = availableKinds[0]?.code || ''

    const [code, setCode] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState(0)
    const [sortOrder, setSortOrder] = useState(0)
    const [categoryIds, setCategoryIds] = useState([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!open) return

        if (tree) {
            setCode(tree.code || '')
            setTitle(tree.title || '')
            setDescription(tree.description || '')
            setPrice(tree.price || 0)
            setSortOrder(tree.sortOrder || 0)
            setCategoryIds((tree.categories || []).map((c) => c.id))
        } else {
            setCode(firstAvailableCode)
            setTitle('')
            setDescription('')
            setPrice(0)
            setSortOrder(0)
            setCategoryIds([])
        }
        setError(null)
    }, [open, tree, firstAvailableCode])

    const submit = async () => {
        if (!title.trim()) {
            setError('Укажи название')
            return
        }
        if (!isEdit && !code) {
            setError('Выбери внешний вид дерева')
            return
        }

        setSaving(true)
        setError(null)
        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                price: Number(price) || 0,
                sortOrder: Number(sortOrder) || 0,
                categoryIds,
            }

            if (isEdit) {
                await adminApi.updateTree(tree.id, payload)
            } else {
                await adminApi.createTree({ ...payload, code })
            }
            onSaved?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const remove = async () => {
        if (!tree) return
        if (!confirm(`Удалить дерево «${tree.title}»?`)) return

        setSaving(true)
        setError(null)
        try {
            await adminApi.deleteTree(tree.id)
            onSaved?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка удаления')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? `Редактировать: ${tree.title}` : 'Новое дерево'}
            footer={
                <>
                    {isEdit && (
                        <button
                            className="btn btn-icon btn-icon--danger"
                            onClick={remove}
                            disabled={saving}
                            title="Удалить"
                        >
                            🗑
                        </button>
                    )}
                    <div className="modal__foot-spacer" />
                    <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
                        Отмена
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={submit}
                        disabled={saving || !title.trim() || (!isEdit && !code)}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </>
            }
        >
            <div className="admin-avatar-editor admin-tree-editor">
                <div className="admin-avatar-editor__preview admin-tree-editor__preview">
                    <div className="admin-tree-editor__tree">
                        {code ? <TreeThumb kind={code} size={190} /> : (
                            <div className="admin-tree-editor__placeholder">🌳</div>
                        )}
                    </div>

                    {isEdit ? (
                        <div className="admin-tree-editor__kind">
                            <span className="modal__label">Внешний вид</span>
                            <code>{code}</code>
                            <span className="modal__label-hint">
                                Меняется только при создании
                            </span>
                        </div>
                    ) : (
                        <div className="modal__field admin-tree-editor__kind">
                            <label className="modal__label">Внешний вид</label>
                            {availableKinds.length === 0 ? (
                                <div className="modal__label-hint">
                                    Все доступные деревья уже добавлены
                                </div>
                            ) : (
                                <select
                                    className="input"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                >
                                    {availableKinds.map((kind) => (
                                        <option key={kind.code} value={kind.code}>
                                            {kind.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                <div className="admin-avatar-editor__fields">
                    <div className="modal__field">
                        <label className="modal__label">Название</label>
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            autoFocus
                        />
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Цена в листьях</label>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Порядок сортировки</label>
                        <input
                            className="input"
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        />
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Типы (можно выбрать несколько)</label>
                        <CategoryMultiSelect
                            categories={categories}
                            selectedIds={categoryIds}
                            onChange={setCategoryIds}
                        />
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Описание</label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                    </div>

                    {error && <div className="modal__error">{error}</div>}
                </div>
            </div>
        </Modal>
    )
}
