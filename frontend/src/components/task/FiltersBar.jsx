import { useState } from 'react'

export default function FiltersBar({ columns, activeStatuses, onStatusToggle, onClear }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="filters-bar">
            <button
                className="filters-bar__btn"
                onClick={() => setOpen(v => !v)}
            >
                <span>⚙</span>
                <span>Фильтры</span>
                {activeStatuses.length > 0 && (
                    <span className="filters-bar__badge">{activeStatuses.length}</span>
                )}
            </button>

            {activeStatuses.length > 0 && (
                <button className="filters-bar__clear" onClick={onClear}>
                    Сбросить
                </button>
            )}

            {open && (
                <div className="filters-bar__panel">
                    <div className="filters-bar__title">Показать статусы:</div>
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
                    <button
                        className="filters-bar__close"
                        onClick={() => setOpen(false)}
                    >
                        Готово
                    </button>
                </div>
            )}
        </div>
    )
}