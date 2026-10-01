import { useEffect, useMemo, useRef, useState } from 'react'
import { boardsApi, statusesApi, tagsApi } from '../../api/api'
import useT from '../../hooks/useT'

const TYPES = [
    { code: 'BOARD',   labelKey: 'groupBoards' },
    { code: 'PROJECT', labelKey: 'groupProjects' },
    { code: 'TASK',    labelKey: 'groupTasks' },
    { code: 'TAG',     labelKey: 'groupTags' },
]

const PRIORITIES = [
    { code: 0, labelKey: 'priorityNormal' },
    { code: 1, labelKey: 'priorityHigh' },
    { code: 2, labelKey: 'priorityUrgent' },
]

function useBoards() {
    const [boards, setBoards] = useState([])
    useEffect(() => {
        boardsApi.list().then(({ data }) => setBoards(data)).catch(() => setBoards([]))
    }, [])
    return boards
}

function useStatuses(boardIds, allBoards) {
    const [statuses, setStatuses] = useState([])
    useEffect(() => {
        let targetBoardIds = boardIds
        if (!boardIds || boardIds.length === 0) {
            if (!allBoards || allBoards.length === 0) {
                setStatuses([])
                return
            }
            targetBoardIds = allBoards.map(b => b.id)
        }
        Promise.all(
            targetBoardIds.map(id =>
                statusesApi.list(id, 'task')
                    .then(({ data }) => data)
                    .catch(() => [])
            )
        ).then(arrays => {
            const map = new Map()
            arrays.flat().forEach(s => map.set(s.id, s))
            setStatuses([...map.values()])
        })
    }, [boardIds?.join(','), allBoards?.map(b => b.id).join(',')])
    return statuses
}

function useTags(boardIds, allBoards) {
    const [tags, setTags] = useState([])
    useEffect(() => {
        let targetBoardIds = boardIds
        if (!boardIds || boardIds.length === 0) {
            if (!allBoards || allBoards.length === 0) {
                setTags([])
                return
            }
            targetBoardIds = allBoards.map(b => b.id)
        }
        Promise.all(
            targetBoardIds.map(id =>
                tagsApi.listByBoard(id)
                    .then(({ data }) => data)
                    .catch(() => [])
            )
        ).then(arrays => {
            const map = new Map()
            arrays.flat().forEach(t => map.set(t.id, t))
            setTags([...map.values()])
        })
    }, [boardIds?.join(','), allBoards?.map(b => b.id).join(',')])
    return tags
}

/* ============================================================
   Сворачиваемая секция-фильтр
   ============================================================ */

function FilterSection({ title, count, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className={`search-filter-section ${open ? '' : 'search-filter-section--closed'}`}>
            <button
                type="button"
                className="search-filter-section__head"
                onClick={() => setOpen(v => !v)}
            >
                <span className="search-filter-section__caret">{open ? '▾' : '▸'}</span>
                <span className="search-filter-section__title">{title}</span>
                {count > 0 && (
                    <span className="search-filter-section__count">{count}</span>
                )}
            </button>
            {open && (
                <div className="search-filter-section__body">
                    {children}
                </div>
            )}
        </div>
    )
}

/* ============================================================
   Чекбокс с indeterminate
   ============================================================ */

function IndeterminateCheckbox({ checked, indeterminate, onChange, className = '' }) {
    const ref = useRef(null)

    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate
        }
    }, [indeterminate])

    return (
        <input
            ref={ref}
            type="checkbox"
            className={className}
            checked={checked}
            onChange={onChange}
        />
    )
}

/* ============================================================
   Секция с поиском (Доски / Статусы / Теги)
   ============================================================ */

