import { useState, useRef, useEffect } from 'react'
import useT from '../../hooks/useT'

const SORT_CODES = ['manual', 'by_status', 'by_deadline', 'by_priority', 'by_created']

const PANEL_ID = 'sort-switcher'

export default function SortSwitcher({ sortMode, sortDir, onChange }) {
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
                            onClick={() => { onChange({ sortMode: code, sortDir }); setOpen(false) }}
                        >
                            {sortLabel(code)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}