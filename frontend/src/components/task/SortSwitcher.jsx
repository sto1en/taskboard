import { useState, useRef, useEffect } from 'react'

const SORTS = [
    { code: 'manual',      label: 'Ручная' },
    { code: 'by_status',   label: 'По статусу' },
    { code: 'by_deadline', label: 'По дедлайну' },
    { code: 'by_priority', label: 'По приоритету' },
    { code: 'by_created',  label: 'По дате создания' },
]

export default function SortSwitcher({ sortMode, sortDir, onChange }) {
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

    const current = SORTS.find(s => s.code === sortMode) || SORTS[0]

    const toggleDir = () => {
        onChange({ sortMode, sortDir: sortDir === 'asc' ? 'desc' : 'asc' })
    }

    return (
        <div className="sort-switcher" ref={ref}>
            <button
                className="sort-switcher__btn"
                onClick={() => setOpen(v => !v)}
                title="Сортировка"
            >
                <span>⇅</span>
                <span className="sort-switcher__label">{current.label}</span>
                <span className="sort-switcher__caret">▾</span>
            </button>

            <button
                className="sort-switcher__dir"
                onClick={toggleDir}
                title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}
            >
                {sortDir === 'asc' ? '↑' : '↓'}
            </button>

            {open && (
                <div className="sort-switcher__menu">
                    {SORTS.map(s => (
                        <button
                            key={s.code}
                            className={`sort-switcher__item ${s.code === sortMode ? 'sort-switcher__item--active' : ''}`}
                            onClick={() => { onChange({ sortMode: s.code, sortDir }); setOpen(false) }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}