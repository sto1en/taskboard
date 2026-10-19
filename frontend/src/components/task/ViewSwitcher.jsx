import { useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import useT from '../../hooks/useT'
import { useUiStore } from '../../store/useUiStore'

const MODES = [
    { code: 'kanban',  icon: '▦' },
    { code: 'list',    icon: '☰' },
    { code: 'compact', icon: '⊞' },
]

const PANEL_ID = 'view-switcher'

export default observer(function ViewSwitcher({ mode, onChange }) {
    const t = useT()
    const ui = useUiStore()
    const open = ui.activeToolbar === PANEL_ID
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) ui.closeToolbar(PANEL_ID)
        }
        window.addEventListener('mousedown', onClick)
        return () => {
            window.removeEventListener('mousedown', onClick)
        }
    }, [open, ui])

    const toggle = () => {
        if (open) ui.closeToolbar(PANEL_ID)
        else ui.openToolbar(PANEL_ID)
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
                            onClick={() => { onChange(m.code); ui.closeToolbar(PANEL_ID) }}
                        >
                            <span className="view-switcher__item-icon">{m.icon}</span>
                            <span>{modeLabel(m.code)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
})