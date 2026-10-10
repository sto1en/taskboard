import { SvgAvatar } from './SvgAvatars'

export default function AvatarWithFrame({
                                            avatar,
                                            frame,
                                            displayName,
                                            username,
                                            size,
                                            className = '',
                                        }) {
    const initial = (displayName || username || 'U').charAt(0).toUpperCase()
    const code = avatar?.code
    const emoji = avatar?.emoji
    const imageUrl = avatar?.imageUrl

    const frameCssClass = frame?.cssClass || ''

    const svgNode = code ? SvgAvatar({ code }) : null

    const outerStyle = size
        ? { width: size, height: size }
        : undefined

    let content = null

    if (svgNode) {
        content = svgNode
    } else if (emoji) {
        content = <span className="avatar-frame__emoji">{emoji}</span>
    } else if (imageUrl) {
        content = (
            <img
                src={imageUrl}
                alt={displayName || username}
                className={`avatar-frame__img avatar-frame__img--${code || 'default'}`}
                draggable={false}
            />
        )
    } else {
        content = <span className="avatar-frame__initial">{initial}</span>
    }

    return (
        <div
            className={`avatar-frame ${frameCssClass} ${className}`}
            style={outerStyle}
            title={displayName || username}
        >
            <div className="avatar-frame__inner">
                {content}
            </div>
        </div>
    )
}