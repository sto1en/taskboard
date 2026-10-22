import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { guidesApi } from '../api/api'
import GuideEditorModal from '../components/templates/GuideEditorModal'
import ApplyPlanModal from '../components/templates/ApplyPlanModal'
import ConfirmModal from '../components/common/ConfirmModal'
import Modal from '../components/modal/Modal'

const PERIOD_LABEL = {
    WEEK: 'Неделя',
    MONTH: 'Месяц',
    CUSTOM: 'Свой период',
}

const FILTERS = [
    { code: 'all', label: 'Все' },
    { code: 'WEEK', label: 'На неделю' },
    { code: 'MONTH', label: 'На месяц' },
    { code: 'mine', label: 'Мои' },
]

function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}

function daySpan(guide) {
    const max = (guide.tasks || []).reduce((m, t) => Math.max(m, t.dayOffset || 0), 0)
    return max + 1
}

export default function GuidesPage() {
    const [guides, setGuides] = useState([])
    const [showcase, setShowcase] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')

    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [applyTarget, setApplyTarget] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [deleteBusy, setDeleteBusy] = useState(false)
    const [pickerOpen, setPickerOpen] = useState(false)
    const [savingShowcase, setSavingShowcase] = useState(false)
    const [showcaseError, setShowcaseError] = useState('')

    const savedIdsRef = useRef('[]')

    const load = () => {
        setLoading(true)
        Promise.all([guidesApi.list(), guidesApi.showcase()])
            .then(([listRes, showcaseRes]) => {
                setGuides(listRes.data || [])
                setShowcase(showcaseRes.data || [])
                savedIdsRef.current = JSON.stringify((showcaseRes.data || []).map(g => g.id))
            })
            .catch((err) => setError(err.response?.data?.message || 'Не удалось загрузить гайды'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    useEffect(() => {
        if (window.location.hash === '#showcase') {
            setTimeout(() => {
                document.getElementById('guides-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 200)
        }
    }, [])

    const filtered = useMemo(() => {
        if (filter === 'all') return guides
        if (filter === 'mine') return guides.filter(g => g.mine)
        return guides.filter(g => g.periodType === filter)
    }, [guides, filter])

    const showcaseIds = showcase.map(g => g.id)
    const showcaseDirty = JSON.stringify(showcaseIds) !== savedIdsRef.current

    const openCreate = () => {
        setEditing(null)
        setEditorOpen(true)
    }

    const openEdit = (guide) => {
        setEditing(guide)
        setEditorOpen(true)
    }

    const handleSaved = () => {
        setEditorOpen(false)
        setEditing(null)
        load()
    }

    const handleDelete = async () => {
        if (!deleting) return
        setDeleteBusy(true)
        try {
            await guidesApi.remove(deleting.id)
            setDeleting(null)
            load()
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось удалить гайд')
        } finally {
            setDeleteBusy(false)
        }
    }

    const handleDuplicate = async (guide) => {
        try {
            const { data } = await guidesApi.duplicate(guide.id)
            load()
            setEditing(data)
            setEditorOpen(true)
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось скопировать гайд')
        }
    }

    const handleApply = async (payload) => {
        const { data } = await guidesApi.apply(applyTarget.id, payload)
        return data
    }

    const removeFromShowcase = (id) => {
        setShowcase(prev => prev.filter(g => g.id !== id))
    }

    const moveShowcase = (index, dir) => {
        setShowcase(prev => {
            const target = index + dir
            if (target < 0 || target >= prev.length) return prev
            const copy = [...prev]
            const [item] = copy.splice(index, 1)
            copy.splice(target, 0, item)
            return copy
        })
    }

    const addToShowcase = (guide) => {
        if (showcase.some(g => g.id === guide.id)) return
        if (showcase.length >= 4) return
        setShowcase(prev => [...prev, guide])
    }

    const saveShowcase = async () => {
        setSavingShowcase(true)
        setShowcaseError('')
        try {
            const { data } = await guidesApi.saveShowcase(showcaseIds)
            setShowcase(data || [])
            savedIdsRef.current = JSON.stringify((data || []).map(g => g.id))
        } catch (err) {
            setShowcaseError(err.response?.data?.message || 'Не удалось сохранить витрину')
        } finally {
            setSavingShowcase(false)
        }
    }

    const availableForShowcase = guides.filter(g => !showcase.some(s => s.id === g.id))

    return (
        <div className="guides-page">
            <nav className="section-subnav" aria-label="Шаблоны и гайды">
                <Link to="/templates" className="section-subnav__item">
                    🧩 Шаблоны
                </Link>
                <Link to="/guides" className="section-subnav__item section-subnav__item--active">
                    🗺️ Гайды
                </Link>
            </nav>

            <header className="guides-hero">
                <div className="guides-hero__text">
                    <div className="guides-hero__kicker">🗺️ Гайды-проекты</div>
                    <h1 className="guides-hero__title">Готовые сценарии на неделю и месяц</h1>
                    <p className="guides-hero__subtitle">
                        Это проекты для других людей: внутри уже прописаны задачи, описания,
                        подзадачи и дедлайны. Откройте гайд — и увидите календарный план по дням.
                        Понравившийся сценарий можно применить на свою доску или показать в витрине.
                    </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                    + Новый гайд
                </button>
            </header>

            {loading && <div className="loading">Загружаем гайды…</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <>
                    <section className="guides-showcase" id="guides-showcase">
                        <div className="guides-section__head">
                            <div>
                                <h2 className="guides-section__title">🖼️ Моя витрина</h2>
                                <p className="guides-section__subtitle">
                                    Эти гайды отображаются на вашей стене в профиле. Порядок и состав можно менять.
                                </p>
                            </div>
                            <div className="guides-showcase__actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setPickerOpen(true)}
                                    disabled={showcase.length >= 4}
                                >
                                    + Добавить
                                </button>
                                {showcaseDirty && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => {
                                                const restore = guides.filter(g =>
                                                    JSON.parse(savedIdsRef.current).includes(g.id))
                                                setShowcase(restore)
                                            }}
                                        >
                                            Отменить
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={saveShowcase}
                                            disabled={savingShowcase}
                                        >
                                            {savingShowcase ? 'Сохраняем…' : 'Сохранить витрину'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {showcase.length === 0 ? (
                            <div className="guides-showcase__empty">
                                Витрина пуста. Добавьте до четырёх гайдов — они появятся на стене профиля.
                            </div>
                        ) : (
                            <div className="guides-showcase__grid">
                                {showcase.map((guide, index) => (
                                    <div
                                        key={guide.id}
                                        className={`showcase-card showcase-card--${guide.accent || 'blue'}`}
                                    >
                                        <div className="showcase-card__top">
                                            <span className="showcase-card__emoji">{guide.emoji || '📅'}</span>
                                            <span className="showcase-card__period">
                                                {PERIOD_LABEL[guide.periodType] || 'Гайд'}
                                            </span>
                                        </div>
                                        <Link to={`/guides/${guide.id}`} className="showcase-card__title">
                                            {guide.title}
                                        </Link>
                                        <p className="showcase-card__subtitle">{guide.subtitle}</p>
                                        <div className="showcase-card__meta">
                                            {guide.taskCount} {plural(guide.taskCount, ['задача', 'задачи', 'задач'])}
                                            {!guide.isSystem && ' · мой'}
                                        </div>
                                        <div className="showcase-card__controls">
                                            <button
                                                type="button"
                                                onClick={() => moveShowcase(index, -1)}
                                                disabled={index === 0}
                                                title="Выше"
                                            >↑</button>
                                            <button
                                                type="button"
                                                onClick={() => moveShowcase(index, 1)}
                                                disabled={index === showcase.length - 1}
                                                title="Ниже"
                                            >↓</button>
                                            <button
                                                type="button"
                                                onClick={() => removeFromShowcase(guide.id)}
                                                title="Убрать из витрины"
                                            >×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showcaseError && <div className="guides-error">{showcaseError}</div>}
                    </section>

                    <section className="guides-library">
                        <div className="guides-section__head">
                            <div>
                                <h2 className="guides-section__title">Библиотека гайдов</h2>
                                <p className="guides-section__subtitle">
                                    Встроенные сценарии и ваши собственные проекты-гайды.
                                </p>
                            </div>
                            <div className="guides-filters">
                                {FILTERS.map(f => (
                                    <button
                                        key={f.code}
                                        type="button"
                                        className={`guides-filter ${filter === f.code ? 'guides-filter--active' : ''}`}
                                        onClick={() => setFilter(f.code)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="guides-empty">
                                <div className="guides-empty__icon">🗺️</div>
                                <h3>Здесь пока пусто</h3>
                                <p>Создайте свой гайд или выберите другой фильтр.</p>
                                <button type="button" className="btn btn-primary" onClick={openCreate}>
                                    Создать гайд
                                </button>
                            </div>
                        ) : (
                            <div className="guides-grid">
                                {filtered.map(guide => (
                                    <article
                                        key={guide.id}
                                        className={`guide-card guide-card--${guide.accent || 'blue'}`}
                                    >
                                        <div className="guide-card__cover">
                                            <span className="guide-card__emoji">{guide.emoji || '📅'}</span>
                                            <div className="guide-card__badges">
                                                <span className="guide-badge">
                                                    {PERIOD_LABEL[guide.periodType] || 'Гайд'}
                                                </span>
                                                {guide.isSystem
                                                    ? <span className="guide-badge guide-badge--system">встроенный</span>
                                                    : <span className="guide-badge guide-badge--mine">мой</span>}
                                            </div>
                                        </div>

                                        <div className="guide-card__body">
                                            <Link to={`/guides/${guide.id}`} className="guide-card__title">
                                                {guide.title}
                                            </Link>
                                            <p className="guide-card__subtitle">{guide.subtitle}</p>
                                            <div className="guide-card__meta">
                                                <span>{guide.taskCount} {plural(guide.taskCount, ['задача', 'задачи', 'задач'])}</span>
                                                <span>·</span>
                                                <span>{daySpan(guide)} {plural(daySpan(guide), ['день', 'дня', 'дней'])}</span>
                                            </div>
                                        </div>

                                        <div className="guide-card__actions">
                                            <Link to={`/guides/${guide.id}`} className="btn btn-primary btn-sm">
                                                Открыть
                                            </Link>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setApplyTarget(guide)}
                                            >
                                                Применить
                                            </button>
                                            {guide.mine ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => openEdit(guide)}
                                                    >
                                                        Изменить
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm guide-card__delete"
                                                        onClick={() => setDeleting(guide)}
                                                    >
                                                        Удалить
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDuplicate(guide)}
                                                    title="Создать свою копию"
                                                >
                                                    Скопировать
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            <GuideEditorModal
                open={editorOpen}
                initial={editing}
                onClose={() => { setEditorOpen(false); setEditing(null) }}
                onSaved={handleSaved}
            />

            <ApplyPlanModal
                open={!!applyTarget}
                onClose={() => setApplyTarget(null)}
                title={`Применить «${applyTarget?.title || ''}»`}
                plan={applyTarget?.tasks || []}
                defaultProjectTitle={applyTarget?.title || ''}
                defaultProjectDescription={applyTarget?.description || ''}
                onApply={handleApply}
            />

            <Modal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                title="Добавить гайд в витрину"
                footer={
                    <button type="button" className="btn btn-primary" onClick={() => setPickerOpen(false)}>
                        Готово
                    </button>
                }
            >
                <div className="guide-picker">
                    {availableForShowcase.length === 0 ? (
                        <p className="guide-picker__empty">Все доступные гайды уже в витрине.</p>
                    ) : (
                        availableForShowcase.map(guide => (
                            <button
                                key={guide.id}
                                type="button"
                                className="guide-picker__item"
                                onClick={() => addToShowcase(guide)}
                                disabled={showcase.length >= 4}
                            >
                                <span className="guide-picker__emoji">{guide.emoji || '📅'}</span>
                                <span className="guide-picker__body">
                                    <span className="guide-picker__title">{guide.title}</span>
                                    <span className="guide-picker__meta">
                                        {PERIOD_LABEL[guide.periodType] || 'Гайд'} · {guide.taskCount} задач
                                    </span>
                                </span>
                                <span className="guide-picker__plus">+</span>
                            </button>
                        ))
                    )}
                    <div className="guide-picker__hint">В витрине может быть до 4 гайдов.</div>
                </div>
            </Modal>

            <ConfirmModal
                open={!!deleting}
                title="Удалить гайд?"
                text={`«${deleting?.title || ''}» будет удалён. Задачи, уже применённые на доски, останутся.`}
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
