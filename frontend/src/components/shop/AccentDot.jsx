/**
 * Кружок-превью акцента.
 * Использует data-accent, чтобы подхватить --accent / --accent-gradient из index.css.
 * Одинаковый вид везде — и в профиле, и в магазине.
 */
export default function AccentDot({
                                      code,
                                      size = 40,
                                      active = false,
                                      onClick,
                                      title,
                                      className = '',
                                  }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            data-accent={code}
            className={[
                'accent-dot',
                active ? 'accent-dot--active' : '',
                className,
            ].filter(Boolean).join(' ')}
            style={{
                '--accent-dot-size': `${size}px`,
            }}
        />
    )
}