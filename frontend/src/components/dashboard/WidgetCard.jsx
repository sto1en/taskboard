// frontend/src/components/dashboard/WidgetCard.jsx

/**
 * Оболочка виджета: заголовок, кнопки управления и сетка.
 *
 * Управление намеренно простое (выше/ниже/шире/убрать) — без drag&drop,
 * чтобы страница работала и на тач-устройствах. Порядок и размеры
 * сохраняются в localStorage в DashboardPage.
 */

export default function WidgetCard({
    meta,
    widget,
    index,
    total,
    onMove,
    onResize,
    onRemove,
    children,
}) {
    return (
        <section className={`dw-card dw-card--${widget.size || 'small'}`}>
            <header className="dw-card__head">
                <div className="dw-card__title">
                    <span className="dw-card__icon" aria-hidden="true">{meta.icon}</span>
                    <span>{meta.title}</span>
                </div>
                <div className="dw-card__actions">
                    <button
                        type="button"
                        className="dw-card__action"
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        title="Выше"
                        aria-label="Переместить виджет выше"
                    >↑</button>
                    <button
                        type="button"
                        className="dw-card__action"
                        onClick={() => onMove(index, 1)}
                        disabled={index === total - 1}
                        title="Ниже"
                        aria-label="Переместить виджет ниже"
                    >↓</button>
                    <button
                        type="button"
                        className="dw-card__action"
                        onClick={() => onResize(widget.id)}
                        title={widget.size === 'wide' ? 'Сделать уже' : 'Сделать шире'}
                        aria-label="Изменить ширину виджета"
                    >{widget.size === 'wide' ? '⇤' : '⇥'}</button>
                    <button
                        type="button"
                        className="dw-card__action dw-card__action--danger"
                        onClick={() => onRemove(widget.id)}
                        title="Убрать виджет"
                        aria-label="Убрать виджет"
                    >×</button>
                </div>
            </header>

            <div className="dw-card__body">
                {children}
            </div>
        </section>
    )
}
