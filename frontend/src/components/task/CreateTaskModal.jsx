import { useState, useEffect } from 'react'
import { tasksApi, tagsApi } from '../../api/api'
import Modal from '../Modal/Modal'

export default function CreateTaskModal({
                                            open,
                                            onClose,
                                            onCreated,
                                            projectId,
                                            presetStatusId,
                                            columns,
                                            boardId,
                                        }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [statusId, setStatusId] = useState(presetStatusId || '')
    const [priority, setPriority] = useState(0)
    const [deadlineDate, setDeadlineDate] = useState('')
    const [deadlineTime, setDeadlineTime] = useState('')
    const [hasTime, setHasTime] = useState(false)
    const [showMore, setShowMore] = useState(false)

    const [tags, setTags] = useState([])
    const [selectedTagIds, setSelectedTagIds] = useState([])
    const [creatingTag, setCreatingTag] = useState(false)
    const [newTagTitle, setNewTagTitle] = useState('')
    const [newTagAccent, setNewTagAccent] = useState('blue')
    const [newTagIcon, setNewTagIcon] = useState('')

    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setTitle('')
            setDescription('')
            setStatusId(presetStatusId || '')
            setPriority(0)
            setDeadlineDate('')
            setDeadlineTime('')
            setHasTime(false)
            setShowMore(false)
            setSelectedTagIds([])
            setCreatingTag(false)
            setNewTagTitle('')
            setError(null)

            if (boardId) {
                tagsApi.listByBoard(boardId)
                    .then(({ data }) => setTags(data))
                    .catch(() => setTags([]))
            }
        }
    }, [open, presetStatusId, boardId])

    const toggleTag = (tagId) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
    }

    const createTag = async () => {
        if (!newTagTitle.trim()) return
        try {
            const { data } = await tagsApi.create(boardId, {
                title: newTagTitle.trim(),
                accentCode: newTagAccent,
                icon: newTagIcon || null,
            })
            setTags(prev => [...prev, data])
            setSelectedTagIds(prev => [...prev, data.id])
            setNewTagTitle('')
            setNewTagAccent('blue')
            setNewTagIcon('')
            setCreatingTag(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка создания тега')
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) {
            setError('Введите название')
            return
        }
        setLoading(true)
        setError(null)
        try {
            let deadline = null
            if (deadlineDate) {
                if (hasTime && deadlineTime) {
                    deadline = `${deadlineDate}T${deadlineTime}:00`
                } else {
                    deadline = `${deadlineDate}T00:00:00`
                }
            }

            await tasksApi.create(projectId, {
                title: title.trim(),
                description: description.trim() || undefined,
                statusId: statusId ? Number(statusId) : undefined,
                deadline: deadline || undefined,
                priority: priority || undefined,
                tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            })
            onCreated()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка создания задачи')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Новая задача"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Отмена
                    </button>
                    <button
                        type="submit"
                        form="create-task-form"
                        className="btn btn-primary"
                        disabled={loading || !title.trim()}
                    >
                        {loading ? 'Создание...' : 'Создать'}
                    </button>
                </>
            }
        >
            <form id="create-task-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
                <div className="modal__field">
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Что нужно сделать?"
                        maxLength={255}
                        autoFocus
                        required
                    />
                </div>

                <button
                    type="button"
                    className="task-more-toggle"
                    onClick={() => setShowMore(v => !v)}
                >
                    {showMore ? '− Скрыть' : '+ Дополнительно'}
                </button>

                {showMore && (
                    <>
                        <div className="modal__field">
                            <label className="modal__label">Описание</label>
                            <textarea
                                className="input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Подробности"
                                maxLength={5000}
                            />
                        </div>

                        <div className="modal__row">
                            <div className="modal__field">
                                <label className="modal__label">Статус</label>
                                <select
                                    className="input"
                                    value={statusId}
                                    onChange={(e) => setStatusId(e.target.value)}
                                >
                                    <option value="">— По умолчанию —</option>
                                    {columns.map(c => (
                                        <option key={c.statusId} value={c.statusId}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal__field">
                                <label className="modal__label">Приоритет</label>
                                <select
                                    className="input"
                                    value={priority}
                                    onChange={(e) => setPriority(Number(e.target.value))}
                                >
                                    <option value={0}>Обычный</option>
                                    <option value={1}>Высокий</option>
                                    <option value={2}>Срочный</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal__field">
                            <label className="modal__label">Дата дедлайна</label>
                            <input
                                className="input"
                                type="date"
                                value={deadlineDate}
                                onChange={(e) => setDeadlineDate(e.target.value)}
                            />
                        </div>

                        <label className="task-detail__toggle">
                            <input
                                type="checkbox"
                                checked={hasTime}
                                onChange={(e) => setHasTime(e.target.checked)}
                            />
                            <span>Указать время дедлайна</span>
                        </label>

                        {hasTime && (
                            <div className="modal__field">
                                <label className="modal__label">Время дедлайна</label>
                                <input
                                    className="input"
                                    type="time"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="task-detail__group" style={{ paddingBottom: 0, borderBottom: 'none', gap: 12 }}>
                            <div className="task-detail__label-row">
                                <div className="task-detail__label">Теги</div>
                                <button
                                    type="button"
                                    className="task-detail__small-btn"
                                    onClick={() => setCreatingTag(v => !v)}
                                >
                                    {creatingTag ? '× Отмена' : '+ Создать тег'}
                                </button>
                            </div>

                            {creatingTag && (
                                <div className="task-detail__create-tag">
                                    <input
                                        className="input"
                                        placeholder="Название тега"
                                        value={newTagTitle}
                                        onChange={(e) => setNewTagTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && createTag()}
                                        autoFocus
                                    />
                                    <button type="button" className="btn btn-primary" onClick={createTag}>
                                        ОК
                                    </button>
                                </div>
                            )}

                            <div className="task-detail__tags">
                                {tags.length === 0 && !creatingTag && (
                                    <div className="task-detail__empty">Нет тегов у доски</div>
                                )}
                                {tags.map(tag => {
                                    const active = selectedTagIds.includes(tag.id)
                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={`task-detail__tag ${active ? 'active' : ''}`}
                                            style={active ? {
                                                background: `var(--accent-${tag.accentCode || 'gray'})`,
                                                borderColor: `var(--accent-${tag.accentCode || 'gray'})`,
                                                color: '#fff',
                                            } : {}}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                                            {tag.title}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {error && <div className="modal__error">{error}</div>}
            </form>
        </Modal>
    )
}