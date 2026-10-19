import { useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import useT from '../../hooks/useT'
import { useUiStore } from '../../store/useUiStore'

const SORT_CODES = ['manual', 'by_status', 'by_deadline', 'by_priority', 'by_created']

const PANEL_ID = 'sort-switcher'

export default observer(function SortSwitcher({ sortMode, sortDir, onChange }) {
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

    const sortLabel = (code) => {
        switch (code) {
            case 'manual':      return t.sortManual
            case 'by_status':   return t.sortByStatus
            case 'by_deadline': return t.sortByDeadline
            case 'by_priority': return t.sortByPriority
            case 'by_created':  return t.sortByCreated
            default:            return code
        }
    }

    const toggleDir = () => {
        onChange({ sortMode, sortDir: sortDir === 'asc' ? 'desc' : 'asc' })
    }

    return (
        <div className="sort-switcher" ref={ref}>
            <button
                className="sort-switcher__btn"
                onClick={toggle}
                title={t.taskSort}
            >
                <span>⇅</span>
                <span className="sort-switcher__label">{sortLabel(sortMode)}</span>
                <span className="sort-switcher__caret">▾</span>
            </button>

            <button
                className="sort-switcher__dir"
                onClick={toggleDir}
                title={sortDir === 'asc' ? t.asc : t.desc}
            >
                {sortDir === 'asc' ? '↑' : '↓'}
            </button>

            {open && (
                <div className="sort-switcher__menu">
                    {SORT_CODES.map(code => (
                        <button
                            key={code}
                            className={`sort-switcher__item ${code === sortMode ? 'sort-switcher__item--active' : ''}`}
                            onClick={() => { onChange({ sortMode: code, sortDir }); ui.closeToolbar(PANEL_ID) }}
                        >
                            {sortLabel(code)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
})