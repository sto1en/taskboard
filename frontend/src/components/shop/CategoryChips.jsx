import { useEffect, useRef, useState } from 'react'

export default function CategoryChips({
                                          categories,
                                          selectedIds = [],
                                          onToggle,
                                          onClearAll,
                                          allLabel = 'Все',
                                          scrollThreshold = 10,
                                      }) {
    const scrollerRef = useRef(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const needScroll = categories.length > scrollThreshold

    const updateArrows = () => {
        const el = scrollerRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 4)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    useEffect(() => {
        updateArrows()
        const el = scrollerRef.current
        if (!el) return
        el.addEventListener('scroll', updateArrows)
        window.addEventListener('resize', updateArrows)
        return () => {
            el.removeEventListener('scroll', updateArrows)
            window.removeEventListener('resize', updateArrows)
        }
    }, [categories])

    const scrollBy = (delta) => {
        scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
    }

    const allActive = selectedIds.length === 0

    return (
        <div className="category-chips">
            {needScroll && (
                <button
                    type="button"
                    className="category-chips__arrow"
                    onClick={() => scrollBy(-200)}
                    disabled={!canScrollLeft}
                    aria-label="Прокрутить влево"
                >
                    ‹
                </button>
            )}

            <div className="category-chips__scroller" ref={scrollerRef}>
                <button
                    type="button"
                    className={`category-chip ${allActive ? 'category-chip--active' : ''}`}
                    onClick={onClearAll}
                >
                    {allLabel}
                </button>

                {categories.map(cat => {
                    const active = selectedIds.includes(cat.id)
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            className={`category-chip ${active ? 'category-chip--active' : ''}`}
                            onClick={() => onToggle(cat.id)}
                        >
                            {cat.title}
                        </button>
                    )
                })}
            </div>

            {needScroll && (
                <button
                    type="button"
                    className="category-chips__arrow"
                    onClick={() => scrollBy(200)}
                    disabled={!canScrollRight}
                    aria-label="Прокрутить вправо"
                >
                    ›
                </button>
            )}
        </div>
    )
}