function SearchableSection({
                               title,
                               items,
                               renderItem,
                               filterKey,
                               allLabel,
                               emptyText = 'Ничего не найдено',
                               selectedIds = [],
                               onChange,
                               showAllThreshold = 8,
                               defaultOpen = true,
                           }) {
    const [query, setQuery] = useState('')
    const [showAll, setShowAll] = useState(false)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return items
        return items.filter(it =>
            String(it.title || '').toLowerCase().includes(q)
        )
    }, [items, query])

    const visible = showAll ? filtered : filtered.slice(0, showAllThreshold)
    const hasMore = filtered.length > showAllThreshold

    const allIds = items.map(it => it.id)
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id))
    const indeterminate = selectedIds.length > 0 && !allSelected

    const handleToggleAll = () => {
        if (allSelected) {
            onChange(filterKey, [])
        } else {
            onChange(filterKey, allIds)
        }
    }

    const handleToggleOne = (id) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id]
        onChange(filterKey, next)
    }

    return (
        <FilterSection title={title} count={selectedIds.length} defaultOpen={defaultOpen}>
            <div className="search-filter-search">
                <span className="search-filter-search__icon">🔍</span>
                <input
                    type="text"
                    className="search-filter-search__input"
                    placeholder="Поиск"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <label className="search-filter-check search-filter-check--all">
                <IndeterminateCheckbox
                    className="all-check"
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onChange={handleToggleAll}
                />
                <span>{allLabel}</span>
            </label>

            <div className="search-filter-list">
                {visible.map(it => (
                    <label key={it.id} className="search-filter-check">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(it.id)}
                            onChange={() => handleToggleOne(it.id)}
                        />
                        {renderItem(it)}
                    </label>
                ))}
                {filtered.length === 0 && (
                    <div className="search-filter-empty">{emptyText}</div>
                )}
            </div>

            {hasMore && !showAll && (
                <button
                    type="button"
                    className="search-filter-show-all"
                    onClick={() => setShowAll(true)}
                >
                    Показать всё ▾
                </button>
            )}
        </FilterSection>
    )
}

/* ============================================================
   Простая сворачиваемая секция
   ============================================================ */

function SimpleSection({ title, count, defaultOpen = true, children }) {
    return (
        <FilterSection title={title} count={count} defaultOpen={defaultOpen}>
            <div className="search-filter-list search-filter-list--simple">
                {children}
            </div>
        </FilterSection>
    )
}

/* ============================================================
   Хелперы для рендера строк
   ============================================================ */

function accentOf(obj) {
    return obj.accentCode || obj.accent || obj.color || 'blue'
}

function iconOf(obj) {
    return obj.icon || obj.emoji || null
}

/* ============================================================
   Главный компонент
   ============================================================ */

