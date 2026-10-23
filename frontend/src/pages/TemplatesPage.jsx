import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { taskTemplatesApi } from '../api/api'
import ApplyPlanModal from '../components/templates/ApplyPlanModal'
import ConfirmModal from '../components/common/ConfirmModal'
import PublicTemplatesCatalog from '../components/templates/PublicTemplatesCatalog'
import TemplateCard from '../components/templates/TemplateCard'
import TemplatesSectionNav from '../components/templates/TemplatesSectionNav'

function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}

/**
 * Шаблоны:
 *   /templates                       — мои шаблоны
 *   /templates?tab=public            — публичные шаблоны
 *   /templates?tab=public&scope=mine — мои публичные шаблоны
 *   /templates?tab=public&scope=all  — публичные шаблоны пользователей
 */
export default function TemplatesPage() {
    const nav = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const tab = searchParams.get('tab') === 'public' ? 'public' : 'mine'
    const scope = searchParams.get('scope') === 'mine' ? 'mine' : 'all'

    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')

    const [applyTarget, setApplyTarget] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [deleteBusy, setDeleteBusy] = useState(false)
    const [visibilityBusy, setVisibilityBusy] = useState(null)

    const load = () => {
        setLoading(true)
        setError('')
        taskTemplatesApi.list()
            .then(({ data }) => setTemplates(data || []))
            .catch((err) => setError(err.response?.data?.message || 'Не удалось загрузить шаблоны'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    const setTab = (next) => {
        const p = new URLSearchParams(searchParams)
        if (next === 'public') {
            p.set('tab', 'public')
            if (!p.get('scope')) p.set('scope', 'all')
        } else {
            p.delete('tab')
            p.delete('scope')
        }
        setSearchParams(p, { replace: false })
    }

    const setScope = (next) => {
        const p = new URLSearchParams(searchParams)
        p.set('tab', 'public')
        p.set('scope', next)
        setSearchParams(p, { replace: false })
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return templates
        return templates.filter(t =>
            t.title.toLowerCase().includes(q)
            || (t.description || '').toLowerCase().includes(q)
            || (t.items || []).some(i => i.title.toLowerCase().includes(q))
        )
    }, [templates, query])

    const myPublicCount = useMemo(
        () => templates.filter(t => t.isPublic).length,
        [templates],
    )

    const openCreate = () => {
        nav('/templates/new')
    }

    const openCreatePublic = () => {
        nav('/templates/new?public=1')
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

    const handleTogglePublic = async (template) => {
        setVisibilityBusy(template.id)
        try {
            const { data } = await taskTemplatesApi.setVisibility(template.id, !template.isPublic)
            setTemplates(prev => prev.map(t => (t.id === data.id ? { ...t, isPublic: data.isPublic } : t)))
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось изменить видимость шаблона')
        } finally {
            setVisibilityBusy(null)
        }
    }

    const handleApply = async (payload) => {
        const { data } = await taskTemplatesApi.apply(applyTarget.id, payload)
        return data
    }

    return (
        <div className="templates-page">
            <TemplatesSectionNav
                tab={tab}
                scope={scope}
                myPublicCount={myPublicCount}
                onTabChange={setTab}
                onScopeChange={setScope}
            />

            {tab === 'mine' && (
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
            )}

            {tab === 'mine' && (
                <>
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
                        {filtered.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onApply={() => setApplyTarget(template)}
                                onOpen={() => openEdit(template)}
                                onDelete={() => setDeleting(template)}
                                onTogglePublic={() => handleTogglePublic(template)}
                                visibilityBusy={visibilityBusy === template.id}
                            />
                        ))}
                    </div>
                </>
            )}

            {tab === 'public' && (
                <PublicTemplatesCatalog
                    scope={scope}
                    onScopeChange={setScope}
                    onOpen={(template) => nav(`/templates/${template.id}/edit`)}
                    onCreatePublic={openCreatePublic}
                    onApply={(template) => setApplyTarget(template)}
                    onAfterChange={load}
                />
            )}

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
