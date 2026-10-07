import { SvgAvatar } from './SvgAvatars'

export default function AvatarWithFrame({
                                            avatar,
                                            frame,
                                            displayName,
                                            username,
                                            size = 36,
                                            className = '',
                                        }) {
    const initial = (displayName || username || 'U').charAt(0).toUpperCase()
    const imageUrl = avatar?.imageUrl
    const emoji = avatar?.emoji
    const code = avatar?.code || 'default'
    const frameCssClass = frame?.cssClass || ''

    const svgNode = SvgAvatar({ code })

    return (
        <div
            className={`avatar-frame ${frameCssClass} ${className}`}
            style={{ width: size, height: size }}
            title={displayName || username}
        >
            <div className="avatar-frame__inner">
                {svgNode ? (
                    svgNode
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={displayName || username}
                        className={`avatar-frame__img avatar-frame__img--${code}`}
                        draggable={false}
                    />
                ) : emoji ? (
                    <span className="avatar-frame__emoji">{emoji}</span>
                ) : (
                    <span className="avatar-frame__initial">{initial}</span>
                )}
            </div>
        </div>
    )
}