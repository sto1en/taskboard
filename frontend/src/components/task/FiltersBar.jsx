import { useState, useEffect, useRef } from 'react'
import { projectFiltersApi } from '../../api/api'
import useT from '../../hooks/useT'

const PANEL_ID = 'filters-bar'

export default function FiltersBar({
                                       columns,
                                       activeStatuses,
                                       onStatusToggle,
                                       onClear,
                                       projectId,
                                   }) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const [pinned, setPinned] = useState(false)
    const [saving, setSaving] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!projectId) {
            setPinned(false)
            return
        }
        projectFiltersApi.get(projectId)
            .then(({ data }) => {
                setPinned(!!data && Array.isArray(data.statusIds) && data.statusIds.length > 0)
            })
            .catch(() => setPinned(false))
    }, [projectId, activeStatuses])

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

    const togglePanel = () => {
        if (!open) {
            window.dispatchEvent(new CustomEvent('toolbar:close', { detail: PANEL_ID }))
        }
        setOpen(v => !v)
    }

    const handlePin = async () => {
        if (saving) return
        setSaving(true)
        try {
            if (pinned) {
                await projectFiltersApi.clear(projectId)
                setPinned(false)
            } else {
                await projectFiltersApi.save(projectId, {
                    statusIds: activeStatuses,
                })
                setPinned(true)
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async () => {
        onClear && onClear()

        if (pinned && projectId) {
            try {
                await projectFiltersApi.clear(projectId)
            } catch (err) {
                console.error('Failed to clear pinned filter:', err)
            }
            setPinned(false)
        }
    }

    const canReset = activeStatuses.length > 0 || pinned
    const canPin = !saving && activeStatuses.length > 0
    const count = activeStatuses.length

    return (
        <div className="filters-bar" ref={ref}>
            <div className="filters-bar__group">
                <button
                    type="button"
                    className="filters-bar__action filters-bar__action--clear"
                    onClick={handleReset}
                    disabled={!canReset}
                    title={t.resetFilters}
                >
                    🧹
                </button>

                <button
                    className="filters-bar__btn"
                    onClick={togglePanel}
                >
                    <span className="filters-bar__btn-icon">⚙</span>
                    <span className="filters-bar__btn-label">{t.filters}</span>
                    <span className={`filters-bar__badge-slot ${count > 0 ? 'filters-bar__badge-slot--visible' : ''}`}>
                        {count > 0 ? count : ''}
                    </span>
                </button>

                <button
                    type="button"
                    className={`filters-bar__action filters-bar__action--pin ${pinned ? 'filters-bar__action--pin-active' : ''}`}
                    onClick={handlePin}
                    disabled={!canPin && !pinned}
                    title={pinned ? t.unpinFilter : t.pinFilter}
                >
                    {saving ? '…' : '📌'}
                </button>
            </div>

            {open && (
                <div className="filters-bar__panel">
                    <div className="filters-bar__title">{t.showStatuses}</div>
                    <div className="filters-bar__statuses">
                        {columns.map(col => (
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
                                <span>{col.title}</span>
                                <span className="filters-bar__count">{col.count}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}