import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import useT from '../../hooks/useT'
import { useUiStore } from '../../store/useUiStore'
import { IconClose, IconFilter, IconPin } from '../common/ToolbarIcons'

const PANEL_ID = 'filters-bar'

/**
 * Фильтр по статусам + закрепление.
 *
 * Кнопка в тулбаре теперь одна: воронка с количеством выбранных статусов.
 * «Сбросить» и «Закрепить фильтр» живут внутри панели — раньше это были
 * две безымянные иконки (🧹 и 📌) рядом с кнопкой, и было непонятно,
 * что именно они делают.
 */
export default observer(function FiltersBar({
    columns,
    activeStatuses,
    onStatusToggle,
    onClear,
    pinned = false,
    onTogglePin,
    saving = false,
}) {
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

    const togglePanel = () => {
        if (open) ui.closeToolbar(PANEL_ID)
        else ui.openToolbar(PANEL_ID)
    }

    const count = activeStatuses.length
    const canReset = count > 0 || pinned
    const canPin = count > 0 || pinned

    return (
        <div className="filters-bar" ref={ref}>
            <button
                type="button"
                className={`filters-bar__btn ${count > 0 ? 'filters-bar__btn--active' : ''}`}
                onClick={togglePanel}
                title={t.filters}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <IconFilter size={15} />
                <span className="filters-bar__btn-label">{t.filters}</span>
                {count > 0 && <span className="filters-bar__badge">{count}</span>}
                {pinned && <IconPin className="filters-bar__pin-mark" filled size={12} />}
            </button>

            {open && (
                <div className="filters-bar__panel" role="dialog" aria-label={t.filters}>
                    <div className="filters-bar__title">{t.showStatuses}</div>

                    <div className="filters-bar__statuses">
                        {columns.map((col) => (
                            <label key={col.statusId} className="filters-bar__checkbox">
                                <input
                                    type="checkbox"
                                    checked={activeStatuses.includes(col.statusId)}
                                    onChange={() => onStatusToggle(col.statusId)}
                                />
                                <span
                                    className="filters-bar__dot"
                                    style={{ background: `var(--accent-${col.accentCode || 'gray'})` }}
                                />
                                <span className="filters-bar__checkbox-title">{col.title}</span>
                                <span className="filters-bar__count">{col.count}</span>
                            </label>
                        ))}
                    </div>

                    <div className="filters-bar__footer">
                        <button
                            type="button"
                            className="filters-bar__footer-btn"
                            onClick={onClear}
                            disabled={!canReset}
                        >
                            <IconClose size={13} />
                            <span>{t.resetFilters}</span>
                        </button>

                        <button
                            type="button"
                            className={`filters-bar__footer-btn filters-bar__footer-btn--pin ${pinned ? 'filters-bar__footer-btn--active' : ''}`}
                            onClick={onTogglePin}
                            disabled={!canPin || saving}
                            title={pinned ? t.unpinFilterShort : t.pinFilterShort}
                        >
                            <IconPin filled={pinned} size={13} />
                            <span>{saving ? '…' : pinned ? t.unpinFilterShort : t.pinFilterShort}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})
