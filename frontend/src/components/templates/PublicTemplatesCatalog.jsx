import { useEffect, useMemo, useRef, useState } from 'react'
import { taskTemplatesApi } from '../../api/api'
import TemplateCard from './TemplateCard'
import { plural } from './templateUtils'

const SORTS = [
    { code: 'newest', label: 'Сначала новые' },
    { code: 'oldest', label: 'Сначала старые' },
    { code: 'title', label: 'По названию (А–Я)' },
    { code: 'tasks', label: 'По числу задач' },
]

const SIZES = [12, 24, 48]

function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null

    const pages = []
    const maxButtons = 7
    let start = Math.max(0, page - Math.floor(maxButtons / 2))
    let end = Math.min(totalPages - 1, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) start = Math.max(0, end - maxButtons + 1)

    if (start > 0) {
        pages.push(<button key="first" className="search-pagination__btn" onClick={() => onChange(0)}>1</button>)
        if (start > 1) pages.push(<span key="gap1" className="search-pagination__gap">…</span>)
    }
    for (let i = start; i <= end; i += 1) {
        pages.push(
            <button
                key={i}
                className={`search-pagination__btn ${i === page ? 'search-pagination__btn--active' : ''}`}
                onClick={() => onChange(i)}
            >
                {i + 1}
            </button>,
        )
    }
    if (end < totalPages - 1) {
        if (end < totalPages - 2) pages.push(<span key="gap2" className="search-pagination__gap">…</span>)
        pages.push(
            <button key="last" className="search-pagination__btn" onClick={() => onChange(totalPages - 1)}>
                {totalPages}
            </button>,
        )
    }

    return (
        <div className="search-pagination">
            <button
                className="search-pagination__arrow"
                onClick={() => onChange(Math.max(0, page - 1))}
                disabled={page === 0}
            >←</button>
            {pages}
            <button
                className="search-pagination__arrow"
                onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
            >→</button>
        </div>
    )
}

/**
 * Каталог публичных шаблонов: поиск, фильтры (как в поисковике),
 * сортировка и пагинация.
 *
 * scope === 'mine' — только собственные публичные шаблоны пользователя.
 */
