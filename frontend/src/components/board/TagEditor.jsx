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
import { tagsApi } from '../../api/api'

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']

const ICONS = [
    '', '📌', '⭐', '🔥', '✅', '❗', '💡', '🎯', '📎', '📁',
    '🏷️', '🎨', '🚀', '🐛', '📝', '💼', '🎓', '❤️', '⚡', '🔔',
]

function SortableTagRow({ tag, onEdit, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: tag.id,
        data: { type: 'tag', tag },
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
            className={`tag-row ${isDragging ? 'tag-row--dragging' : ''}`}
        >
            <span className="tag-row__drag">⋮⋮</span>
            <span
                className="tag-row__preview"
                style={{ background: `var(--accent-${tag.accentCode || 'gray'})` }}
            >
                {tag.icon && <span className="tag-row__icon">{tag.icon}</span>}
                {tag.title}
            </span>
            <span className="tag-row__count">
                {tag.taskCount} {plural(tag.taskCount, ['задача', 'задачи', 'задач'])}
            </span>
            {tag.isSystem && <span className="tag-row__system">системный</span>}
            <button
                className="tag-row__action"
                onClick={(e) => { e.stopPropagation(); onEdit(tag) }}
                title="Редактировать"
            >✎</button>
            {!tag.isSystem && (
                <button
                    className="tag-row__action tag-row__action--danger"
                    onClick={(e) => { e.stopPropagation(); onRemove(tag) }}
                    title="Удалить"
                >🗑</button>
            )}
        </div>
    )
}

export default function TagEditor({ boardId, tags, onReload }) {
    const [editing, setEditing] = useState(null)
    const [creating, setCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newAccent, setNewAccent] = useState('blue')
    const [newIcon, setNewIcon] = useState('')
    const [activeTag, setActiveTag] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const startEdit = (tag) => {
        setEditing({
            id: tag.id,
            title: tag.title,
            accentCode: tag.accentCode || 'gray',
            icon: tag.icon || '',
        })
    }

    const saveEdit = async () => {
        if (!editing.title.trim()) return
        try {
            await tagsApi.update(editing.id, {
                title: editing.title.trim(),
                accentCode: editing.accentCode,
                icon: editing.icon || null,
            })
            setEditing(null)
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const remove = async (tag) => {
        if (tag.isSystem) {
            alert('Нельзя удалить системный тег')
            return
        }
        if (!confirm(`Удалить тег "${tag.title}"?`)) return
        try {
            await tagsApi.delete(tag.id)
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const create = async () => {
        if (!newTitle.trim()) return
        try {
            await tagsApi.create(boardId, {
                title: newTitle.trim(),
                accentCode: newAccent,
                icon: newIcon || null,
            })
            setNewTitle('')
            setNewAccent('blue')
            setNewIcon('')
            setCreating(false)
            onReload()
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const handleDragStart = (event) => {
        const { active } = event
        const tag = active.data.current?.tag
        if (tag) setActiveTag(tag)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTag(null)
        if (!over || active.id === over.id) return

        const oldIndex = tags.findIndex(t => t.id === active.id)
        const newIndex = tags.findIndex(t => t.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(tags, oldIndex, newIndex)

        try {
            await Promise.all(
                reordered.map((t, idx) =>
                    tagsApi.update(t.id, { position: idx })
                )
            )
            onReload()
        } catch (err) {
            console.error('Tag move failed:', err)
            onReload()
        }
    }

    const tagIds = tags.map(t => t.id)

    return (
        <div className="tag-editor">
            {tags.length === 0 && !creating && (
                <div className="tag-editor__empty">Тегов пока нет</div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={tagIds} strategy={verticalListSortingStrategy}>
                    <div className="tag-editor__list">
                        {tags.map(tag => (
                            editing?.id === tag.id ? (
                                <div key={tag.id} className="tag-row tag-row--editing">
                                    <input
                                        className="input tag-row__title"
                                        value={editing.title}
                                        onChange={(e) => setEditing(f => ({ ...f, title: e.target.value }))}
                                        autoFocus
                                    />
                                    <select
                                        className="input tag-row__icon-select"
                                        value={editing.icon}
                                        onChange={(e) => setEditing(f => ({ ...f, icon: e.target.value }))}
                                    >
                                        {ICONS.map(ic => (
                                            <option key={ic} value={ic}>
                                                {ic ? `${ic}` : '— без иконки —'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="color-picker tag-row__colors">
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
                                    <button className="btn btn-primary tag-row__btn" onClick={saveEdit}>OK</button>
                                    <button className="btn btn-ghost tag-row__btn" onClick={() => setEditing(null)}>×</button>
                                </div>
                            ) : (
                                <SortableTagRow
                                    key={tag.id}
                                    tag={tag}
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
                    {activeTag ? (
                        <div className="tag-row" style={{ opacity: 0.9 }}>
                            <span className="tag-row__drag">⋮⋮</span>
                            <span
                                className="tag-row__preview"
                                style={{ background: `var(--accent-${activeTag.accentCode || 'gray'})` }}
                            >
                                {activeTag.icon && <span className="tag-row__icon">{activeTag.icon}</span>}
                                {activeTag.title}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {creating ? (
                <div className="tag-row tag-row--creating">
                    <input
                        className="input tag-row__title"
                        placeholder="Название тега"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && create()}
                        autoFocus
                    />
                    <select
                        className="input tag-row__icon-select"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                    >
                        {ICONS.map(ic => (
                            <option key={ic} value={ic}>
                                {ic ? `${ic}` : '— без иконки —'}
                            </option>
                        ))}
                    </select>
                    <div className="color-picker tag-row__colors">
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
                    <button className="btn btn-primary tag-row__btn" onClick={create}>Добавить</button>
                    <button className="btn btn-ghost tag-row__btn" onClick={() => setCreating(false)}>×</button>
                </div>
            ) : (
                <button className="tag-editor__add" onClick={() => setCreating(true)}>
                    + Добавить тег
                </button>
            )}
        </div>
    )
}

function plural(n, forms) {
    const mod10 = n % 10, mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}