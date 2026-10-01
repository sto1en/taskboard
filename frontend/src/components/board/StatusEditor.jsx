import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { statusesApi } from '../../api/api'
import useT from '../../hooks/useT'
import { localizeCategoryLabel } from '../../utils/statusNames'

const CATEGORIES = ['ACTIVE', 'FROZEN', 'DONE', 'EXPIRED', 'CANCELLED', 'ARCHIVED']

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']

function SortableStatusRow({ status, onEdit, onRemove }) {
    const t = useT()
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: status.id,
        data: { type: 'status', status },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`status-row ${isDragging ? 'status-row--dragging' : ''}`}
        >
            <span className="status-row__drag">⋮⋮</span>
            <span
                className="status-row__dot"
                style={{ background: `var(--accent-${status.accentCode || 'gray'})` }}
            />
            <span className="status-row__title-text">{status.title}</span>
            <span className="status-row__category-text">
                {localizeCategoryLabel(status.categoryCode, t)}
            </span>
            {status.isSystem && <span className="status-row__system">{t.systemLabel}</span>}
            <button
                className="status-row__action"
                onClick={(e) => { e.stopPropagation(); onEdit(status) }}
                title={t.edit}
            >✎</button>
            {!status.isSystem && (
                <button
                    className="status-row__action status-row__action--danger"
                    onClick={(e) => { e.stopPropagation(); onRemove(status) }}
                    title={t.delete}
                >🗑</button>
            )}
        </div>
    )
}

export default function StatusEditor({ boardId, scope, statuses, onReload }) {
    const t = useT()
    const [editing, setEditing] = useState(null)
    const [creating, setCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newCategory, setNewCategory] = useState('ACTIVE')
    const [newAccent, setNewAccent] = useState('blue')
    const [activeStatus, setActiveStatus] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const startEdit = (s) => {
        setEditing({
            id: s.id,
            title: s.title,
            categoryCode: s.categoryCode,
            accentCode: s.accentCode || 'gray',
        })
    }

    const saveEdit = async () => {
        try {
            await statusesApi.update(boardId, editing.id, {
                title: editing.title,
                categoryCode: editing.categoryCode,
                accentCode: editing.accentCode,
            })
            setEditing(null)
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Error')
        }
    }

    const remove = async (s) => {
        if (s.isSystem) {
            alert(t.cantDeleteSystem)
            return
        }
        if (!confirm(t.confirmDeleteStatus)) return
        try {
            await statusesApi.delete(boardId, s.id)
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Error')
        }
    }

    const create = async () => {
        if (!newTitle.trim()) return
        try {
            await statusesApi.create(boardId, {
                scope,
                categoryCode: newCategory,
                title: newTitle.trim(),
                accentCode: newAccent,
            })
            setNewTitle('')
            setNewCategory('ACTIVE')
            setNewAccent('blue')
            setCreating(false)
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Error')
        }
    }

    const handleDragStart = (event) => {
        const { active } = event
        const status = active.data.current?.status
        if (status) setActiveStatus(status)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveStatus(null)
        if (!over || active.id === over.id) return

        const oldIndex = statuses.findIndex(s => s.id === active.id)
        const newIndex = statuses.findIndex(s => s.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(statuses, oldIndex, newIndex)

        try {
            await Promise.all(
                reordered.map((s, idx) =>
                    statusesApi.update(boardId, s.id, { position: idx })
                )
            )
            onReload()
        } catch (err) {
            console.error('Status move failed:', err)
            onReload()
        }
    }

    const statusIds = statuses.map(s => s.id)

    return (
        <div className="status-editor">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={statusIds} strategy={verticalListSortingStrategy}>
                    <div className="status-editor__list">
                        {statuses.map(s => (
                            editing?.id === s.id ? (
                                <div key={s.id} className="status-row status-row--editing">
                                    <input
                                        className="input status-row__title"
                                        value={editing.title}
                                        onChange={(e) => setEditing(f => ({ ...f, title: e.target.value }))}
                                        autoFocus
                                    />
                                    <select
                                        className="input status-row__category"
                                        value={editing.categoryCode}
                                        onChange={(e) => setEditing(f => ({ ...f, categoryCode: e.target.value }))}
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>
                                                {localizeCategoryLabel(c, t)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="color-picker status-row__colors">
                                        {ACCENTS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                data-accent={c}
                                                className={`color-picker__item color-picker__item--sm ${editing.accentCode === c ? 'color-picker__item--active' : ''}`}
                                                onClick={() => setEditing(f => ({ ...f, accentCode: c }))}
                                            />
                                        ))}
                                    </div>
                                    <button className="btn btn-primary status-row__btn" onClick={saveEdit}>{t.save}</button>
                                    <button className="btn btn-ghost status-row__btn" onClick={() => setEditing(null)}>×</button>
                                </div>
                            ) : (
                                <SortableStatusRow
                                    key={s.id}
                                    status={s}
                                    onEdit={startEdit}
                                    onRemove={remove}
                                />
                            )
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } },
                        }),
                    }}
                >
                    {activeStatus ? (
                        <div className="status-row" style={{ opacity: 0.9 }}>
                            <span className="status-row__drag">⋮⋮</span>
                            <span
                                className="status-row__dot"
                                style={{ background: `var(--accent-${activeStatus.accentCode || 'gray'})` }}
                            />
                            <span className="status-row__title-text">{activeStatus.title}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {creating ? (
                <div className="status-row status-row--creating">
                    <input
                        className="input status-row__title"
                        placeholder={t.statusNamePlaceholder}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        autoFocus
                    />
                    <select
                        className="input status-row__category"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                    >
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>
                                {localizeCategoryLabel(c, t)}
                            </option>
                        ))}
                    </select>
                    <div className="color-picker status-row__colors">
                        {ACCENTS.map(c => (
                            <button
                                key={c}
                                type="button"
                                data-accent={c}
                                className={`color-picker__item color-picker__item--sm ${newAccent === c ? 'color-picker__item--active' : ''}`}
                                onClick={() => setNewAccent(c)}
                            />
                        ))}
                    </div>
                    <button className="btn btn-primary status-row__btn" onClick={create}>{t.addingLabel}</button>
                    <button className="btn btn-ghost status-row__btn" onClick={() => setCreating(false)}>×</button>
                </div>
            ) : (
                <button className="status-editor__add" onClick={() => setCreating(true)}>
                    {t.addStatusBtn}
                </button>
            )}
        </div>
    )
}