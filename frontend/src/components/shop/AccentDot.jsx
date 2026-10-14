export default function AccentDot({
                                      code,
                                      hexColor,
                                      hexColorSecondary,
                                      isGradient = false,
                                      size = 40,
                                      active = false,
                                      onClick,
                                      title,
                                      className = '',
                                  }) {
    // Инлайн-стиль если есть кастомные hex
    let style = {
        '--accent-dot-size': `${size}px`,
    }

    if (hexColor) {
        if (isGradient && hexColorSecondary) {
            const grad = `linear-gradient(135deg, ${hexColor} 0%, ${hexColorSecondary} 100%)`
            style.backgroundImage = grad
            style.background = grad
            style.backgroundColor = 'transparent'
        } else {
            style.background = hexColor
            style.backgroundColor = hexColor
            style.backgroundImage = 'none'
        }
    }

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
            style={style}
        />
    )
}