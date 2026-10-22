import { useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import useT from '../../hooks/useT'
import { useUiStore } from '../../store/useUiStore'
import {
    IconArrowDown,
    IconArrowUp,
    IconCheck,
    IconChevronDown,
    IconSort,
} from '../common/ToolbarIcons'

const SORT_CODES = ['manual', 'by_status', 'by_deadline', 'by_priority', 'by_created']

const PANEL_ID = 'sort-switcher'

// Направление не влияет на приоритетную сортировку — там порядок всегда
// «сначала важные». Для ручного режима направление работает, поэтому
// прячем кнопку только для by_priority.
const DIR_IRRELEVANT = new Set(['by_priority'])

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

    const dirIrrelevant = DIR_IRRELEVANT.has(sortMode)
    const DirIcon = sortDir === 'asc' ? IconArrowUp : IconArrowDown

    return (
        <div className="sort-switcher" ref={ref}>
            <button
                type="button"
                className={`sort-switcher__btn ${open ? 'sort-switcher__btn--open' : ''} ${dirIrrelevant ? 'sort-switcher__btn--solo' : ''}`}
                onClick={toggle}
                title={t.taskSort}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <IconSort />
                <span className="sort-switcher__label">{sortLabel(sortMode)}</span>
                <IconChevronDown className="sort-switcher__caret" size={13} />
            </button>

            <button
                type="button"
                className={`sort-switcher__dir ${dirIrrelevant ? 'sort-switcher__dir--hidden' : ''}`}
                onClick={toggleDir}
                title={sortDir === 'asc' ? t.asc : t.desc}
                aria-label={sortDir === 'asc' ? t.asc : t.desc}
                tabIndex={dirIrrelevant ? -1 : undefined}
            >
                <DirIcon size={15} />
            </button>

            {open && (
                <div className="sort-switcher__menu" role="menu">
                    {SORT_CODES.map((code) => {
                        const active = code === sortMode
                        return (
                            <button
                                key={code}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                className={`sort-switcher__item ${active ? 'sort-switcher__item--active' : ''}`}
                                onClick={() => {
                                    onChange({ sortMode: code, sortDir })
                                    ui.closeToolbar(PANEL_ID)
                                }}
                            >
                                <span>{sortLabel(code)}</span>
                                {active && <IconCheck className="sort-switcher__check" size={14} />}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
})