export default function SearchFilters({
                                          filters,
                                          onChange,
                                          onClear,
                                      }) {
    const t = useT()
    const [collapsed, setCollapsed] = useState(true)

    const boards = useBoards()
    const statuses = useStatuses(filters.boardIds, boards)
    const tags = useTags(filters.boardIds, boards)

    const toggleInArray = (key, value) => {
        const arr = filters[key] || []
        const next = arr.includes(value)
            ? arr.filter(v => v !== value)
            : [...arr, value]
        onChange({ ...filters, [key]: next, page: 0 })
    }

    const setArray = (key, values) => {
        onChange({ ...filters, [key]: values, page: 0 })
    }

    const setField = (key, value) => {
        onChange({ ...filters, [key]: value, page: 0 })
    }

    const hasAny =
        (filters.types?.length || 0) > 0 ||
        (filters.boardIds?.length || 0) > 0 ||
        (filters.projectIds?.length || 0) > 0 ||
        (filters.statusIds?.length || 0) > 0 ||
        (filters.tagIds?.length || 0) > 0 ||
        (filters.priorities?.length || 0) > 0 ||
        filters.hasDeadline != null ||
        filters.from ||
        filters.to

    const activeCount = [
        (filters.types?.length || 0),
        (filters.boardIds?.length || 0),
        (filters.projectIds?.length || 0),
        (filters.statusIds?.length || 0),
        (filters.tagIds?.length || 0),
        (filters.priorities?.length || 0),
        filters.hasDeadline === true ? 1 : 0,
        filters.from ? 1 : 0,
        filters.to ? 1 : 0,
    ].reduce((a, b) => a + b, 0)

    return (
        <aside className={`search-filters ${collapsed ? 'search-filters--collapsed' : ''}`}>
            <button
                type="button"
                className="search-filters__toggle"
                onClick={() => setCollapsed(v => !v)}
                title={collapsed ? 'Показать фильтры' : 'Свернуть фильтры'}
            >
                <span className="search-filters__toggle-caret">
                    {collapsed ? '▶' : '▼'}
                </span>
                <span className="search-filters__title">{t.filters}</span>
                {activeCount > 0 && (
                    <span className="search-filters__badge">{activeCount}</span>
                )}
            </button>

            {!collapsed && (
                <div className="search-filters__body">
                    {hasAny && (
                        <button className="search-filters__clear" onClick={onClear}>
                            {t.resetFilters}
                        </button>
                    )}

                    {/* 1. Тип — развёрнут */}
                    <SimpleSection
                        title={t.searchFilterType || 'Тип'}
                        count={filters.types?.length || 0}
                    >
                        {TYPES.map(type => (
                            <label key={type.code} className="search-filter-check">
                                <input
                                    type="checkbox"
                                    checked={(filters.types || []).includes(type.code)}
                                    onChange={() => toggleInArray('types', type.code)}
                                />
                                <span>{t[type.labelKey]}</span>
                            </label>
                        ))}
                    </SimpleSection>

                    {/* 2. Доски — развёрнут */}
                    {boards.length > 0 && (
                        <SearchableSection
                            title={t.groupBoards}
                            items={boards}
                            filterKey="boardIds"
                            allLabel={`Все ${t.groupBoards.toLowerCase()}`}
                            selectedIds={filters.boardIds || []}
                            onChange={setArray}
                            renderItem={(b) => (
                                <>
                                    <span
                                        className="search-filter-dot"
                                        style={{ backgroundColor: `var(--accent-${accentOf(b)})` }}
                                    />
                                    <span className="search-filter-check__text">
                                        {iconOf(b) && <span className="search-filter-icon">{iconOf(b)}</span>}
                                        {b.title}
                                    </span>
                                </>
                            )}
                        />
                    )}

                    {/* 3. Статус — свёрнут по умолчанию */}
                    {statuses.length > 0 && (
                        <SearchableSection
                            title={t.statusLabel || 'Статус'}
                            items={statuses}
                            filterKey="statusIds"
                            allLabel="Все статусы"
                            selectedIds={filters.statusIds || []}
                            onChange={setArray}
                            defaultOpen={false}
                            renderItem={(s) => (
                                <>
                                    <span
                                        className="search-filter-dot"
                                        style={{ backgroundColor: `var(--accent-${accentOf(s)})` }}
                                    />
                                    <span className="search-filter-check__text">
                                        {iconOf(s) && <span className="search-filter-icon">{iconOf(s)}</span>}
                                        {s.title}
                                    </span>
                                </>
                            )}
                        />
                    )}

                    {/* 4. Теги — свёрнуты по умолчанию, с эмодзи и цветом */}
                    {tags.length > 0 && (
                        <SearchableSection
                            title={t.tagsLabel || 'Теги'}
                            items={tags}
                            filterKey="tagIds"
                            allLabel="Все теги"
                            selectedIds={filters.tagIds || []}
                            onChange={setArray}
                            defaultOpen={false}
                            renderItem={(tag) => (
                                <>
                                    <span
                                        className="search-filter-dot"
                                        style={{ backgroundColor: `var(--accent-${accentOf(tag)})` }}
                                    />
                                    <span className="search-filter-check__text">
                                        {iconOf(tag) && (
                                            <span className="search-filter-tag-icon">{iconOf(tag)}</span>
                                        )}
                                        {tag.title}
                                    </span>
                                </>
                            )}
                        />
                    )}

                    {/* 5. Приоритет — развёрнут */}
                    <SimpleSection
                        title={t.priorityLabel || 'Приоритет'}
                        count={filters.priorities?.length || 0}
                    >
                        {PRIORITIES.map(p => (
                            <label key={p.code} className="search-filter-check">
                                <input
                                    type="checkbox"
                                    checked={(filters.priorities || []).includes(p.code)}
                                    onChange={() => toggleInArray('priorities', p.code)}
                                />
                                <span>{t[p.labelKey]}</span>
                            </label>
                        ))}
                    </SimpleSection>

                    {/* 6. Дедлайн — развёрнут */}
                    <SimpleSection
                        title={t.deadlineLabel || 'Дедлайн'}
                        count={filters.hasDeadline === true ? 1 : 0}
                    >
                        <label className="search-filter-check">
                            <input
                                type="checkbox"
                                checked={filters.hasDeadline === true}
                                onChange={(e) => setField('hasDeadline', e.target.checked ? true : null)}
                            />
                            <span>{t.searchHasDeadline || 'Есть дедлайн'}</span>
                        </label>
                    </SimpleSection>

                    {/* 7. Дата создания — свёрнута по умолчанию */}
                    <SimpleSection
                        title={t.searchDateLabel || 'Дата создания'}
                        defaultOpen={false}
                    >
                        <input
                            type="date"
                            className="input search-filter-date"
                            value={filters.from || ''}
                            onChange={(e) => setField('from', e.target.value || null)}
                        />
                        <input
                            type="date"
                            className="input search-filter-date"
                            value={filters.to || ''}
                            onChange={(e) => setField('to', e.target.value || null)}
                        />
                    </SimpleSection>
                </div>
            )}
        </aside>
    )
}