import { useState, useRef, useEffect } from 'react'
import useT from '../../hooks/useT'

const MODES = [
    { code: 'kanban',  icon: '▦' },
    { code: 'list',    icon: '☰' },
    { code: 'compact', icon: '⊞' },
]

const PANEL_ID = 'view-switcher'

export default function ViewSwitcher({ mode, onChange }) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        const onCloseOthers = (e) => {
            if (e.detail !== PANEL_ID) setOpen(false)
        }
        window.addEventListener('mousedown', onClick)
        window.addEventListener('toolbar:close', onCloseOthers)
        return () => {
            window.removeEventListener('mousedown', onClick)
            window.removeEventListener('toolbar:close', onCloseOthers)
        }
    }, [open])

    const toggle = () => {
        if (!open) {
            window.dispatchEvent(new CustomEvent('toolbar:close', { detail: PANEL_ID }))
        }
        setOpen(v => !v)
    }

    const modeLabel = (code) => {
        switch (code) {
            case 'kanban':  return t.viewKanban
            case 'list':    return t.viewList
            case 'compact': return t.viewCompact
            default:        return code
        }
    }

    const current = MODES.find(m => m.code === mode) || MODES[0]

    return (
        <div className="view-switcher" ref={ref}>
            <button
                className="view-switcher__btn"
                onClick={toggle}
                title={t.viewProject}
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
                            <span>{modeLabel(m.code)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}