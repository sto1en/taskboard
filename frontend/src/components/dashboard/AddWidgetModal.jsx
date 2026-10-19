// frontend/src/components/dashboard/AddWidgetModal.jsx

import Modal from '../modal/Modal'
import { WIDGET_LIBRARY } from './DashboardWidgets'

export default function AddWidgetModal({ open, onClose, layout, onAdd, onReset }) {
    const used = new Set((layout || []).map(w => w.type))
    const entries = Object.entries(WIDGET_LIBRARY)

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Виджеты стартовой страницы"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onReset}>
                        Сбросить к стандартным
                    </button>
                    <div className="modal__foot-spacer"/>
                    <button type="button" className="btn btn-primary" onClick={onClose}>
                        Готово
                    </button>
                </>
            }
        >
            <div className="dash-library">
                <p className="dash-library__hint">
                    Собери стартовую страницу под себя: добавляй, убирай и меняй
                    ширину виджетов. Раскладка сохраняется в этом браузере.
                </p>

                <div className="dash-library__grid">
                    {entries.map(([type, meta]) => {
                        const added = used.has(type)
                        return (
                            <div
                                key={type}
                                className={`dash-library__item ${added ? 'dash-library__item--added' : ''}`}
                            >
                                <div className="dash-library__icon" aria-hidden="true">{meta.icon}</div>
                                <div className="dash-library__body">
                                    <div className="dash-library__title">{meta.title}</div>
                                    <div className="dash-library__desc">{meta.description}</div>
                                </div>
                                {added ? (
                                    <span className="dash-library__added">На странице</span>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-primary dash-library__add"
                                        onClick={() => onAdd(type)}
                                    >
                                        Добавить
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </Modal>
    )
}
