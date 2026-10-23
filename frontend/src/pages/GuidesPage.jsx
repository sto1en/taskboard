import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { guidesApi } from '../api/api'
import GuideEditorModal from '../components/templates/GuideEditorModal'
import ApplyPlanModal from '../components/templates/ApplyPlanModal'
import ConfirmModal from '../components/common/ConfirmModal'
import TemplatesSectionNav from '../components/templates/TemplatesSectionNav'

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

/**
 * Гайды переименованы в «публичные шаблоны»: готовые сценарии на неделю
 * и месяц показываются как публичные шаблоны сообщества.
 *
 * У каждого гайда есть кнопка «Создать публичный шаблон» — она переводит
 * в конструктор шаблонов с уже включённым тумблером публичности.
 */
export default function GuidesPage() {
    const nav = useNavigate()

    const [guides, setGuides] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')

    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [applyTarget, setApplyTarget] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [deleteBusy, setDeleteBusy] = useState(false)

    const load = () => {
        setLoading(true)
        setError('')
        guidesApi.list()
            .then(({ data }) => setGuides(data || []))
            .catch((err) => setError(err.response?.data?.message || 'Не удалось загрузить публичные шаблоны'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    const filtered = useMemo(() => {
        if (filter === 'all') return guides
        if (filter === 'mine') return guides.filter(g => g.mine)
        return guides.filter(g => g.periodType === filter)
    }, [guides, filter])

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
            alert(err.response?.data?.message || 'Не удалось удалить шаблон')
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
            alert(err.response?.data?.message || 'Не удалось скопировать шаблон')
        }
    }

    const handleApply = async (payload) => {
        const { data } = await guidesApi.apply(applyTarget.id, payload)
        return data
    }

    /** «Создать публичный шаблон»: конструктор открывается с public=1. */
    const createPublicFromGuide = (guide) => {
        const p = new URLSearchParams()
        p.set('public', '1')
        if (guide?.title) p.set('from', String(guide.id))
        nav(`/templates/new?${p.toString()}`)
    }

    return (
        <div className="guides-page">
            <TemplatesSectionNav
                tab="public"
                scope="all"
                onTabChange={(next) => {
                    if (next === 'mine') nav('/templates')
                    else nav('/templates?tab=public&scope=all')
                }}
                onScopeChange={(next) => nav(next === 'mine'
                    ? '/templates?tab=public&scope=mine'
                    : '/templates?tab=public&scope=all')}
            />

            <header className="guides-hero">
                <div className="guides-hero__text">
                    <div className="guides-hero__kicker">🌍 Публичные шаблоны</div>
                    <h1 className="guides-hero__title">Готовые сценарии на неделю и месяц</h1>
                    <p className="guides-hero__subtitle">
                        Это проекты для других людей: внутри уже прописаны задачи, описания,
                        подзадачи и дедлайны. Откройте шаблон — и увидите календарный план по дням.
                        Понравившийся сценарий можно применить на свою доску.
                    </p>
                </div>
                <div className="guides-hero__actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => createPublicFromGuide(null)}
                    >
                        + Создать публичный шаблон
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={openCreate}>
                        + Новый гайд
                    </button>
                </div>
            </header>

            {loading && <div className="loading">Загружаем публичные шаблоны…</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <section className="guides-library">
                    <div className="guides-section__head">
                        <div>
                            <h2 className="guides-section__title">Библиотека шаблонов</h2>
                            <p className="guides-section__subtitle">
                                Встроенные сценарии и проекты-шаблоны пользователей.
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
                            <div className="guides-empty__icon">🌍</div>
                            <h3>Здесь пока пусто</h3>
                            <p>Создайте публичный шаблон или выберите другой фильтр.</p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => createPublicFromGuide(null)}
                            >
                                Создать публичный шаблон
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
                                                {PERIOD_LABEL[guide.periodType] || 'Шаблон'}
                                            </span>
                                            {guide.isSystem
                                                ? <span className="guide-badge guide-badge--system">встроенный</span>
                                                : <span className="guide-badge guide-badge--mine">
                                                    {guide.mine ? 'мой' : 'публичный'}
                                                </span>}
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
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm guide-card__publish"
                                            onClick={() => createPublicFromGuide(guide)}
                                            title="Создать из этого сценария публичный шаблон задач"
                                        >
                                            🌍 Создать публичный шаблон
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

            <ConfirmModal
                open={!!deleting}
                title="Удалить шаблон?"
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
