// frontend/src/components/Shop/ShopPagination.jsx

import { useMemo } from 'react'

export default function ShopPagination({ page, pageSize, total, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const pages = useMemo(() => {
        if (totalPages <= 1) return []
        const result = []
        const maxVisible = 7

        let start = Math.max(0, page - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages - 1, start + maxVisible - 1)
        if (end - start + 1 < maxVisible) {
            start = Math.max(0, end - maxVisible + 1)
        }

        if (start > 0) {
            result.push({ type: 'page', value: 0 })
            if (start > 1) result.push({ type: 'gap', key: 'gap1' })
        }

        for (let i = start; i <= end; i++) {
            result.push({ type: 'page', value: i })
        }

        if (end < totalPages - 1) {
            if (end < totalPages - 2) result.push({ type: 'gap', key: 'gap2' })
            result.push({ type: 'page', value: totalPages - 1 })
        }

        return result
    }, [page, totalPages])

    if (totalPages <= 1) return null

    const goTo = (p) => {
        if (p < 0 || p >= totalPages || p === page) return
        onChange(p)
        const shop = document.querySelector('.shop')
        if (shop) shop.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="shop-pagination">
            <button
                type="button"
                className="shop-pagination__arrow"
                onClick={() => goTo(page - 1)}
                disabled={page === 0}
                aria-label="Предыдущая страница"
            >
                ←
            </button>

            {pages.map((p, i) => {
                if (p.type === 'gap') {
                    return (
                        <span key={p.key || `gap-${i}`} className="shop-pagination__gap">
                            …
                        </span>
                    )
                }
                const isActive = p.value === page
                return (
                    <button
                        key={p.value}
                        type="button"
                        className={`shop-pagination__btn ${isActive ? 'shop-pagination__btn--active' : ''}`}
                        onClick={() => goTo(p.value)}
                    >
                        {p.value + 1}
                    </button>
                )
            })}

            <button
                type="button"
                className="shop-pagination__arrow"
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Следующая страница"
            >
                →
            </button>
        </div>
    )
}