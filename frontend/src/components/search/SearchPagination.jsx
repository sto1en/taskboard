export default function SearchPagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null

    const pages = []
    const maxButtons = 7
    let start = Math.max(0, page - Math.floor(maxButtons / 2))
    let end = Math.min(totalPages - 1, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
        start = Math.max(0, end - maxButtons + 1)
    }

    if (start > 0) {
        pages.push(
            <button key="first" className="search-pagination__btn" onClick={() => onChange(0)}>1</button>
        )
        if (start > 1) pages.push(<span key="gap1" className="search-pagination__gap">…</span>)
    }

    for (let i = start; i <= end; i++) {
        pages.push(
            <button
                key={i}
                className={`search-pagination__btn ${i === page ? 'search-pagination__btn--active' : ''}`}
                onClick={() => onChange(i)}
            >
                {i + 1}
            </button>
        )
    }

    if (end < totalPages - 1) {
        if (end < totalPages - 2) pages.push(<span key="gap2" className="search-pagination__gap">…</span>)
        pages.push(
            <button
                key="last"
                className="search-pagination__btn"
                onClick={() => onChange(totalPages - 1)}
            >
                {totalPages}
            </button>
        )
    }

    return (
        <div className="search-pagination">
            <button
                className="search-pagination__arrow"
                onClick={() => onChange(Math.max(0, page - 1))}
                disabled={page === 0}
            >
                ←
            </button>
            {pages}
            <button
                className="search-pagination__arrow"
                onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
            >
                →
            </button>
        </div>
    )
}