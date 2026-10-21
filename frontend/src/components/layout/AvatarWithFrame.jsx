import AvatarArt from './AvatarArt'

/**
 * Единый компонент аватарки с рамкой.
 *
 * props:
 *   avatar      — { code?, emoji?, imageUrl? }
 *   frame       — { cssClass? }
 *   displayName — имя для подсказки и инициала
 *   username    — fallback-имя
 *   size        — число, размер квадрата (по умолчанию 36)
 *   className   — доп. классы
 */
export default function AvatarWithFrame({
                                            avatar,
                                            frame,
                                            displayName,
                                            username,
                                            size = 36,
                                            className = '',
                                        }) {
    const initial = (displayName || username || 'U').charAt(0).toUpperCase()

    const frameCssClass = frame?.cssClass || ''

    const outerStyle = { width: size, height: size }
    const textStyle = { fontSize: Math.round(size * 0.45) }

    return (
        <div
            className={`avatar-frame ${frameCssClass} ${className}`}
            style={outerStyle}
            title={displayName || username}
        >
            <AvatarArt
                avatar={avatar}
                title={displayName || username || initial}
                emojiSize={Math.round(size * 0.6)}
                style={textStyle}
            />
        </div>
    )
}
