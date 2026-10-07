import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchApi } from '../api/api'
import useT from '../hooks/useT'
import SearchFilters from '../components/Search/SearchFilters'
import SearchResults from '../components/Search/SearchResults'
import SearchPagination from '../components/Search/SearchPagination'
import TaskDetailModal from '../components/Task/TaskDetailModal'

const KIND_ORDER = { task: 0, project: 1, board: 2, tag: 3 }

function isDoneItem(item) {
    return item.statusCategoryCode === 'DONE'
        || item.statusCategoryCode === 'CANCELLED'
        || item.statusCategoryCode === 'ARCHIVED'
}

function sortResults(items) {
    return [...(items || [])].sort((a, b) => {
        const doneA = isDoneItem(a) ? 1 : 0
        const doneB = isDoneItem(b) ? 1 : 0
        if (doneA !== doneB) return doneA - doneB
        const ka = KIND_ORDER[a.kind] ?? 99
        const kb = KIND_ORDER[b.kind] ?? 99
        if (ka !== kb) return ka - kb
        return (a.id || 0) - (b.id || 0)
    })
}

export default function SearchPage() {
    const t = useT()
    const [searchParams, setSearchParams] = useSearchParams()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({ items: [], total: 0, page: 0, size: 20, totalPages: 0, hasMore: false })
    const [openTaskId, setOpenTaskId] = useState(null)

    // Разбор URL → объект фильтров
    const filters = useMemo(() => {
        const arr = (key) => {
            const v = searchParams.get(key)
            if (!v) return []
            return v.split(',').filter(Boolean)
        }
        const arrNum = (key) => arr(key).map(Number).filter(n => !isNaN(n))

        return {
            q: searchParams.get('q') || '',
            types: arr('types'),
            boardIds: arrNum('boardIds'),
            projectIds: arrNum('projectIds'),
            statusIds: arrNum('statusIds'),
            tagIds: arrNum('tagIds'),
            priorities: arrNum('priorities'),
            hasDeadline: searchParams.get('hasDeadline') === 'true' ? true : null,
            from: searchParams.get('from') || null,
            to: searchParams.get('to') || null,
            page: Number(searchParams.get('page') || 0),
            size: Number(searchParams.get('size') || 20),
        }
    }, [searchParams])

    const buildQueryParams = (f) => {
        const p = new URLSearchParams()
        if (f.q) p.set('q', f.q)
        if (f.types?.length) p.set('types', f.types.join(','))
        if (f.boardIds?.length) p.set('boardIds', f.boardIds.join(','))
        if (f.projectIds?.length) p.set('projectIds', f.projectIds.join(','))
        if (f.statusIds?.length) p.set('statusIds', f.statusIds.join(','))
        if (f.tagIds?.length) p.set('tagIds', f.tagIds.join(','))
        if (f.priorities?.length) p.set('priorities', f.priorities.join(','))
        if (f.hasDeadline === true) p.set('hasDeadline', 'true')
        if (f.from) p.set('from', f.from)
        if (f.to) p.set('to', f.to)
        if (f.page > 0) p.set('page', String(f.page))
        if (f.size && f.size !== 20) p.set('size', String(f.size))
        return p
    }

    // Запрос на бэк
    useEffect(() => {
        const params = {}
        if (filters.q) params.q = filters.q
        if (filters.types?.length) params.types = filters.types
        if (filters.boardIds?.length) params.boardIds = filters.boardIds
        if (filters.projectIds?.length) params.projectIds = filters.projectIds
        if (filters.statusIds?.length) params.statusIds = filters.statusIds
        if (filters.tagIds?.length) params.tagIds = filters.tagIds
        if (filters.priorities?.length) params.priorities = filters.priorities
        if (filters.hasDeadline === true) params.hasDeadline = true
        if (filters.from) params.from = filters.from
        if (filters.to) params.to = filters.to
        params.page = filters.page
        params.size = filters.size

        const hasFilter =
            filters.q ||
            filters.types?.length ||
            filters.boardIds?.length ||
            filters.projectIds?.length ||
            filters.statusIds?.length ||
            filters.tagIds?.length ||
            filters.priorities?.length ||
            filters.hasDeadline === true ||
            filters.from ||
            filters.to

        if (!hasFilter) {
            setData({ items: [], total: 0, page: 0, size: 20, totalPages: 0, hasMore: false })
            setLoading(false)
            return
        }

        setLoading(true)
        searchApi.filter(params)
            .then(({ data }) => setData({
                ...data,
                items: sortResults(data.items),
            }))
            .catch(() => setData({ items: [], total: 0, page: 0, size: 20, totalPages: 0, hasMore: false }))
            .finally(() => setLoading(false))
    }, [
        filters.q,
        filters.types?.join(','),
        filters.boardIds?.join(','),
        filters.projectIds?.join(','),
        filters.statusIds?.join(','),
        filters.tagIds?.join(','),
        filters.priorities?.join(','),
        filters.hasDeadline,
        filters.from,
        filters.to,
        filters.page,
        filters.size,
    ])

    const updateFilters = (next) => {
        const p = buildQueryParams(next)
        setSearchParams(p, { replace: false })
    }

    const clearFilters = () => {
        const q = filters.q
        const p = new URLSearchParams()
        if (q) p.set('q', q)
        setSearchParams(p, { replace: false })
    }

    const goToPage = (page) => {
        updateFilters({ ...filters, page })
    }

    return (
        <div className="search-page">
            <div className="search-page__head">
                <h1 className="search-page__title">
                    {t.searchTitle || 'Search'}
                    {filters.q && <span className="search-page__query"> · «{filters.q}»</span>}
                </h1>
                {data.total > 0 && (
                    <span className="search-page__count">
                        {data.total} {t.searchResultsCount || 'results'}
                    </span>
                )}
            </div>

            <div className="search-page__body">
                <SearchFilters
                    filters={filters}
                    onChange={updateFilters}
                    onClear={clearFilters}
                />

                <div className="search-page__main">
                    <SearchResults
                        items={data.items}
                        query={filters.q}
                        loading={loading}
                        onOpenTask={(id) => setOpenTaskId(id)}
                    />

                    <SearchPagination
                        page={data.page}
                        totalPages={data.totalPages}
                        onChange={goToPage}
                    />
                </div>
            </div>

            <TaskDetailModal
                open={!!openTaskId}
                onClose={() => setOpenTaskId(null)}
                taskId={openTaskId}
                onOpenTask={(id) => setOpenTaskId(id)}
                onUpdated={() => {
                    const p = buildQueryParams(filters)
                    setSearchParams(p, { replace: false })
                }}
            />
        </div>
    )
}