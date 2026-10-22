import { useEffect, useState } from 'react'
import Modal from '../modal/Modal'
import { guidesApi } from '../../api/api'

const ACCENTS = ['blue', 'indigo', 'violet', 'purple', 'pink', 'red', 'coral', 'orange', 'green', 'teal', 'cyan', 'gray']
const PERIODS = [
    { code: 'WEEK', label: 'Неделя' },
    { code: 'MONTH', label: 'Месяц' },
    { code: 'CUSTOM', label: 'Свой период' },
]
const STATUSES = [
    { code: 'ACTIVE', label: 'В работе' },
    { code: 'FROZEN', label: 'Заморожена' },
    { code: 'DONE', label: 'Готова' },
    { code: 'CANCELLED', label: 'Отменена' },
]

let uid = 0
const nextKey = () => `guide-task-${++uid}`

function emptyTask(dayOffset = 0) {
    return {
        key: nextKey(),
        title: '',
        description: '',
        dayOffset,
        priority: 0,
        statusCategoryCode: 'ACTIVE',
        estimatedMinutes: '',
        subtasksText: '',
    }
}

function taskFromApi(task) {
    return {
        key: nextKey(),
        title: task.title || '',
        description: task.description || '',
        dayOffset: task.dayOffset ?? 0,
        priority: task.priority || 0,
        statusCategoryCode: task.statusCategoryCode || 'ACTIVE',
        estimatedMinutes: task.estimatedMinutes ?? '',
        subtasksText: (task.subtasks || []).join('\n'),
    }
}

/**
 * Редактор гайда-проекта: задачи, описания, подзадачи и дедлайны
 * (дедлайн = день старта + dayOffset).
 */
