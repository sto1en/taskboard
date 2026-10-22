import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { taskTemplatesApi } from '../api/api'
import ApplyPlanModal from '../components/templates/ApplyPlanModal'
import ConfirmModal from '../components/common/ConfirmModal'

function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function formatSlot(offset) {
    if (offset == null || offset === '') return 'без дня'
    const value = Number(offset)
    if (!Number.isFinite(value) || value < 0) return 'без дня'
    return `${WEEKDAYS_SHORT[value % 7]} · нед. ${Math.floor(value / 7) + 1}`
}

export default function TemplatesPage() {
    const nav = useNavigate()
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')

    const [applyTarget, setApplyTarget] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [deleteBusy, setDeleteBusy] = useState(false)

    const load = () => {
        setLoading(true)
        taskTemplatesApi.list()
            .then(({ data }) => setTemplates(data || []))
            .catch((err) => setError(err.response?.data?.message || 'Не удалось загрузить шаблоны'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return templates
        return templates.filter(t =>
            t.title.toLowerCase().includes(q)
            || (t.description || '').toLowerCase().includes(q)
            || (t.items || []).some(i => i.title.toLowerCase().includes(q))
        )
    }, [templates, query])

    const openCreate = () => {
        nav('/templates/new')
    }

    const openEdit = (template) => {
        nav(`/templates/${template.id}/edit`)
    }

    const handleDelete = async () => {
        if (!deleting) return
        setDeleteBusy(true)
        try {
            await taskTemplatesApi.remove(deleting.id)
            setDeleting(null)
            load()
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось удалить шаблон')
        } finally {
            setDeleteBusy(false)
        }
    }

    const handleApply = async (payload) => {
        const { data } = await taskTemplatesApi.apply(applyTarget.id, payload)
        return data
    }

    return (
        <div className="templates-page">
            <nav className="section-subnav" aria-label="Шаблоны и гайды">
                <Link to="/templates" className="section-subnav__item section-subnav__item--active">
                    🧩 Шаблоны
                </Link>
                <Link to="/guides" className="section-subnav__item">
                    🗺️ Гайды
                </Link>
            </nav>

            <header className="templates-hero">
                <div className="templates-hero__text">
                    <div className="templates-hero__kicker">🧩 Шаблоны задач</div>
                    <h1 className="templates-hero__title">Повторяющиеся наборы задач</h1>
                    <p className="templates-hero__subtitle">
                        Разложите задачи по дням недели в календаре — без привязки к числам.
                        Шаблон подходит для любого месяца и года: при применении задачи
                        встанут на те же дни недели от выбранной даты старта.
                    </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                    + Новый шаблон
                </button>
            </header>

            <div className="templates-toolbar">
                <input
                    className="input templates-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск по шаблонам и задачам…"
                />
                <span className="templates-count">
                    {templates.length} {plural(templates.length, ['шаблон', 'шаблона', 'шаблонов'])}
                </span>
            </div>

            {loading && <div className="loading">Загружаем шаблоны…</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && filtered.length === 0 && (
                <div className="templates-empty">
                    <div className="templates-empty__icon">🧩</div>
                    <h3>{templates.length === 0 ? 'Пока нет ни одного шаблона' : 'Ничего не найдено'}</h3>
                    <p>
                        {templates.length === 0
                            ? 'Начните с простого: «План релиза», «Онбординг сотрудника» или «Подготовка к встрече».'
                            : 'Попробуйте изменить запрос.'}
                    </p>
                    {templates.length === 0 && (
                        <button type="button" className="btn btn-primary" onClick={openCreate}>
                            Создать первый шаблон
                        </button>
                    )}
                </div>
            )}

            <div className="templates-grid">
                {filtered.map(template => {
                    const tasks = template.items || []
                    const subtaskCount = tasks.reduce((sum, i) => sum + (i.subtasks?.length || 0), 0)
                    return (
                        <article
                            key={template.id}
                            className={`template-card template-card--${template.accent || 'blue'}`}
                        >
                            <div className="template-card__head">
                                <span className="template-card__icon">{template.icon || '🧩'}</span>
                                <div className="template-card__heading">
                                    <h3 className="template-card__title">{template.title}</h3>
                                    <div className="template-card__meta">
                                        {tasks.length} {plural(tasks.length, ['задача', 'задачи', 'задач'])}
                                        {subtaskCount > 0 && ` · ${subtaskCount} подзадач`}
                                    </div>
                                </div>
                            </div>

                            {template.description && (
                                <p className="template-card__desc">{template.description}</p>
                            )}

                            <ol className="template-card__tasks">
                                {tasks.slice(0, 4).map((item, i) => (
                                    <li key={item.id || i}>
                                        <span className="template-card__task-title">{item.title}</span>
                                        <span className="template-card__deadline">
                                            {formatSlot(item.deadlineOffsetDays)}
                                        </span>
                                    </li>
                                ))}
                                {tasks.length > 4 && (
                                    <li className="template-card__more">и ещё {tasks.length - 4}…</li>
                                )}
                            </ol>

                            <div className="template-card__actions">
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setApplyTarget(template)}
                                >
                                    Применить
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => openEdit(template)}
                                >
                                    Открыть
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm template-card__delete"
                                    onClick={() => setDeleting(template)}
                                    title="Удалить шаблон"
                                >
                                    Удалить
                                </button>
                            </div>
                        </article>
                    )
                })}
            </div>

            <ApplyPlanModal
                open={!!applyTarget}
                onClose={() => setApplyTarget(null)}
                title={`Применить «${applyTarget?.title || ''}»`}
                plan={applyTarget?.items || []}
                defaultProjectTitle={applyTarget?.title || ''}
                defaultProjectDescription={applyTarget?.description || ''}
                onApply={handleApply}
                weekMode
            />

            <ConfirmModal
                open={!!deleting}
                title="Удалить шаблон?"
                text={`«${deleting?.title || ''}» будет удалён. Задачи, уже добавленные на доски, останутся на месте.`}
                confirmLabel="Удалить"
                cancelLabel="Отмена"
                danger
                loading={deleteBusy}
                onConfirm={handleDelete}
                onClose={() => setDeleting(null)}
            />
        </div>
    )
}