export default function PublicTemplatesCatalog({
    scope = 'all',
    onOpen,
    onCreatePublic,
    onApply,
    onAfterChange,
}) {
    const mineOnly = scope === 'mine'

    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [sort, setSort] = useState('newest')
    const [size, setSize] = useState(12)
    const [page, setPage] = useState(0)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [minTasks, setMinTasks] = useState('')
    const [onlyWithDescription, setOnlyWithDescription] = useState(false)

    const [data, setData] = useState({ items: [], total: 0, page: 0, totalPages: 0, hasMore: false })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copying, setCopying] = useState(null)
    const [applying, setApplying] = useState(null)

    const reqId = useRef(0)

    // debounce поиска
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
        return () => clearTimeout(timer)
    }, [query])

    // смена scope/фильтров — с первой страницы
    useEffect(() => {
        setPage(0)
    }, [scope, sort, size, debouncedQuery, minTasks, onlyWithDescription])

    useEffect(() => {
        const id = ++reqId.current
        setLoading(true)
        setError('')
        taskTemplatesApi.listPublic({
            q: debouncedQuery || undefined,
            sort,
            mine: mineOnly,
            page,
            size,
        })
            .then(({ data: res }) => {
                if (id !== reqId.current) return
                setData(res || { items: [], total: 0, page: 0, totalPages: 0, hasMore: false })
            })
            .catch((err) => {
                if (id !== reqId.current) return
                setError(err.response?.data?.message || 'Не удалось загрузить публичные шаблоны')
            })
            .finally(() => {
                if (id === reqId.current) setLoading(false)
            })
    }, [debouncedQuery, sort, mineOnly, page, size])

    // Клиентские фильтры поверх серверного поиска (как в поисковике)
    const items = useMemo(() => {
        const min = Number(minTasks)
        return (data.items || []).filter(item => {
            if (Number.isFinite(min) && min > 0 && (item.itemCount ?? 0) < min) return false
            // description — пустая строка у шаблонов без описания; null-safe на всякий случай.
            if (onlyWithDescription && !(item.description ?? '').trim()) return false
            return true
        })
    }, [data.items, minTasks, onlyWithDescription])

    const activeFilters = (minTasks ? 1 : 0) + (onlyWithDescription ? 1 : 0) + (query ? 1 : 0)

    const resetFilters = () => {
        setQuery('')
        setMinTasks('')
        setOnlyWithDescription(false)
        setSort('newest')
        setSize(12)
    }

    const handleApply = (template) => {
        setApplying(template.id)
        onApply?.(template)
        // Сбрасываем «занято» после закрытия модалки — состояние локальное.
        setTimeout(() => setApplying(null), 400)
    }

    const handleCopy = async (template) => {
        setCopying(template.id)
        try {
            const { data: copy } = await taskTemplatesApi.duplicate(template.id)
            onAfterChange?.()
            // Открываем копию в редакторе — так же, как «Скопировать» у гайдов.
            onOpen?.(copy)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось скопировать шаблон')
        } finally {
            setCopying(null)
        }
    }

    return (
        <div className="pubtpl">
            <header className="pubtpl__head">
                <div className="pubtpl__head-text">
                    <div className="templates-hero__kicker">
                        {mineOnly ? '⭐ Мои публичные шаблоны' : '🌍 Публичные шаблоны пользователей'}
                    </div>
                    <h1 className="templates-hero__title">
                        {mineOnly
                            ? 'Шаблоны, которые видят все'
                            : 'Библиотека шаблонов сообщества'}
                    </h1>
                    <p className="templates-hero__subtitle">
                        {mineOnly
                            ? 'Опубликуйте готовый сценарий — его увидят и смогут применить другие пользователи.'
                            : 'Готовые наборы задач от других пользователей: найдите подходящий, примените на доску или создайте свою копию.'}
                    </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={onCreatePublic}>
                    + Создать публичный шаблон
                </button>
            </header>

            <div className="pubtpl__toolbar">
                <div className="pubtpl__search">
                    <span className="pubtpl__search-icon">🔍</span>
                    <input
                        className="input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Поиск по названию, описанию и задачам…"
                        aria-label="Поиск публичных шаблонов"
                    />
                </div>

                <select
                    className="input pubtpl__sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Сортировка"
                >
                    {SORTS.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                </select>

                <button
                    type="button"
                    className={`btn btn-ghost pubtpl__filters-btn ${filtersOpen ? 'is-open' : ''}`}
                    onClick={() => setFiltersOpen(v => !v)}
                >
                    ⚙️ Фильтры
                    {activeFilters > 0 && <span className="pubtpl__badge">{activeFilters}</span>}
                </button>

                <span className="templates-count">
                    {data.total} {plural(data.total, ['шаблон', 'шаблона', 'шаблонов'])}
                </span>
            </div>

            {filtersOpen && (
                <div className="pubtpl__filters">
                    <label className="pubtpl__filter">
                        <span>Минимум задач</span>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            value={minTasks}
                            onChange={(e) => setMinTasks(e.target.value)}
                            placeholder="—"
                        />
                    </label>

                    <label className="pubtpl__filter pubtpl__filter--check">
                        <input
                            type="checkbox"
                            checked={onlyWithDescription}
                            onChange={(e) => setOnlyWithDescription(e.target.checked)}
                        />
                        <span>Только с описанием</span>
                    </label>

                    <label className="pubtpl__filter">
                        <span>На странице</span>
                        <select
                            className="input"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                        >
                            {SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </label>

                    <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
                        Сбросить
                    </button>
                </div>
            )}

            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Загружаем публичные шаблоны…</div>}

            {!loading && !error && items.length === 0 && (
                <div className="templates-empty">
                    <div className="templates-empty__icon">🌍</div>
                    <h3>
                        {mineOnly
                            ? 'У вас пока нет публичных шаблонов'
                            : 'Публичных шаблонов пока нет'}
                    </h3>
                    <p>
                        {mineOnly
                            ? 'Откройте свой шаблон и включите тумблер «Публичный шаблон» — он появится здесь и в общем каталоге.'
                            : 'Станьте первым: опубликуйте готовый сценарий, чтобы им могли пользоваться другие.'}
                    </p>
                    <button type="button" className="btn btn-primary" onClick={onCreatePublic}>
                        Создать публичный шаблон
                    </button>
                </div>
            )}

            {!loading && items.length > 0 && (
                <div className="templates-grid">
                    {items.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            showOwner
                            applying={applying === template.id}
                            onApply={() => handleApply(template)}
                            onOpen={() => onOpen?.(template)}
                            onCopy={() => handleCopy(template)}
                        />
                    ))}
                </div>
            )}

            <Pagination
                page={data.page || 0}
                totalPages={data.totalPages || 0}
                onChange={(next) => {
                    setPage(next)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
            />
        </div>
    )
}