export default function GuideEditorModal({ open, initial, onClose, onSaved }) {
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [description, setDescription] = useState('')
    const [periodType, setPeriodType] = useState('WEEK')
    const [accent, setAccent] = useState('blue')
    const [emoji, setEmoji] = useState('📅')
    const [tasks, setTasks] = useState([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!open) return
        setError('')
        setTitle(initial?.title || '')
        setSubtitle(initial?.subtitle || '')
        setDescription(initial?.description || '')
        setPeriodType(initial?.periodType || 'WEEK')
        setAccent(initial?.accent || 'blue')
        setEmoji(initial?.emoji || '📅')
        setTasks(initial?.tasks?.length ? initial.tasks.map(taskFromApi) : [emptyTask(0)])
    }, [open, initial])

    const patch = (key, field, value) => {
        setTasks(prev => prev.map(t => (t.key === key ? { ...t, [field]: value } : t)))
    }

    const addTask = () => {
        const maxDay = tasks.reduce((max, t) => Math.max(max, Number(t.dayOffset) || 0), -1)
        setTasks(prev => [...prev, emptyTask(maxDay + 1)])
    }
    const removeTask = (key) => setTasks(prev => prev.filter(t => t.key !== key))

    const move = (index, dir) => {
        setTasks(prev => {
            const target = index + dir
            if (target < 0 || target >= prev.length) return prev
            const copy = [...prev]
            const [item] = copy.splice(index, 1)
            copy.splice(target, 0, item)
            return copy
        })
    }

    const save = async () => {
        if (!title.trim()) {
            setError('Укажите название гайда')
            return
        }
        const payloadTasks = tasks
            .filter(t => t.title.trim())
            .map(t => ({
                title: t.title.trim(),
                description: t.description,
                dayOffset: Math.max(0, Number(t.dayOffset) || 0),
                priority: Number(t.priority) || 0,
                statusCategoryCode: t.statusCategoryCode || 'ACTIVE',
                estimatedMinutes: t.estimatedMinutes === '' ? null : Number(t.estimatedMinutes),
                subtasks: t.subtasksText
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean),
            }))

        if (payloadTasks.length === 0) {
            setError('Добавьте хотя бы одну задачу с названием')
            return
        }

        setSaving(true)
        setError('')
        try {
            const payload = {
                title: title.trim(),
                subtitle,
                description,
                periodType,
                accent,
                emoji: emoji || '📅',
                tasks: payloadTasks,
            }
            const { data } = initial?.id
                ? await guidesApi.update(initial.id, payload)
                : await guidesApi.create(payload)
            onSaved && onSaved(data)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось сохранить гайд')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={initial?.id ? 'Редактировать гайд' : 'Новый гайд'}
            className="template-editor-modal"
            bodyClassName="template-editor-modal__body"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                        Отмена
                    </button>
                    <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                        {saving ? 'Сохраняем…' : 'Сохранить гайд'}
                    </button>
                </>
            }
        >
            <div className="tmpl-editor">
                <div className="tmpl-editor__head">
                    <div className="tmpl-editor__icon-field">
                        <span className="field__label">Эмодзи</span>
                        <input
                            className="input tmpl-editor__icon-input"
                            value={emoji}
                            maxLength={4}
                            onChange={(e) => setEmoji(e.target.value)}
                        />
                    </div>
                    <label className="field tmpl-editor__title-field">
                        <span className="field__label">Название гайда</span>
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Неделя запуска"
                            autoFocus
                        />
                    </label>
                    <label className="field tmpl-editor__accent-field">
                        <span className="field__label">Период</span>
                        <select className="input" value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
                            {PERIODS.map(p => (
                                <option key={p.code} value={p.code}>{p.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="field tmpl-editor__accent-field">
                        <span className="field__label">Цвет</span>
                        <select className="input" value={accent} onChange={(e) => setAccent(e.target.value)}>
                            {ACCENTS.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="field">
                    <span className="field__label">Короткое описание</span>
                    <input
                        className="input"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Одна строка о том, для чего этот гайд"
                    />
                </label>

                <label className="field">
                    <span className="field__label">Полное описание</span>
                    <textarea
                        className="input"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Кому подойдёт, какого результата ждать"
                    />
                </label>

                <div className="tmpl-editor__items-head">
                    <div>
                        <div className="tmpl-editor__items-title">Задачи гайда</div>
                        <div className="tmpl-editor__hint">
                            День 0 — дата старта. Дедлайн задачи = старт + номер дня.
                        </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addTask}>
                        + Задача
                    </button>
                </div>

                <div className="tmpl-editor__items">
                    {tasks.map((task, index) => (
                        <div className="tmpl-item" key={task.key}>
                            <div className="tmpl-item__side">
                                <span className="tmpl-item__num">{index + 1}</span>
                                <button
                                    type="button"
                                    className="tmpl-item__move"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    title="Выше"
                                >↑</button>
                                <button
                                    type="button"
                                    className="tmpl-item__move"
                                    onClick={() => move(index, 1)}
                                    disabled={index === tasks.length - 1}
                                    title="Ниже"
                                >↓</button>
                            </div>

                            <div className="tmpl-item__body">
                                <input
                                    className="input tmpl-item__title"
                                    value={task.title}
                                    onChange={(e) => patch(task.key, 'title', e.target.value)}
                                    placeholder="Название задачи"
                                />
                                <textarea
                                    className="input"
                                    rows={2}
                                    value={task.description}
                                    onChange={(e) => patch(task.key, 'description', e.target.value)}
                                    placeholder="Описание (можно оставить пустым)"
                                />

                                <div className="tmpl-item__row">
                                    <label className="field field--inline">
                                        <span className="field__label">День</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="input"
                                            value={task.dayOffset}
                                            onChange={(e) => patch(task.key, 'dayOffset', e.target.value)}
                                        />
                                    </label>
                                    <label className="field field--inline">
                                        <span className="field__label">Приоритет</span>
                                        <select
                                            className="input"
                                            value={task.priority}
                                            onChange={(e) => patch(task.key, 'priority', e.target.value)}
                                        >
                                            {[0, 1, 2, 3, 4, 5].map(p => (
                                                <option key={p} value={p}>{p === 0 ? 'нет' : '★'.repeat(p)}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="field field--inline">
                                        <span className="field__label">Статус</span>
                                        <select
                                            className="input"
                                            value={task.statusCategoryCode}
                                            onChange={(e) => patch(task.key, 'statusCategoryCode', e.target.value)}
                                        >
                                            {STATUSES.map(s => (
                                                <option key={s.code} value={s.code}>{s.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="field field--inline">
                                        <span className="field__label">Оценка</span>
                                        <div className="tmpl-item__suffix">
                                            <input
                                                type="number"
                                                min="0"
                                                className="input"
                                                value={task.estimatedMinutes}
                                                onChange={(e) => patch(task.key, 'estimatedMinutes', e.target.value)}
                                                placeholder="—"
                                            />
                                            <span>мин</span>
                                        </div>
                                    </label>
                                </div>

                                <label className="field">
                                    <span className="field__label">Подзадачи — по одной на строку</span>
                                    <textarea
                                        className="input"
                                        rows={2}
                                        value={task.subtasksText}
                                        onChange={(e) => patch(task.key, 'subtasksText', e.target.value)}
                                        placeholder={'Например:\nСобрать требования\nСделать черновик'}
                                    />
                                </label>
                            </div>

                            <button
                                type="button"
                                className="tmpl-item__remove"
                                onClick={() => removeTask(task.key)}
                                title="Удалить задачу"
                            >×</button>
                        </div>
                    ))}
                </div>

                {error && <div className="tmpl-editor__error">{error}</div>}
            </div>
        </Modal>
    )
}
