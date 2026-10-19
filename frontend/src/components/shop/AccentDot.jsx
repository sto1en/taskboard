export default function AccentDot({
                                      code,
                                      hexColor,
                                      hexColorSecondary,
                                      hexColorTertiary,
                                      isGradient = false,
                                      isRare = false,
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
        if (isRare) {
            // Редкий — металл: кольцо собирается из трёх стопов, заливка
            // прозрачная (см. .accent-dot--rare в index.css).
            const m1 = hexColor
            const m2 = hexColorSecondary || hexColor
            const m3 = hexColorTertiary || hexColorSecondary || hexColor
            style['--accent-metal-1'] = m1
            style['--accent-metal-2'] = m2
            style['--accent-metal-3'] = m3
            style['--accent-metal'] =
                `linear-gradient(115deg, ${m1} 0%, ${m2} 34%, ${m3} 58%, ${m2} 78%, ${m1} 100%)`
        } else if (isGradient && hexColorSecondary) {
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
                isRare ? 'accent-dot--rare' : '',
                className,
            ].filter(Boolean).join(' ')}
            style={style}
        />
    )
}
