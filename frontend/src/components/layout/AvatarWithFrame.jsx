import { SvgAvatar } from './SvgAvatars'
import { resolveUrl } from '../../utils/format'

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
    const code = avatar?.code
    const emoji = avatar?.emoji
    const imageUrl = resolveUrl(avatar?.imageUrl)

    const frameCssClass = frame?.cssClass || ''

    const svgNode = code ? SvgAvatar({ code }) : null

    const outerStyle = { width: size, height: size }
    const textStyle = { fontSize: Math.round(size * 0.45) }
    const emojiStyle = { fontSize: Math.round(size * 0.6) }

    let content = null

    if (svgNode) {
        content = svgNode
    } else if (emoji) {
        content = <span className="avatar-frame__emoji" style={emojiStyle}>{emoji}</span>
    } else if (imageUrl) {
        content = (
            <img
                src={imageUrl}
                alt={displayName || username || ''}
                className="avatar-frame__img"
                data-code={code || undefined}
                draggable={false}
            />
        )
    } else {
        content = <span className="avatar-frame__initial" style={textStyle}>{initial}</span>
    }

    return (
        <div
            className={`avatar-frame ${frameCssClass} ${className}`}
            style={outerStyle}
            title={displayName || username}
        >
            {content}
        </div>
    )
}