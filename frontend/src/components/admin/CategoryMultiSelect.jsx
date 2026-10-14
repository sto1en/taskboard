import { useEffect, useRef, useState } from 'react'

export default function CategoryMultiSelect({ categories, selectedIds = [], onChange, placeholder = 'Выбрать типы...' }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        window.addEventListener('mousedown', onClick)
        return () => window.removeEventListener('mousedown', onClick)
    }, [open])

    const toggle = (id) => {
        const has = selectedIds.includes(id)
        const next = has ? selectedIds.filter(x => x !== id) : [...selectedIds, id]
        onChange(next)
    }

    const selectedTitles = categories
        .filter(c => selectedIds.includes(c.id))
        .map(c => c.title)

    const displayText = selectedTitles.length === 0
        ? placeholder
        : selectedTitles.join(', ')

    return (
        <div className="cat-ms" ref={ref}>
            <button
                type="button"
                className={`cat-ms__trigger ${open ? 'cat-ms__trigger--open' : ''}`}
                onClick={() => setOpen(v => !v)}
            >
                <span className={`cat-ms__trigger-text ${selectedTitles.length === 0 ? 'cat-ms__trigger-text--placeholder' : ''}`}>
                    {displayText}
                </span>
                <span className="cat-ms__trigger-caret">{open ? '▴' : '▾'}</span>
            </button>

            {open && (
                <div className="cat-ms__dropdown">
                    {categories.length === 0 ? (
                        <div className="cat-ms__empty">Нет типов</div>
                    ) : (
                        categories.map(c => {
                            const active = selectedIds.includes(c.id)
                            return (
                                <label key={c.id} className="cat-ms__item">
                                    <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() => toggle(c.id)}
                                    />
                                    <span className="cat-ms__item-title">{c.title}</span>
                                </label>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}