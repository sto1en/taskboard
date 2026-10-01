import useT from '../../hooks/useT'
import SearchResultItem from './SearchResultItem'

export default function SearchResults({ items, query, loading, onOpenTask }) {
    const t = useT()

    if (loading) {
        return <div className="search-results__loading">{t.searchLoading}</div>
    }

    if (!items || items.length === 0) {
        return (
            <div className="search-results__empty">
                <div className="search-results__empty-icon">🔍</div>
                <div className="search-results__empty-text">{t.searchEmpty}</div>
            </div>
        )
    }

    return (
        <div className="search-results">
            {items.map(item => (
                <SearchResultItem
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    query={query}
                    onOpenTask={onOpenTask}
                />
            ))}
        </div>
    )
}