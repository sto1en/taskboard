/**
 * Мини-превью акцента: точка + полоска + кнопка.
 * Стилизуется через data-accent-preview в profile.css,
 * берёт те же градиенты, что и карточки в магазине.
 */
export default function AccentSwatch({ code, active, onClick, title }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`accent-swatch ${active ? 'accent-swatch--active' : ''}`}
            data-accent-preview={code}
        >
            <span className="accent-swatch__dot" />
            <span className="accent-swatch__bar" />
            <span className="accent-swatch__btn">Кнопка</span>
        </button>
    )
}