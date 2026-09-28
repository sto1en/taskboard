import { useState, useRef, useEffect } from 'react'

const MODES = [
    { code: 'auto',    label: 'Авто',      icon: '✨' },
    { code: 'kanban',  label: 'Kanban',    icon: '▦' },
    { code: 'list',    label: 'Список',    icon: '☰' },
    { code: 'compact', label: 'Компакт',   icon: '⊞' },
]

export default function ViewSwitcher({ mode, onChange }) {
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

    const current = MODES.find(m => m.code === mode) || MODES[0]

    return (
        <div className="view-switcher" ref={ref}>
            <button
                className="view-switcher__btn"
                onClick={() => setOpen(v => !v)}
                title="Вид отображения"
            >
                <span className="view-switcher__icon">{current.icon}</span>
                <span className="view-switcher__caret">▾</span>
            </button>

            {open && (
                <div className="view-switcher__menu">
                    {MODES.map(m => (
                        <button
                            key={m.code}
                            className={`view-switcher__item ${m.code === mode ? 'view-switcher__item--active' : ''}`}
                            onClick={() => { onChange(m.code); setOpen(false) }}
                        >
                            <span className="view-switcher__item-icon">{m.icon}</span>
                            <span>{m.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}